import { ESSENTIAL, expect, test } from './utils';
import { CAMPAIGN, COMMENT, CONFIDENCE, FILE_RANGE, LABEL, UserType } from './fixtures';
import { BoxBounds } from '../src/service/campaign/result';

// Utils

function getTag(isNew: boolean) {
  return `[${ isNew ? 'new' : 'old' }]`
}

const TEST = {
  accessOtherAnnotator: (as: UserType, { isNew, can }: { isNew: boolean, can: boolean }) => {
    return test(`${ getTag(isNew) } Can${ can ? '' : 'not' } try other annotator`, async ({ page }) => {
      const annotator = isNew ? page.annotatorNew : page.annotator;
      await annotator.go(as, { mode: 'Create' });
      if (can) {
        await annotator.tryOtherButton.click()
        await page.waitForURL(`/app/annotation-campaign/${ CAMPAIGN.id }/file/${ FILE_RANGE.unsubmittedFile.id }${ isNew ? '' : '/new' }`)
      } else {
        await expect(annotator.tryOtherButton).not.toBeVisible();
      }
    })
  },
  canGoBack: (as: UserType, { isNew }: { isNew: boolean }) => {
    return test(`${ getTag(isNew) } Can go back to campaign`, ESSENTIAL, async ({ page }) => {
      const annotator = isNew ? page.annotatorNew : page.annotator;
      await annotator.go(as, { mode: 'Create' });
      await annotator.backToCampaignButton.click();
      await page.waitForURL(`/app/annotation-campaign/${ CAMPAIGN.id }`)
    })
  },
  empty: (as: UserType, { isNew }: { isNew: boolean }) => {
    return test(`${ getTag(isNew) } Empty`, ESSENTIAL, async ({ page }) => {
      const annotator = isNew ? page.annotatorNew : page.annotator;
      await annotator.go(as, { mode: 'Create', empty: true });
      await expect(page.getByText('Confidence indicator ')).toBeVisible();

      await test.step('See no results', () => expect(page.getByText('No results')).toBeVisible())

      await test.step('Can add presence - mouse', async () => {
        const label = annotator.getLabel(LABEL.classic);
        expect(await label.getLabelState()).toBeFalsy();
        await label.addPresence();
        await expect(label.getWeakResult()).toBeVisible();
        expect(await label.getLabelState()).toBeTruthy();
      })

      await test.step('Can add presence - keyboard', async () => {
        const label = annotator.getLabel(LABEL.withFeatures);
        expect(await label.getLabelState()).toBeFalsy();
        await page.keyboard.press('2')
        await expect(label.getWeakResult()).toBeVisible();
        expect(await label.getLabelState()).toBeTruthy();
      })

      await test.step('Can remove presence', async () => {
        const label = annotator.getLabel(LABEL.classic);
        await label.remove();
        await expect(label.getWeakResult()).not.toBeVisible();
        expect(await label.getLabelState()).toBeFalsy();
      })

      await test.step('Can update confidence', async () => {
        const label = annotator.getLabel(LABEL.withFeatures);
        await label.getWeakResult().click();
        await expect(page.getByText(CONFIDENCE.sure.label, { exact: true }).nth(1)).toBeVisible()
        await expect(page.getByText(CONFIDENCE.notSure.label, { exact: true }).nth(1)).not.toBeVisible()
        const confidence = annotator.getConfidence(CONFIDENCE.notSure.label);
        await confidence.select()
        await expect(page.getByText(CONFIDENCE.sure.label, { exact: true }).nth(1)).not.toBeVisible()
        await expect(page.getByText(CONFIDENCE.notSure.label, { exact: true }).nth(1)).toBeVisible()
      })

      await test.step('Can add presence comment', async () => {
        await annotator.commentInput.fill(COMMENT.presence.comment);
        await expect(page.getByText(COMMENT.presence.comment)).toBeVisible();
      })

      await test.step('Can add task comment', async () => {
        await annotator.taskCommentButton.click();
        await expect(page.getByText(COMMENT.presence.comment)).not.toBeVisible();
        await annotator.commentInput.fill(COMMENT.task.comment);
        await expect(page.getByText(COMMENT.task.comment)).toBeVisible();
      })

      await test.step('Can switch to presence comment', async () => {
        const label = annotator.getLabel(LABEL.withFeatures);
        await label.getWeakResult().click();
        await expect(page.getByText(COMMENT.task.comment)).not.toBeVisible();
        await expect(page.getByText(COMMENT.presence.comment)).toBeVisible();
      })

      await test.step('Can add box', async () => {
        const label = annotator.getLabel(LABEL.withFeatures);
        await label.getWeakResult().click();

        const bounds = await annotator.draw('Box') as BoxBounds;
        console.log('Bounds', JSON.stringify(bounds));

        await expect(label.getNthStrongResult(0)).toBeVisible();
        await expect(annotator.resultsBlock.getByText(Math.floor(bounds.start_time).toString()).first()).toBeVisible();
        await expect(annotator.resultsBlock.getByText(Math.floor(bounds.end_time).toString()).first()).toBeVisible();
        await expect(annotator.resultsBlock.getByText(bounds.start_frequency.toString()).first()).toBeVisible();
        await expect(annotator.resultsBlock.getByText(bounds.end_frequency.toString()).first()).toBeVisible();
      })

      await test.step('Can remove box', async () => {
        await annotator.removeStrong()
        const label = annotator.getLabel(LABEL.withFeatures);
        await expect(label.getNthStrongResult(0)).not.toBeVisible();
      })

      if (isNew) {
        await test.step('Can add point', async () => {
          const label = annotator.getLabel(LABEL.withFeatures);
          await label.getWeakResult().click();

          const bounds = await annotator.draw('Point');

          await expect(label.getNthStrongResult(0)).toBeVisible();
          await expect(annotator.resultsBlock.getByText(Math.floor(bounds.start_time).toString()).first()).toBeVisible();
          await expect(annotator.resultsBlock.getByText(bounds.start_frequency.toString()).first()).toBeVisible();
        })

        await test.step('Can remove point', async () => {
          await annotator.removeStrong()
          const label = annotator.getLabel(LABEL.withFeatures);
          await expect(label.getNthStrongResult(0)).not.toBeVisible();
        })
      }

      await test.step('Can remove presence with boxes', async () => {
        const label = annotator.getLabel(LABEL.withFeatures);
        await label.getWeakResult().click();

        await annotator.draw('Box');
        await label.remove();
        await expect(label.getWeakResult()).not.toBeVisible();
        await expect(label.getNthStrongResult(0)).not.toBeVisible();
        expect(await label.getLabelState()).toBeFalsy();
      })

      await test.step('Can submit - mouse', async () => {
        const [ request ] = await Promise.all([
          page.waitForRequest(`/api/annotator/campaign/${ CAMPAIGN.id }/file/${ FILE_RANGE.unsubmittedFile.id }/`),
          annotator.submitButton.click()
        ])
        const submittedData = request.postDataJSON();
        expect(submittedData.results).toEqual([]);
        expect(submittedData.task_comments).toEqual([ { comment: COMMENT.task.comment } ]);
      })

      await test.step('Can submit - keyboard', async () => {
        const [ request ] = await Promise.all([
          page.waitForRequest(`/api/annotator/campaign/${ CAMPAIGN.id }/file/${ FILE_RANGE.unsubmittedFile.id }/`),
          page.keyboard.press('Enter')
        ])
        const submittedData = request.postDataJSON();
        expect(submittedData.results).toEqual([]);
        expect(submittedData.task_comments).toEqual([ { comment: COMMENT.task.comment } ]);
      })
    })
  },
  noConfidence: (as: UserType, { isNew }: { isNew: boolean }) => {
    return test(`${ getTag(isNew) } No confidence`, ESSENTIAL, async ({ page }) => {
      const annotator = isNew ? page.annotatorNew : page.annotator;
      await annotator.go(as, { mode: 'Create', noConfidence: true });
      await expect(page.getByText('Confidence indicator ')).not.toBeVisible();
    })
  }
}

// Tests

test.describe('Annotator', () => {
  TEST.accessOtherAnnotator('annotator', { isNew: false, can: false })

  TEST.canGoBack('annotator', { isNew: false })
  TEST.empty('annotator', { isNew: false })
  TEST.noConfidence('annotator', { isNew: false })
})

test.describe('Creator', () => {
  TEST.accessOtherAnnotator('creator', { isNew: false, can: false })
})

test.describe('Staff', () => {
  TEST.accessOtherAnnotator('staff', { isNew: false, can: true })
  TEST.accessOtherAnnotator('staff', { isNew: true, can: true })

  TEST.canGoBack('staff', { isNew: true })
  TEST.empty('staff', { isNew: true })
  TEST.noConfidence('staff', { isNew: true })
})

test.describe('Superuser', () => {
  TEST.accessOtherAnnotator('superuser', { isNew: false, can: true })
  TEST.accessOtherAnnotator('superuser', { isNew: true, can: true })
})