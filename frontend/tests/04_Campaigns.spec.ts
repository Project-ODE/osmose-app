import { ESSENTIAL, expect, test } from './utils';
import { CAMPAIGN } from './fixtures';


test.describe('Annotator', () => {
  test('Can see campaigns and access first', ESSENTIAL, async ({ page }) => {
    await page.campaign.list.go('annotator');
    await page.campaign.list.card.click()
    await page.waitForURL(`/app/annotation-campaign/${ CAMPAIGN.id }`)
  })

  test('Can filter campaigns', async ({ page }) => {
    await page.campaign.list.go('annotator');
    await test.step('Search', async () => {
      await page.mock.campaigns()
      await Promise.all([
        page.waitForRequest(/.*\/api\/annotation-campaign\/?\?.*search/g),
        page.campaign.list.search(CAMPAIGN.name),
      ])
    })

    await test.step('Remove My work filter', async () => {
      await page.mock.campaigns()
      await Promise.all([
        page.waitForRequest(/\/api\/annotation-campaign\/\?((?!annotator).)*$/g),
        page.getByText('My work').click()
      ])
    })

    await test.step('Add Only archived filter', async () => {
      await page.mock.campaigns()
      await Promise.all([
        page.waitForRequest(/\/api\/annotation-campaign\/x?\?.*archive__isnull=false.*$/g),
        page.getByText('Only archived').click()
      ])
    })

    await test.step('Add Campaign mode to Create filter', async () => {
      await page.mock.campaigns()
      await Promise.all([
        page.waitForRequest(/\/api\/annotation-campaign\/?\?.*?usage=0/g),
        page.getByText('Campaign mode filter').click()
      ])
    })

    await test.step('Change Campaign mode to Check filter', async () => {
      await page.mock.campaigns()
      await Promise.all([
        page.waitForRequest(/\/api\/annotation-campaign\/?\?.*?usage=1/g),
        page.getByText('Campaign mode filter').click()
      ])
    })

    await test.step('Add Owned campaigns filter', async () => {
      await page.mock.campaigns()
      await Promise.all([
        page.waitForRequest(/\/api\/annotation-campaign\/?\?.*?owner/g),
        page.getByText('Owned campaigns').click()
      ])
    })
  })

  test('Can access campaign creation', ESSENTIAL, async ({ page }) => {
    await page.campaign.list.go('annotator');
    await page.mock.users()
    await page.mock.datasets()
    await page.campaign.list.createButton.click()
    await page.mock.users()
    await page.mock.datasets()
    await expect(page.getByRole('heading', { name: 'Create Annotation Campaign' })).toBeVisible();
  })

  test('Cannot see campaigns if empty', ESSENTIAL, async ({ page }) => {
    await page.campaign.list.go('annotator', { empty: true });
    await expect(page.campaign.list.card).not.toBeVisible();
    await expect(page.getByText('No campaigns')).toBeVisible();
  })
})
