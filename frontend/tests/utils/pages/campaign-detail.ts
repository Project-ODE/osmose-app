import { Locator, Page, test } from '@playwright/test';
import { Mock, Modal, UI } from '../services';
import { UserType } from '../../fixtures';
import { CampaignListPage } from './campaign-list';
import { AnnotationCampaignUsage } from '../../../src/service/campaign';

type LabelModalExtend = {
  getCheckbox: (text: string) => Locator;
  get updateButton(): Locator;
}

type MetadataModalExtend = {
  get downloadButton(): Locator;
}

type ProgressModalExtend = {
  get downloadResultsButton(): Locator;
  get downloadStatusButton(): Locator;
  get manageButton(): Locator;
}

export type LabelModal = Modal & LabelModalExtend
export type MetadataModal = Modal & MetadataModalExtend
export type ProgressModal = Modal & ProgressModalExtend

export class CampaignDetailPage {

  get archiveButton(): Locator {
    return this.page.getByRole('button', { name: 'Archive' });
  }

  get resumeButton(): Locator {
    return this.page.getByRole('button', { name: 'Resume annotation' });
  }

  constructor(private page: Page,
              private list = new CampaignListPage(page),
              private ui = new UI(page),
              private mock = new Mock(page)) {
  }

  async go(as: UserType, options?: {
    empty?: boolean,
    mode?: AnnotationCampaignUsage,
    noConfidence?: boolean
  }) {
    await test.step('Navigate to Campaign detail', async () => {
      await this.list.go(as)

      await this.mock.campaignDetail(options?.empty, options?.mode, !options?.noConfidence)
      await this.mock.fileRanges(options?.empty)
      await this.mock.fileRangesFiles(options?.empty)
      await this.mock.spectrograms(options?.empty)
      await this.mock.audios(options?.empty)
      await this.mock.users(options?.empty)
      await this.mock.labelSetDetail()
      await this.mock.confidenceSetDetail()
      await this.mock.campaignArchive()

      await this.list.card.click();
    });
  }

  async searchFile(text: string | undefined) {
    if (text) await this.page.getByRole('search').locator('input').fill(text)
    else await this.page.getByRole('search').locator('input').clear()
    await this.page.keyboard.press('Enter')
  }

  async openLabelModal(): Promise<LabelModal> {
    const modal = await this.ui.openModal({ name: 'Detailed label set' })
    const ui = this.ui;
    return Object.assign(modal, {
      getCheckbox(label: string) {
        return ui.getFeatureCheckboxForLabel(label, modal)
      },
      get updateButton(): Locator {
        return modal.getByRole('button', { name: 'Update' });
      }
    } as LabelModalExtend);
  }

  async openSpectrogramModal(): Promise<MetadataModal> {
    const modal = await this.ui.openModal({ name: 'Spectrogram configuration' })
    return Object.assign(modal, {
      get downloadButton(): Locator {
        return modal.getByRole('button', { name: 'Download configurations' })
      }
    } as MetadataModal);
  }

  async openAudioModal(): Promise<MetadataModal> {
    const modal = await this.ui.openModal({ name: 'Audio metadata' })
    return Object.assign(modal, {
      get downloadButton(): Locator {
        return modal.getByRole('button', { name: 'Download metadata' })
      }
    } as MetadataModal);
  }

  async openProgressModal(): Promise<ProgressModal> {
    const modal = await this.ui.openModal({ name: 'Detailed progression' })
    return Object.assign(modal, {
      get downloadResultsButton(): Locator {
        return modal.getByRole('button', { name: 'Results' })
      },
      get downloadStatusButton(): Locator {
        return modal.getByRole('button', { name: 'Status' })
      },
      get manageButton(): Locator {
        return modal.getByRole('button', { name: 'Manage annotators' })
      },
    } as ProgressModalExtend);
  }


}