import { expect, Locator, Page } from '@playwright/test';
import { LABEL } from '../../fixtures';

export interface Modal extends Locator {
  close(): Promise<void>;
}

export class UI {
  constructor(private page: Page) {
  }

  async openModal(button: { name: string }) {
    await this.page.getByRole('button', button).click()
    const modal = this.page.getByRole('dialog').first()
    await expect(modal).toBeVisible();
    return Object.assign(modal, {
      async close() {
        await modal.locator('.close').click();
      }
    });
  }

  getFeatureCheckboxForLabel(label: string, locator: Locator | Page = this.page): Locator {
    return locator.locator('.table-content').nth((LABEL.set.labels.indexOf(label) + 1) * 2 - 1).locator('ion-checkbox')
  }
}