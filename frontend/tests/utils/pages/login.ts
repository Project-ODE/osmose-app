import { Page, Request, test } from '@playwright/test';
import { API_URL } from '../const';
import { Mock } from '../services';
import { AUTH, UserType } from '../../fixtures';

export class LoginPage {

  static SERVER_ERROR: string = 'server_error';

  constructor(private page: Page,
              private mock = new Mock(page),) {
  }

  async go() {
    await test.step('Navigate to login', async () => {
      await this.page.goto('/app/login/');
    });
  }

  async fillForm() {
    await test.step('Fill login form', async () => {
      await this.page.getByPlaceholder('username').fill(AUTH.username)
      await this.page.getByPlaceholder('password').fill(AUTH.password)
    })
  }

  async submit(status: 200 | 401): Promise<Request> {
    return await test.step('Submit', async () => {
      if (status === 200) await this.mock.token()
      else await this.mock.token({ status, json: { detail: LoginPage.SERVER_ERROR } })
      const [ request ] = await Promise.all([
        this.page.waitForRequest(API_URL.token),
        this.page.getByRole('button', { name: 'Login' }).click()
      ])
      return request;
    })
  }

  async login(as: UserType) {
    await this.go()
    await this.fillForm()
    await this.mock.userSelf(as)
    await this.submit(200)
    await this.mock.userSelf(as)
  }
}