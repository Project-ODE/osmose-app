import { ESSENTIAL, expect, Page, test, URL } from './utils';

// Utils

const STEP = {
  hasAdminLink: (page: Page) => test.step('Has admin link', async () => {
    const url = await page.getByRole('link', { name: 'Admin' }).getAttribute('href')
    expect(url).toEqual(URL.admin)
  }),
  canAccessDataset: (page: Page) => test.step('Can access datasets', async () => {
    await page.getByRole('button', { name: 'Datasets' }).click()
    await expect(page.getByRole('heading', { name: 'Datasets' })).toBeVisible();
  })
}

// Tests

test('Annotator', ESSENTIAL, async ({ page }) => {
  await page.campaign.list.go('annotator');

  await test.step('can access campaign', async () => {
    await page.getByRole('button', { name: 'Annotation campaigns' }).click()
    await expect(page.getByRole('heading', { name: 'Annotation campaigns' })).toBeVisible()
  })

  await test.step('Can access documentation', async () => {
    const url = await page.getByRole('link', { name: 'Documentation', exact: true }).first().getAttribute('href')
    expect(url).toEqual(URL.doc)
  })

  await test.step('Can access account', async () => {
    await page.getByRole('button', { name: 'Account', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible()
  })

  await test.step('cannot access datasets', async () => {
    await expect(page.getByRole('button', { name: 'Datasets' })).not.toBeVisible();
  })

  await test.step('cannot access administration', async () => {
    await expect(page.getByRole('link', { name: 'Admin' })).not.toBeVisible();
  })

  await test.step('Can logout', async () => {
    await page.getByRole('button', { name: 'Logout' }).click()
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  })
})

test('Staff', ESSENTIAL, async ({ page }) => {
  await page.campaign.list.go('staff');
  await STEP.hasAdminLink(page);
  await STEP.canAccessDataset(page)
})

test('Superuser', ESSENTIAL, async ({ page }) => {
  await page.campaign.list.go('superuser');
  await STEP.hasAdminLink(page);
  await STEP.canAccessDataset(page)
})
