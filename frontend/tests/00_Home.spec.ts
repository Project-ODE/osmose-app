import { ESSENTIAL, expect, test, URL } from './utils';

test('Global', ESSENTIAL, async ({ page }) => {
  await page.home.go();

  await test.step('Has OSmOSE website link', async () => {
    const url = await page.getByRole('link', { name: 'OSmOSE', exact: true }).getAttribute('href')
    expect(url).toEqual(URL.OSmOSE)
  })

  await test.step('Has documentation link', async () => {
    const url = await page.getByRole('link', { name: 'Documentation', exact: true }).first().getAttribute('href')
    expect(url).toEqual(URL.doc)
  })

  await test.step('Can access Login', async () => {
    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page.getByRole('heading', { name: 'Login', exact: true }).first()).toBeVisible();
  })
})