import { errors, expect } from './fixture';
import { Page, Request } from 'playwright-core';

// https://github.com/microsoft/playwright/issues/13284#issuecomment-2299013936
export async function expectNoRequestsOnAction(page: Page,
                                               action: () => Promise<any>,
                                               urlOrPredicate: string | RegExp | ((request: Request) => boolean | Promise<boolean>)) {
  const requestPromise = page.waitForRequest(urlOrPredicate, { timeout: 1000 });
  await action();
  await requestPromise
    .then(() => {
      throw new Error('Request was sent');  // Oops
    })
    .catch((error => {
      if (error instanceof errors.TimeoutError) return;  // Success
      throw error;  // Throw other errors
    }));
}

export async function selectInAlert(page: Page, item: string) {
  const modal = page.getByRole('dialog')
  await expect(modal).toBeVisible();
  await modal.getByText(item).click();
  await modal.getByRole('button', { name: 'Ok' }).click();
}