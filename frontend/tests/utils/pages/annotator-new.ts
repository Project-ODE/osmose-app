import { Locator, Page, test } from '@playwright/test';
import { UserType } from '../../fixtures';
import { AnnotationCampaignUsage } from '../../../src/service/campaign';
import { AnnotatorPage, Confidence, Label } from './annotator';
import { BoxBounds } from '../../../src/service/campaign/result';

export class AnnotatorNewPage extends AnnotatorPage {

  get tryOtherButton(): Locator {
    return this.page.getByRole('button', { name: 'Back to old annotator' });
  }

  constructor(page: Page) {
    super(page);
  }

  async go(as: UserType, options: {
    mode: AnnotationCampaignUsage,
    empty?: boolean,
    noConfidence?: boolean
  }) {
    await test.step('Navigate to new Annotator', async () => {
      await super.go(as, options)
      await super.tryOtherButton.click()
    });
  }

  getLabel(label: string): Label {
    const superLabel = super.getLabel(label);
    return {
      ...superLabel,
      addPresence: async () => {
        await this.page.locator('.presence ion-chip').filter({ hasText: label }).click()
      },
      remove: async () => {
        await this.page.locator('.presence ion-chip').filter({ hasText: label }).click()
        const alert = this.page.getByRole('alertdialog')
        await alert.getByRole('button', { name: `Remove "${ label }" annotations` }).click()
      },
      selectLabel: async () => {
        await this.page.locator('.label ion-chip').filter({ hasText: label }).click()
      },
      getLabelState: async () => {
        const disabled = await this.page.locator('.label ion-chip').filter({ hasText: label }).getAttribute('disabled');
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

  protected async scrollTop(): Promise<void> {
    await this.page.locator('.page').first().evaluate((element) => {
      element.scrollTo({ left: 0, top: 0 })
    })
  }

  async drawBox(): Promise<Omit<BoxBounds, 'type'>> {
    await super.drawBox();
    return {
      start_time: 1.90292333149476,
      end_time: 3.1715388858246003,
      start_frequency: 67,
      end_frequency: 99
    }
  }

  async removeBox(): Promise<void> {
    await this.page.locator('.remove-box').click()
  }
}