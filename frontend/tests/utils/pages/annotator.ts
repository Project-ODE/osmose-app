import { expect, Locator, Page, test } from '@playwright/test';
import { UserType } from '../../fixtures';
import { CampaignDetailPage } from './campaign-detail';
import { Mock } from '../services';
import { AnnotationCampaignUsage } from '../../../src/service/campaign';
import { BoxBounds } from '../../../src/service/campaign/result';

export type Label = {
  addPresence: () => Promise<void>;
  selectLabel: () => Promise<void>;
  getLabelState: () => Promise<boolean>;
  remove: () => Promise<void>;
  getPresenceResult: () => Locator;
  getNthBoxResult: (nth: number) => Locator;
}
export type Confidence = {
  select: () => Promise<void>;
}

export type Validation = {
  validate: () => Promise<void>;
  invalidate: () => Promise<void>;
  expectState: (isValid: boolean) => Promise<void>;
}

export class AnnotatorPage {

  get backToCampaignButton(): Locator {
    return this.page.getByRole('button', { name: 'Back to Campaign' });
  }

  get tryOtherButton(): Locator {
    return this.page.getByRole('button', { name: 'Try new annotator' });
  }

  get commentInput(): Locator {
    return this.page.getByPlaceholder('Enter your comment');
  }

  get taskCommentButton(): Locator {
    return this.page.getByRole('button', { name: 'Task Comment' });
  }

  get resultsBlock(): Locator {
    return this.page.locator('.results');
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Submit & load next recording' })
  }

  private getValidationWithButtons(validateBtn: Locator, invalidateBtn: Locator): Validation {
    return {
      validate: async () => {
        await validateBtn.click()
      },
      invalidate: async () => {
        await invalidateBtn.click()
      },
      expectState: async (isValid: boolean) => {
        await expect(validateBtn).toHaveAttribute('color', isValid ? 'success' : 'medium')
        await expect(invalidateBtn).toHaveAttribute('color', isValid ? 'medium' : 'danger')
      }
    }
  }

  get presenceValidation(): Validation {
    return this.getValidationWithButtons(
      this.page.locator('ion-button.validate').first(),
      this.page.locator('ion-button.invalidate').first(),
    )
  }

  get boxValidation(): Validation {
    return this.getValidationWithButtons(
      this.page.locator('ion-button.validate').nth(1),
      this.page.locator('ion-button.invalidate').nth(1),
    )
  }

  constructor(protected page: Page,
              private mock = new Mock(page),
              private detail = new CampaignDetailPage(page)) {
  }

  async go(as: UserType, options: {
    mode: AnnotationCampaignUsage,
    empty?: boolean,
    noConfidence?: boolean
  }) {
    await test.step('Navigate to Annotator', async () => {
      await this.detail.go(as, { noConfidence: options.noConfidence, mode: options.mode })
      await this.mock.confidenceSetDetail()
      await this.mock.labelSetDetail()
      await this.mock.campaignDetail(false, options?.mode, !options.noConfidence)
      await this.mock.annotator(options.mode, options.empty)
      await this.detail.resumeButton.click()
    });
  }

  getLabel(label: string): Label {
    return {
      addPresence: async () => {
        await this.page.getByRole('checkbox', { name: label }).check()
      },
      remove: async () => {
        await this.page.getByRole('checkbox', { name: label }).click()
        const alert = this.page.getByRole('dialog')
        await alert.getByRole('button', { name: `Remove "${ label }" annotations` }).click()
      },
      selectLabel: async () => {
        await this.page.locator('ion-chip').filter({ hasText: label }).click()
      },
      getPresenceResult: () => {
        return this.resultsBlock.getByText(label).first()
      },
      getNthBoxResult: (nth: number) => {
        return this.resultsBlock.getByText(label).nth(1 + nth)
      },
      getLabelState: async () => {
        const disabled = await this.page.locator('ion-chip').filter({ hasText: label }).getAttribute('disabled');
        return disabled !== 'true';
      }
    }
  }

  getConfidence(confidence: string): Confidence {
    return {
      select: async () => {
        await this.page.locator('ion-chip').filter({ hasText: confidence }).click()
      }
    }
  }

  protected async scrollTop() {
    await this.page.evaluate(() => window.scrollTo({ left: 0, top: 0 }))
  }

  drawBox(): Promise<Omit<BoxBounds, 'type'>> {
    return test.step('Draw box', async () => {
      await this.scrollTop();
      const canvas = this.page.locator('canvas.drawable').first()
      await expect(canvas).toBeVisible()
      await this.page.mouse.move(380, 410)
      await this.page.mouse.down({ button: 'left' })
      await this.page.mouse.move(610, 480)
      await this.page.mouse.up({ button: 'left' })
      return {
        start_time: 1.90292333149476,
        end_time: 3.1715388858246003,
        start_frequency: 82,
        end_frequency: 115
      }
    })
  }

  async removeBox() {
    await this.page.getByRole('button', { name: '' }).click()
  }
}