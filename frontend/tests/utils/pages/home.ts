import { Page, test } from '@playwright/test';
import { AplosePage } from './interface';

export class HomePage implements AplosePage {

  constructor(private page: Page) {
  }

  async go() {
    await test.step('Navigate to home', async () => {
      await this.page.goto('/app/');
    });
  }
}