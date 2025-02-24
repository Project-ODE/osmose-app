import { Page, test } from '@playwright/test';
import { Mock, Modal, UI } from '../services';
import { LoginPage } from './login';
import { UserType } from '../../fixtures';

type ImportModalExtend = {
  search: (text: string) => Promise<void>;
}

export interface ImportModal extends Modal, ImportModalExtend {
}

export class DatasetPage {

  constructor(private page: Page,
              private login = new LoginPage(page),
              private mock = new Mock(page),
              private ui = new UI(page)) {
  }

  async go(as: UserType, options?: { empty: boolean }) {
    await test.step('Navigate to Datasets', async () => {
      await this.login.login(as);
      await this.mock.datasets(options?.empty)
      await this.mock.datasetsToImport(options?.empty)
      await this.page.getByRole('button', { name: 'Datasets' }).click()
    });
  }

  async openImportModal(): Promise<ImportModal> {
    const modal = await this.ui.openModal({ name: 'Import dataset' })
    return Object.assign(modal, {
      async search(text: string) {
        await modal.getByPlaceholder('Search').fill(text)
      }
    } as ImportModalExtend);
  }


}