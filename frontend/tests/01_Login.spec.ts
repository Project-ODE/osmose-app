import { ESSENTIAL, expect, test } from './utils';
import { LoginPage } from './utils/pages';
import { AUTH } from './fixtures';

test('Login', ESSENTIAL, async ({ page }) => {
  await page.login.go();
  await page.login.fillForm();

  await test.step('401 - Unauthorized', async () => {
    await page.login.submit(401);
    await expect(page.getByText(LoginPage.SERVER_ERROR)).toBeVisible();
  })

  await test.step('200 - Success', async () => {
    const request = await page.login.submit(200);
    expect(await request.postDataJSON()).toEqual({
      username: AUTH.username,
      password: AUTH.password
    })
    await expect(page.getByRole('heading', { name: 'Annotation Campaigns' })).toBeVisible();
  })
})
