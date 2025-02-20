import { API_URL, ESSENTIAL, expect, Page, Request, test } from './utils';
import { AUDIO_METADATA, CAMPAIGN, CONFIDENCE, FILE_RANGE, LABEL, SPECTROGRAM_CONFIGURATION, USERS } from './fixtures';
import { LabelModal } from './utils/pages';
import { WriteAnnotationCampaign } from '../src/service/campaign';

// Utils

const STEP = {
  checkLabelState: (modal: LabelModal, label: string, state: boolean) => test.step(`${ label } is ${ state ? '' : 'un' }checked`, async () => {
    await expect(modal.getByText(label)).toBeVisible()
    await expect(modal.getCheckbox(label)).toHaveAttribute('checked', state ? 'true' : 'false');
  }),

  accessArchive: (page: Page) => test.step('Access archive', () => expect(page.campaign.detail.archiveButton).toBeEnabled()),
  accessDownloadCSV: async (page: Page) => {
    await test.step('Access spectrogram configuration download', async () => {
      const modal = await page.campaign.detail.openSpectrogramModal();
      await expect(modal.downloadButton).toBeEnabled();
      await modal.close()
    })
    await test.step('Access audio metadata download', async () => {
      const modal = await page.campaign.detail.openAudioModal();
      await expect(modal.downloadButton).toBeEnabled();
      await modal.close()
    })
    await test.step('Access progress downloads and update', async () => {
      const modal = await page.campaign.detail.openProgressModal();
      await expect(modal.downloadResultsButton).toBeEnabled();
      await expect(modal.downloadStatusButton).toBeEnabled();
      await modal.close()
    })
  },
  accessLabelUpdate: (page: Page) => test.step('Access label set update', async () => {
    const modal = await page.campaign.detail.openLabelModal();
    await expect(modal.updateButton).toBeEnabled();
    await modal.close()
  }),
  accessManageAnnotators: (page: Page) => test.step('Access manage annotators', async () => {
    const modal = await page.campaign.detail.openProgressModal();
    await expect(modal.manageButton).toBeEnabled();
    await modal.close()
  }),
}

// Tests

test.describe('Annotator', () => {

  test('Global', async ({ page }) => {
    await page.campaign.detail.go('annotator');
    await expect(page.getByRole('heading', { name: CAMPAIGN.name })).toBeVisible();
    await expect(page.getByText(`Created on ${ new Date(CAMPAIGN.created_at).toLocaleDateString() } by ${ CAMPAIGN.owner }`)).toBeVisible();
    await expect(page.getByText(CAMPAIGN.desc)).toBeVisible();
    await expect(page.getByText(new Date(CAMPAIGN.deadline).toLocaleDateString())).toBeVisible();
    await expect(page.getByText(`${ CAMPAIGN.usage } annotations`)).toBeVisible();

    await test.step('Cannot archive', async () => {
      await expect(page.campaign.detail.archiveButton).not.toBeVisible();
    })
  })

  test('Label & Confidence', async ({ page }) => {
    await page.campaign.detail.go('annotator');
    await test.step('See set names', async () => {
      await expect(page.getByText(LABEL.set.name)).toBeVisible();
      await expect(page.getByText(CONFIDENCE.set.name)).toBeVisible();
    })

    const modal = await page.campaign.detail.openLabelModal();
    await STEP.checkLabelState(modal, LABEL.classic, false);
    await STEP.checkLabelState(modal, LABEL.withFeatures, true);

    await test.step('Cannot update', async () => {
      await expect(modal.updateButton).not.toBeVisible();
    })
  })

  test('Spectrogram configuration', async ({ page }) => {
    await page.campaign.detail.go('annotator');
    const modal = await page.campaign.detail.openSpectrogramModal();
    await expect(modal.getByText(`NFFT${ SPECTROGRAM_CONFIGURATION.nfft }`)).toBeVisible();

    await test.step('Cannot download', async () => {
      await expect(modal.downloadButton).not.toBeVisible()
    })
  })

  test('Audio metadata', async ({ page }) => {
    await page.campaign.detail.go('annotator');
    const modal = await page.campaign.detail.openAudioModal();
    await expect(modal.getByText(`Files subtypes${ AUDIO_METADATA.files_subtypes }`)).toBeVisible();

    await test.step('Cannot download', async () => {
      await expect(modal.downloadButton).not.toBeVisible()
    })
  })

  test('Progress', async ({ page }) => {
    await page.campaign.detail.go('annotator');
    const modal = await page.campaign.detail.openProgressModal();
    await expect(modal.getByText(`${ USERS.annotator.first_name } ${ USERS.annotator.last_name }`)).toBeVisible();
    await expect(modal.getByText(USERS.creator.first_name)).not.toBeVisible();

    await test.step('Cannot download', async () => {
      await expect(modal.downloadStatusButton).not.toBeVisible()
      await expect(modal.downloadStatusButton).not.toBeVisible()
    })

    await test.step('Cannot manage', async () => {
      await expect(modal.manageButton).not.toBeVisible()
    })
  })

  test('Files', ESSENTIAL, async ({ page }) => {
    await page.campaign.detail.go('annotator');
    await test.step('See files', async () => {
      await expect(page.locator('.table-content').first()).toBeVisible();
    })
    await test.step('Can search file', async () => {
      await page.mock.fileRangesFiles()
      await Promise.all([
        page.waitForRequest(/\/api\/annotation-file-range\/campaign\/.*search/g),
        page.campaign.detail.searchFile(FILE_RANGE.submittedFile.filename)
      ])
      await page.campaign.detail.searchFile(undefined);
    })
    await test.step('Add Non submitted filter', async () => {
      await page.mock.fileRangesFiles()
      await Promise.all([
        page.waitForRequest(/.*\/api\/annotation-file-range\/campaign\/.*is_submitted=false/g),
        page.getByText('Non submitted').click()
      ])
      await page.getByText('Non submitted').click()
    })
    await test.step('Add With annotations filter', async () => {
      await page.mock.fileRangesFiles()
      await Promise.all([
        page.waitForRequest(/.*\/api\/annotation-file-range\/campaign\/.*with_user_annotations=true/g),
        page.getByText('With annotations').click(),
      ])
      await page.getByText('With annotations').click();
    })
    await test.step('Add Label filter', async () => {
      await page.mock.fileRangesFiles()
      await Promise.all([
        page.waitForRequest(/.*\/api\/annotation-file-range\/campaign\/.*label/g),
        page.getByText('Label filter').click(),
      ])
      await expect(page.getByText(LABEL.classic)).toBeVisible();
    })
  })

  test('Can annotate submitted file', ESSENTIAL, async ({ page }) => {
    await page.campaign.detail.go('annotator');
    await page.mock.annotator()
    const button = page.locator('.table-content.disabled ion-button')
    await button.waitFor()
    await Promise.all([
      page.waitForURL(/.*\/annotation-campaign\/-?\d+\/file\/-?\d+/g),
      button.click(),
    ])
  })

  test('Can annotate unsubmitted file', ESSENTIAL, async ({ page }) => {
    await page.campaign.detail.go('annotator');
    await page.mock.annotator()
    const button = page.locator('.table-content:not(.disabled) ion-button')
    await button.waitFor()
    await Promise.all([
      page.waitForURL(/.*\/annotation-campaign\/-?\d+\/file\/-?\d+/g),
      button.click(),
    ])
  })

  test('Can resume annotation', ESSENTIAL, async ({ page }) => {
    await page.campaign.detail.go('annotator');
    await page.mock.annotator()
    await Promise.all([
      page.waitForURL(/.*\/annotation-campaign\/-?\d+\/file\/-?\d+/g),
      page.campaign.detail.resumeButton.click(),
    ])
  })

  test('Empty', ESSENTIAL, async ({ page }) => {
    await page.campaign.detail.go('annotator', { empty: true });

    await test.step('Spectrogram configurations', async () => {
      const modal = await page.campaign.detail.openSpectrogramModal();
      await expect(modal.getByText('No spectrogram configuration')).toBeVisible();
      await modal.close()
    })

    await test.step('Audio metadata', async () => {
      const modal = await page.campaign.detail.openAudioModal();
      await expect(modal.getByText('No metadata')).toBeVisible();
      await modal.close()
    })

    await test.step('Progress', async () => {
      const modal = await page.campaign.detail.openProgressModal();
      await expect(modal.getByText('No annotators')).toBeVisible();
      await modal.close()
    })

    await test.step('Files', async () => {
      await expect(page.getByText('No files to annotate')).toBeVisible();
      await expect(page.campaign.detail.resumeButton).not.toBeVisible();
    })
  })
})

test.describe('Campaign creator', () => {

  test('Can archive', async ({ page }) => {
    await page.campaign.detail.go('creator');
    await page.campaign.detail.archiveButton.click();
    const alert = page.locator('ion-alert').first()
    await expect(alert).toBeVisible();
    await Promise.all([
      page.waitForRequest(API_URL.campaign.archive),
      alert.getByRole('button', { name: 'Archive' }).click(),
    ])
  })

  test('Can update labels with features', async ({ page }) => {
    await page.campaign.detail.go('creator');
    const modal = await page.campaign.detail.openLabelModal()

    await test.step('Check current state', async () => {
      await STEP.checkLabelState(modal, LABEL.classic, false);
      await STEP.checkLabelState(modal, LABEL.withFeatures, true);
    })

    await test.step('Update state', async () => {
      await test.step('Enable update', async () => {
        const button = modal.getByRole('button', { name: 'Update' })
        await expect(button).toBeVisible();
        await button.click();
      })

      await modal.getCheckbox(LABEL.classic).click()
      await modal.getCheckbox(LABEL.withFeatures).click()

      const request: Request = await test.step('Confirm update', async () => {
        const button = modal.getByRole('button', { name: 'Save' })
        await expect(button).toBeVisible();
        const [ request ] = await Promise.all([
          page.waitForRequest(/\/api\/annotation-campaign\/-?\d\/?/g),
          button.click(),
        ])
        return request;
      })

      await test.step('Check request', async () => {
        const data = await request.postDataJSON();
        const expected: Partial<WriteAnnotationCampaign> = {
          labels_with_acoustic_features: [ LABEL.classic ]
        }
        expect(data).toEqual(expected);
      })
    })
  })

  test('Can download spectrogram configuration', async ({ page }) => {
    await page.campaign.detail.go('creator');
    const modal = await page.campaign.detail.openSpectrogramModal()
    await Promise.all([
      page.waitForRequest(API_URL.spectrogram.export),
      modal.downloadButton.click(),
    ])
  })

  test('Can download audio metadata', async ({ page }) => {
    await page.campaign.detail.go('creator');
    const modal = await page.campaign.detail.openAudioModal();
    await Promise.all([
      page.waitForRequest(API_URL.audio.export),
      modal.downloadButton.click(),
    ])
  })

  test('Can download progress results and status', async ({ page }) => {
    await page.campaign.detail.go('creator');
    const modal = await page.campaign.detail.openProgressModal()

    await test.step('Results', () => Promise.all([
      page.waitForRequest(API_URL.campaign.report),
      modal.downloadResultsButton.click(),
    ]))

    await test.step('Status', () => Promise.all([
      page.waitForRequest(API_URL.campaign.reportStatus),
      modal.downloadStatusButton.click(),
    ]))
  })

  test('Can manage annotators', async ({ page }) => {
    await page.campaign.detail.go('creator');
    const modal = await page.campaign.detail.openProgressModal()
    await Promise.all([
      page.waitForURL(/.*\/annotation-campaign\/-?\d+\/edit\/?/g),
      modal.manageButton.click(),
    ])
  })

  test('Empty', async ({ page }) => {
    await page.campaign.detail.go('creator', { empty: true });

    await test.step('Spectrogram configurations', async () => {
      const modal = await page.campaign.detail.openSpectrogramModal();
      await expect(modal.downloadButton).not.toBeVisible();
      await modal.close()
    })

    await test.step('Audio metadata', async () => {
      const modal = await page.campaign.detail.openAudioModal();
      await expect(modal.downloadButton).not.toBeVisible();
      await modal.close()
    })

    await test.step('Progress', async () => {
      const modal = await page.campaign.detail.openProgressModal();
      await expect(modal.downloadStatusButton).not.toBeVisible();
      await expect(modal.downloadStatusButton).not.toBeVisible();
      await expect(modal.manageButton).toBeVisible();
      await modal.close()
    })

    await test.step('Archive', async () => {
      await Promise.all([
        page.waitForRequest(API_URL.campaign.archive),
        page.campaign.detail.archiveButton.click(),
      ])
    })
  })

})

test('Staff', async ({ page }) => {
  await page.campaign.detail.go('staff');

  await STEP.accessArchive(page)
  await STEP.accessDownloadCSV(page)
  await STEP.accessLabelUpdate(page)
  await STEP.accessManageAnnotators(page)
})

test('Superuser', ESSENTIAL, async ({ page }) => {
  await page.campaign.detail.go('superuser');

  await STEP.accessArchive(page)
  await STEP.accessDownloadCSV(page)
  await STEP.accessLabelUpdate(page)
  await STEP.accessManageAnnotators(page)
})
