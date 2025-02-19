import { API_URL, ESSENTIAL, expect, expectNoRequestsOnAction, Page, test } from './utils';
import { DATASET, IMPORT_DATASET } from './fixtures';
import { ImportModal } from './utils/pages';

// Utils

const STEP = {
  displayDatasets: (page: Page) => test.step('Display datasets', async () => {
    const content = page.locator('.table-content')
    await expect(content.first()).toBeVisible();
    const textContent = await Promise.all((await content.all()).map(c => c.textContent()))
    expect(textContent).toContain(DATASET.name)
  }),
  displayImport: (modal: ImportModal) => test.step('Display imports', async () => {
    const content = modal.locator('.table-content')
    await expect(content.first()).toBeVisible();
    const textContent = (await Promise.all((await content.all()).map(c => c.textContent()))).join(' ')
    expect(textContent).toContain(IMPORT_DATASET.name)
  }),
  importSearchIncorrect: (modal: ImportModal) => test.step('Incorrect import search has no result', async () => {
    await modal.search('incorrect')
    const content = await modal.locator('.table-content').count()
    expect(content).toEqual(0)
  }),
  importSearchCorrect: (modal: ImportModal) => test.step('Correct import search has one result', async () => {
    await modal.search(IMPORT_DATASET.name)
    const content = await modal.locator('.table-content').count()
    expect(content).toEqual(1)
  }),
  importCancel: (modal: ImportModal, page: Page) => test.step('Cancel import will have no effect', async () => {
    await modal.getByText(IMPORT_DATASET.name).click()
    await expectNoRequestsOnAction(
      page,
      () => page.getByRole('button', { name: 'Cancel' }).click(),
      API_URL.dataset.import
    )
  }),
  import: (modal: ImportModal, page: Page) => test.step('Can import dataset', async () => {
    await modal.getByText(IMPORT_DATASET.name).click()
    await Promise.all([
      page.waitForRequest(API_URL.dataset.import),
      modal.getByRole('button', { name: 'Import datasets' }).click()
    ])
  })
}

const TEST = {
  empty: async (page: Page) => {
    await expect(page.locator('.table-content')).not.toBeVisible();
    await expect(page.getByText('No datasets')).toBeVisible();
    const importButton = page.getByRole('button', { name: 'Import dataset' })
    await expect(importButton).toBeVisible()
    await expect(importButton).toBeDisabled()
  },
  display: async (page: Page) => {
    await STEP.displayDatasets(page);
    const modal = await page.dataset.openImportModal()
    await STEP.displayImport(modal);
  },
  manageImport: async (page: Page) => {
    let modal = await page.dataset.openImportModal()
    await STEP.importSearchIncorrect(modal);
    await STEP.importSearchCorrect(modal);

    await STEP.importCancel(modal, page);
    modal = await page.dataset.openImportModal()
    await STEP.import(modal, page);
  }
}


// Tests

test.describe('Staff', ESSENTIAL, () => {
  test('Should display empty state', async ({ page }) => {
    await page.dataset.go('staff', { empty: true });
    await TEST.empty(page)
  });
  test('Should display loaded data', async ({ page }) => {
    await page.dataset.go('staff');
    await TEST.display(page)
  })
  test('Should manage import', async ({ page }) => {
    await page.dataset.go('staff');
    await TEST.manageImport(page)
  })
})

test.describe('Superuser', ESSENTIAL, () => {
  test('Should display empty state', async ({ page }) => {
    await page.dataset.go('superuser', { empty: true });
    await TEST.empty(page)
  });
  test('Should display loaded data', async ({ page }) => {
    await page.dataset.go('superuser');
    await TEST.display(page)
  })
  test('Should manage import', async ({ page }) => {
    await page.dataset.go('superuser');
    await TEST.manageImport(page)
  })
})
