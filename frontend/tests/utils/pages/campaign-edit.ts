import { Page, test } from '@playwright/test';
import { Mock } from '../services';
import { UserType } from '../../fixtures';
import { CampaignDetailPage } from './campaign-detail';

export class CampaignEditPage {


  constructor(page: Page,
              private detail = new CampaignDetailPage(page),
              private mock = new Mock(page)) {
  }

  async go(as: UserType, options?: { empty: boolean }) {
    await test.step('Navigate to Campaign detail', async () => {
      await this.detail.go(as, options)
      const modal = await this.detail.openProgressModal();
      await this.mock.fileRanges(options?.empty)
      await modal.manageButton.click();
    });
  }
}