import { Locator, Page, test } from '@playwright/test';
import { UserType } from '../../fixtures';
import { AnnotationCampaignUsage } from '../../../src/service/campaign';
import { AnnotatorPage, Confidence, Label } from './annotator';
import { AnnotationResultType, BoxBounds, PointBounds } from '../../../src/service/campaign/result';

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

  async draw(type: Exclude<AnnotationResultType, 'Weak'>): Promise<BoxBounds | PointBounds> {
    await super.draw(type);
    return {
      type,
      start_time: 1.90292333149476,
      end_time: type === 'Box' ? 3.1715388858246003 : null,
      start_frequency: type === 'Box' ? 67 : 99,
      end_frequency: type === 'Box' ? 99 : null,
    } as BoxBounds | PointBounds
  }

  async removeStrong(): Promise<void> {
    await this.page.locator('.remove-box').click()
  }
}