import { Locator, Page, test } from '@playwright/test';
import { UserType } from '../../fixtures';
import { LoginPage } from './login';
import { Mock } from '../services';
import { API_URL } from '../const';

export class CampaignListPage {

  get card(): Locator {
    return this.page.locator('.campaign-card').first();
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: 'New annotation campaign' })
  }

  constructor(private page: Page,
              private login = new LoginPage(page),
              private mock = new Mock(page)) {
  }

  async go(as: UserType, options?: { empty: boolean }) {
    await test.step('Navigate to Campaigns', async () => {
      await this.mock.campaigns(options?.empty)
      await this.login.login(as)
      await this.mock.campaigns(options?.empty)
      await this.page.waitForRequest(API_URL.campaign.list)
      await this.page.locator('ion-spinner').waitFor({ state: 'hidden' });
    });
  }

  async search(text: string | undefined) {
    if (text) await this.page.getByRole('search').locator('input').fill(text)
    else await this.page.getByRole('search').locator('input').clear()
    await this.page.keyboard.press('Enter')
  }

}