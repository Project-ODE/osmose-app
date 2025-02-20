import { API_URL, ESSENTIAL, expect, expectNoRequestsOnAction, test } from './utils';
import { CAMPAIGN, CONFIDENCE, DATASET, DETECTOR_CONFIGURATION, LABEL, USERS } from './fixtures';
import { WriteCheckAnnotationCampaign, WriteCreateAnnotationCampaign } from '../src/service/campaign';
import { WriteAnnotationFileRange } from '../src/service/campaign/annotation-file-range';
import { Mock } from './utils/services';

test.describe('Annotator', () => {

  test('[Create] Can submit only required fields', ESSENTIAL, async ({ page }) => {
    await page.campaign.create.go('annotator');
    await page.campaign.create.fillGlobal()
    await page.campaign.create.fillData()
    await page.campaign.create.fillAnnotationCreate()

    const [ request ] = await Promise.all([
      page.waitForRequest(API_URL.campaign.create),
      page.campaign.create.createButton.click()
    ]);


    await test.step('Check campaign', async () => {
      const data = request.postDataJSON() as WriteCreateAnnotationCampaign;
      const expectedData: WriteCreateAnnotationCampaign = {
        name: CAMPAIGN.name,
        datasets: [ DATASET.name ],
        spectro_configs: DATASET.spectros.map(s => s.id),
        instructions_url: null,
        desc: null,
        deadline: null,
        confidence_indicator_set: null,
        label_set: LABEL.set.id,
        usage: 'Create',
        labels_with_acoustic_features: []
      }
      expect(data).toEqual(expectedData);
    })
  })

  test('[Create] Can submit complete form', ESSENTIAL, async ({ page }) => {
    await page.campaign.create.go('annotator');
    await page.campaign.create.fillGlobal({ complete: true });
    await page.campaign.create.fillData();
    await page.campaign.create.fillAnnotationCreate({ complete: true });
    await page.campaign.create.fillAnnotators();
    const [ campaignRequest, fileRangeRequest ] = await Promise.all([
      page.waitForRequest(API_URL.campaign.create),
      page.waitForRequest(API_URL.fileRanges.post),
      page.campaign.create.createButton.click()
    ]);

    await test.step('Check campaign', async () => {
      const campaignData = campaignRequest.postDataJSON() as WriteCreateAnnotationCampaign;
      const expectedCampaign: WriteCreateAnnotationCampaign = {
        name: CAMPAIGN.name,
        instructions_url: CAMPAIGN.instructions_url,
        desc: CAMPAIGN.desc,
        deadline: CAMPAIGN.deadline,
        datasets: [ DATASET.name ],
        spectro_configs: DATASET.spectros.map(s => s.id),
        confidence_indicator_set: CONFIDENCE.set.id,
        label_set: LABEL.set.id,
        usage: 'Create',
        labels_with_acoustic_features: [ LABEL.withFeatures ]
      }
      expect(campaignData).toEqual(expectedCampaign);
    })

    await test.step('Check file range', async () => {
      const fileRangeData = fileRangeRequest.postDataJSON() as WriteAnnotationFileRange[];
      const expectedFileRanges: WriteAnnotationFileRange[] = [ {
        annotator: USERS.annotator.id,
        first_file_index: 0,
        last_file_index: DATASET.files_count - 1
      } ]
      expect(fileRangeData).toEqual({ data: expectedFileRanges });
    })
  })

  test('Handle errors', ESSENTIAL, async ({ page }) => {
    await page.campaign.create.go('annotator', { withErrors: true });
    await page.campaign.create.fillGlobal()
    await page.campaign.create.fillData()
    await page.campaign.create.fillAnnotationCreate()

    await Promise.all([
      page.waitForRequest(API_URL.campaign.create),
      await page.campaign.create.createButton.click()
    ]);

    await test.step('Check errors are shown', async () => {
      await expect(page.getByText(Mock.getError('name'), { exact: true })).toBeVisible()
      await expect(page.getByText(Mock.getError('desc'), { exact: true })).toBeVisible()
      await expect(page.getByText(Mock.getError('instructions_url'), { exact: true })).toBeVisible()
      await expect(page.getByText(Mock.getError('deadline'), { exact: true })).toBeVisible()
      await expect(page.getByText(Mock.getError('datasets'), { exact: true })).toBeVisible()
      await expect(page.getByText(Mock.getError('spectro_configs'), { exact: true })).toBeVisible()
      await expect(page.getByText(Mock.getError('usage'), { exact: true })).toBeVisible()
      await expect(page.getByText(Mock.getError('label_set'), { exact: true })).toBeVisible()
      await expect(page.getByText(Mock.getError('confidence_indicator_set'), { exact: true })).toBeVisible()
    });
  });

  test('Empty', async ({ page }) => {
    await page.campaign.create.go('annotator', { empty: true });

    await test.step('Cannot select a dataset if none is imported', async () => {
      await expect(page.getByRole('button', { name: 'Select a dataset' })).toBeDisabled();
      await expect(page.getByText('You should first import a dataset')).toBeVisible();
    })

    await page.campaign.create.selectMode('Create annotations');

    await test.step('Cannot select a label set if none exists', async () => {
      await expect(page.getByRole('button', { name: 'Select a label set' })).toBeDisabled();
      await expect(page.getByText('You should create a label set')).toBeVisible();
    })

    await test.step('Cannot select a confidence set if none exists', async () => {
      await expect(page.getByRole('button', { name: 'Select a confidence set' })).toBeDisabled();
      await expect(page.getByText('You need to create a confidence set to use it in your campaign')).toBeVisible();
    })

    await test.step('Cannot submit empty form', async () => {
      await expectNoRequestsOnAction(
        page,
        () => page.campaign.create.createButton.click(),
        API_URL.campaign.create
      )
    })
  })

  test('[Check] Can create a campaign', ESSENTIAL, async ({ page }) => {
    await page.campaign.create.go('annotator');
    await page.campaign.create.fillGlobal({ complete: true });
    await page.campaign.create.fillData();
    await page.campaign.create.fillAnnotationCheck();
    await page.campaign.create.fillAcousticFeatures();

    const [
      submitResultsRequest,
      submittedCampaign
    ] = await Promise.all([
      page.waitForRequest(API_URL.result.import),
      page.waitForRequest(API_URL.campaign.create),
      page.campaign.create.createButton.click()
    ])
    const expectedCampaign: WriteCheckAnnotationCampaign = {
      name: CAMPAIGN.name,
      instructions_url: CAMPAIGN.instructions_url,
      desc: CAMPAIGN.desc,
      deadline: CAMPAIGN.deadline,
      datasets: [ DATASET.name ],
      spectro_configs: DATASET.spectros.map(s => s.id),
      labels_with_acoustic_features: [ LABEL.withFeatures ],
      usage: 'Check',
    }
    expect(await submittedCampaign.postDataJSON()).toEqual(expectedCampaign);
    expect(submitResultsRequest.url()).toContain(`dataset_name=${ encodeURI(DATASET.name) }`)
    expect(submitResultsRequest.url()).toContain(`detectors_map=${ encodeURI(JSON.stringify({
      detector1: { detector: 'detector1', configuration: DETECTOR_CONFIGURATION },
      detector3: { detector: 'detector3', configuration: DETECTOR_CONFIGURATION },
      detector2: { detector: 'detector2', configuration: DETECTOR_CONFIGURATION },
    })) }`)
  });

  test('[Check] Can import only first Dataset x Detector', ESSENTIAL, async ({ page }) => {
    await page.campaign.create.go('annotator')
    await page.campaign.create.fillData()
    await page.campaign.create.fillAnnotationCheck({ onlyFirstDataset: true, onlyFirstDetector: true })

    //TODO: Filter labels shown with the dataset and detectors filtering
    // await expect(page.getByText(Mock.CLASSIC_LABEL, { exact: true })).toBeVisible();
    // await expect(page.getByText(Mock.FEATURE_LABEL, { exact: true })).not.toBeVisible();
    await expect(page.getByText('detector1', { exact: true })).toBeVisible();
    await expect(page.getByText('detector2', { exact: true })).not.toBeVisible();
    await expect(page.getByText('detector3', { exact: true })).not.toBeVisible();
  });

  test('[Check] Can handle existing detector', ESSENTIAL, async ({ page }) => {
    await page.campaign.create.go('annotator', { loadDetectors: true })
    await page.campaign.create.fillData()
    await page.campaign.create.selectMode('Check annotations')
    const modal = await page.campaign.create.openImportModal()
    await page.campaign.create.importFile(modal);
    await page.campaign.create.selectDataset(modal, { onlyFirstDataset: true, onlyFirstDetector: true })

    await test.step('Select Detectors', async () => {
      await expect(modal.getByText('detector1Already in database').first()).toBeVisible()
      await modal.getByRole('button', { name: `Confirm` }).click({ force: true });
    })

    await test.step('Select Detectors configurations', async () => {
      await modal.getByText('Select configuration').first().click()
      await expect(modal.getByText(DETECTOR_CONFIGURATION).and(modal.locator('div'))).toBeVisible()
    })
  });

  test('[Check] Can delete import', async ({ page }) => {
    await page.campaign.create.go('annotator')
    await page.campaign.create.fillData()
    await page.campaign.create.fillAnnotationCheck()

    await test.step('Remove detectors', async () => {
      await page.locator('#detector-import-results').getByRole('button').click()
    })

    await expect(page.getByRole('button', { name: 'Import annotations' })).toBeVisible();
  });
})
