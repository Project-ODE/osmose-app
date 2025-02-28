import { expect, Locator, Page, test } from '@playwright/test';
import { Mock } from '../services';
import { CAMPAIGN, CONFIDENCE, DATASET, DETECTOR_CONFIGURATION, LABEL, USERS, UserType } from '../../fixtures';
import { CampaignListPage } from './campaign-list';
import { selectInAlert } from '../functions';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename).split(/[/\\]/g); // get the name of the directory
__dirname.pop();
__dirname.pop();
const __file = path.join(__dirname.join('/'), "fixtures", "annotation_results.csv")

type CheckOptions = {
  onlyFirstDataset: boolean,
  onlyFirstDetector: boolean,
}

export class CampaignCreatePage {

  get createButton(): Locator {
    return this.page.getByRole('button', { name: 'Create campaign' })
  }

  constructor(private page: Page,
              private list = new CampaignListPage(page),
              private mock = new Mock(page)) {
  }

  getError(field: string) {
    return `Custom error for ${ field }`;
  }

  async go(as: UserType, options?: { empty?: boolean, withErrors?: boolean, loadDetectors?: boolean }): Promise<void> {
    await test.step('Navigate to Campaign create', async () => {
      await this.list.go(as)
      await this.mock.datasets(options?.empty)
      await this.mock.users(options?.empty)
      await this.mock.labelSets(options?.empty)
      await this.mock.confidenceSets(options?.empty)
      await this.mock.detectors(!(options?.loadDetectors ?? false))
      await this.mock.resultImport()
      await this.list.createButton.click();
      await this.mock.campaignCreate(options?.withErrors);
    });
  }

  async fillGlobal(options?: { complete: boolean }) {
    return test.step('Campaign global information', async () => {
      await this.page.getByPlaceholder('Campaign name').fill(CAMPAIGN.name);
      if (options?.complete) {
        await this.page.getByPlaceholder('Enter your campaign description').fill(CAMPAIGN.desc);
        await this.page.getByPlaceholder('URL').fill(CAMPAIGN.instructions_url);
        const d = new Date(CAMPAIGN.deadline);
        await this.page.getByPlaceholder('Deadline').fill(d.toISOString().split('T')[0]);
      }
    })
  }

  async fillData() {
    return test.step('Campaign data', async () => {
      await this.page.getByRole('button', { name: 'Select a dataset' }).click();
      await selectInAlert(this.page, DATASET.name);
    })
  }

  async selectMode(mode: 'Create annotations' | 'Check annotations') {
    await this.page.getByRole('button', { name: 'Select an annotation mode' }).click();
    await this.page.locator('#options').getByText(mode).click();
  }

  async fillAcousticFeatures() {
    return test.step('Acoustic features', async () => {
      await this.page.locator('.table-content').nth((LABEL.set.labels.indexOf(LABEL.withFeatures) + 1) * 2 - 1).locator('ion-checkbox').click()
    });
  }

  async fillAnnotationCreate(options?: { complete: boolean }) {
    return test.step('Campaign annotation - Create mode', async () => {
      await this.selectMode('Create annotations')
      await this.page.getByRole('button', { name: 'Select a label set' }).click();
      await selectInAlert(this.page, LABEL.set.name);
      if (options?.complete) {
        await this.fillAcousticFeatures()
        // Confidence
        await this.page.getByRole('button', { name: 'Select a confidence set' }).click();
        await selectInAlert(this.page, CONFIDENCE.set.name);
      }
    })
  }

  async openImportModal(): Promise<Locator> {
    return test.step('Open import modal', async () => {
      await this.page.getByRole('button', { name: 'Import annotations' }).click();
      // Start waiting for file chooser before clicking. Note no await.
      const modal = this.page.locator('#import-annotations-modal').first()
      await expect(modal).toBeVisible();
      return modal;
    })
  }

  async importFile(modal: Locator) {
    return test.step('Import file', async () => {
      const [ fileChooser ] = await Promise.all([
        this.page.waitForEvent('filechooser'),
        modal.getByText('Import annotations (csv)').click()
      ])
      await fileChooser.setFiles(__file);
    })
  }

  async selectDataset(modal: Locator, options?: CheckOptions) {
    return test.step('Select Dataset', async () => {
      await expect(modal.getByText('The selected file contains unrecognized datasets')).toBeVisible()
      if (options?.onlyFirstDataset) {
        await modal.getByText('Test Datasets', { exact: true }).click()
        await modal.getByText('Test dataset', { exact: true }).click()
      }
      await modal.getByRole('button', { name: `Use selected datasets as "${ DATASET.name }"` }).click({ force: true });
    })
  }

  async selectDetectors(modal: Locator, options?: CheckOptions) {
    return test.step('Select Detectors', async () => {
      await expect(modal.getByText('Unknown detector').first()).toBeVisible()
      await modal.getByText('Assign to detector').first().click()
      await modal.locator('#options:visible').getByText('Create').first().click()
      if (!options?.onlyFirstDetector) {
        await modal.getByText('Assign to detector').first().click()
        await modal.locator('#options:visible').getByText('Create').first().click()
      }
      if (!options?.onlyFirstDataset && !options?.onlyFirstDetector) {
        await modal.getByText('Assign to detector').first().click()
        await modal.locator('#options:visible').getByText('Create').first().click()
      }
      if (options?.onlyFirstDataset) {
        await expect(modal.getByText('detector2')).not.toBeVisible();
      }
      await modal.getByRole('button', { name: `Confirm` }).click({ force: true });
    })
  }

  async selectDetectorsConfigurationsStep(modal: Locator, options?: CheckOptions) {
    return test.step('Select Detectors configuration', async () => {
      await modal.getByText('Select configuration').first().click()
      await modal.locator('#options:visible').getByText('Create new').first().click()
      await modal.locator('textarea').nth(0).fill(DETECTOR_CONFIGURATION)
      if (!options?.onlyFirstDetector) {
        await modal.getByText('Select configuration').first().click()
        await modal.locator('#options:visible').getByText('Create new').first().click()
        await modal.locator('textarea').nth(1).fill(DETECTOR_CONFIGURATION)
      } else {
        await expect(modal.getByText('detector3')).not.toBeVisible();
      }
      if (!options?.onlyFirstDataset && !options?.onlyFirstDetector) {
        await modal.getByText('Select configuration').first().click()
        await modal.locator('#options:visible').getByText('Create new').first().click()
        await modal.locator('textarea').last().fill(DETECTOR_CONFIGURATION)
      } else {
        await expect(modal.getByText('detector2')).not.toBeVisible();
      }
      await modal.getByRole('button', { name: `Import` }).click({ force: true });
    })
  }

  async fillAnnotationCheck(options?: CheckOptions) {
    return test.step('Campaign annotation - Check mode', async () => {
      await this.selectMode('Check annotations');
      const modal = await this.openImportModal();
      await this.importFile(modal);
      await this.selectDataset(modal, options)
      await this.selectDetectors(modal, options)
      await this.selectDetectorsConfigurationsStep(modal, options)
    })

  }

  async fillAnnotators() {
    return test.step('Campaign annotators', async () => {
      await this.page.getByPlaceholder('Search annotator...').and(this.page.locator('input')).fill(USERS.annotator.first_name)
      await this.page.getByText(`${ USERS.annotator.first_name } ${ USERS.annotator.last_name }`).click()
    })
  }

}