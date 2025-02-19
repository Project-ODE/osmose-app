import { Page } from '@playwright/test';
import { Serializable } from 'playwright-core/types/structs';
import { API_URL } from '../const';
import {
  AUDIO_METADATA,
  AUTH,
  CAMPAIGN,
  CHECK_DATA,
  CONFIDENCE,
  CREATE_DATA,
  DATASET,
  DETECTOR,
  FILE_RANGE,
  IMPORT_DATASET,
  LABEL,
  SPECTROGRAM_CONFIGURATION,
  USERS,
  UserType
} from '../../fixtures';
import { Paginated } from '../../../src/service/type';
import { AnnotationFile } from '../../../src/service/campaign/annotation-file-range/type';
import { AnnotationCampaign, AnnotationCampaignUsage } from '../../../src/service/campaign';

type Response = {
  status: number,
  json?: Serializable
}

export class Mock {

  constructor(private page: Page) {
  }

  public static getError(field: string) {
    return `Custom error for ${ field }`;
  }


  public async token(response: Response = { status: 200, json: { detail: AUTH.token } }) {
    await this.page.route(API_URL.token, route => route.fulfill(response))
  }

  public async users(empty: boolean = false) {
    const json = empty ? [] : [ USERS.annotator, USERS.creator, USERS.staff, USERS.superuser ]
    await this.page.route(API_URL.user.list, route => route.fulfill({ status: 200, json }))
  }

  public async userSelf(type: UserType = 'annotator') {
    await this.page.route(API_URL.user.self, route => route.fulfill({ status: 200, json: USERS[type] }))
  }

  public async campaigns(empty: boolean = false) {
    const json = empty ? [] : [ CAMPAIGN ]
    await this.page.route(API_URL.campaign.list, route => route.fulfill({ status: 200, json }))
  }

  public async campaignCreate(withErrors: boolean = false) {
    let json: Serializable = CAMPAIGN;
    let status = 200;
    if (withErrors) {
      status = 400;
      json = {
        name: [ Mock.getError('name') ],
        desc: [ Mock.getError('desc') ],
        instructions_url: [ Mock.getError('instructions_url') ],
        deadline: [ Mock.getError('deadline') ],
        datasets: [ Mock.getError('datasets') ],
        spectro_configs: [ Mock.getError('spectro_configs') ],
        usage: [ Mock.getError('usage') ],
        label_set: [ Mock.getError('label_set') ],
        confidence_indicator_set: [ Mock.getError('confidence_indicator_set') ],
      }
    }
    await this.page.route(API_URL.campaign.create, (route, request) => {
      if (request.method() === 'POST') route.fulfill({ status, json })
      else route.continue()
    })
  }

  public async campaignDetail(empty: boolean = false,
                              mode: AnnotationCampaignUsage = 'Create',
                              hasConfidence: boolean = true) {
    const json: AnnotationCampaign = CAMPAIGN;
    if (empty) {
      json.progress = 0;
      json.total = 0;
      json.my_progress = 0;
      json.my_total = 0;
    }
    json.usage = mode;
    if (!hasConfidence) {
      json.confidence_indicator_set = null;
    }
    await this.page.route(API_URL.campaign.detail, route => route.fulfill({ status: 200, json }))
  }

  public async spectrograms(empty: boolean = false) {
    const json = empty ? [] : [ SPECTROGRAM_CONFIGURATION ]
    await this.page.route(API_URL.spectrogram.list, route => route.fulfill({ status: 200, json }))
  }

  public async audios(empty: boolean = false) {
    const json = empty ? [] : [ AUDIO_METADATA ]
    await this.page.route(API_URL.audio.list, route => route.fulfill({ status: 200, json }))
  }

  public async datasets(empty: boolean = false) {
    const json = empty ? [] : [ DATASET ]
    await this.page.route(API_URL.dataset.list, route => route.fulfill({ status: 200, json }))
  }

  public async datasetDetail() {
    await this.page.route(API_URL.dataset.detail, route => route.fulfill({ status: 200, json: DATASET }))
  }

  public async labelSets(empty: boolean = false) {
    const json = empty ? [] : [ LABEL.set ]
    await this.page.route(API_URL.label.list, route => route.fulfill({ status: 200, json }))
  }

  public async labelSetDetail() {
    await this.page.route(API_URL.label.detail, route => route.fulfill({ status: 200, json: LABEL.set }))
  }

  public async confidenceSets(empty: boolean = false) {
    const json = empty ? [] : [ CONFIDENCE.set ]
    await this.page.route(API_URL.confidence.list, route => route.fulfill({ status: 200, json }))
  }

  public async confidenceSetDetail() {
    await this.page.route(API_URL.confidence.detail, route => route.fulfill({ status: 200, json: CONFIDENCE.set }))
  }

  public async datasetsToImport(empty: boolean = false) {
    const json = empty ? [] : [ IMPORT_DATASET ]
    await this.page.route(API_URL.dataset.list_to_import, route => route.fulfill({ status: 200, json }))
  }

  public async fileRanges(empty: boolean = false) {
    const json = empty ? [] : [ FILE_RANGE.range ]
    await this.page.route(API_URL.fileRanges.list, route => route.fulfill({ status: 200, json }))
  }


  public async fileRangesFiles(empty: boolean = false) {
    const results = empty ? [] : [ FILE_RANGE.submittedFile, FILE_RANGE.unsubmittedFile ]
    const json: Partial<Paginated<AnnotationFile>> & { resume?: number } = {
      results,
      count: results.length,
      resume: results.find(r => r.is_submitted === false)?.id
    }
    await this.page.route(/\/api\/annotation-file-range\/campaign\/-?\d\/files/g, route => route.fulfill({
      status: 200,
      json
    }))
  }

  public async annotator(type: AnnotationCampaignUsage = 'Create', empty: boolean = false) {
    const json = type === 'Create' ? CREATE_DATA(empty) : CHECK_DATA(empty)
    await this.page.route(API_URL.annotator, (route, request) => {
      if (request.method() === 'GET') route.fulfill({ status: 200, json })
      else route.fulfill({ status: 200 })
    });
  }

  public async campaignArchive() {
    await this.page.route(API_URL.campaign.archive, route => route.fulfill({ status: 200 }));
  }


  async resultImport() {
    await this.page.route(API_URL.result.import, route => route.fulfill({
      status: 200,
      json: []
    }))
  }

  async detectors(empty: boolean = false) {
    const json = empty ? [] : [ DETECTOR ]
    await this.page.route(API_URL.detector.list, route => route.fulfill({ status: 200, json }))
  }
}