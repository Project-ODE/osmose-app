import { API_URL, ESSENTIAL, expect, test } from './utils';
import { CAMPAIGN, FILE_RANGE, USERS } from './fixtures';
import { WriteAnnotationFileRange } from '../src/service/campaign/annotation-file-range';


test.describe('Campaign creator', () => {

  test('Empty', async ({ page }) => {
    await page.campaign.edit.go('creator', { empty: true });
    await expect(page.getByPlaceholder('Search annotator').locator('input')).toBeVisible()
    await expect(page.locator('.table-aplose')).not.toBeVisible()
  })

  test('Manage annotators', ESSENTIAL, async ({ page }) => {
    await page.campaign.edit.go('creator');

    await test.step('Can see existing ranges', async () => {
      await expect(page.getByText(`${ USERS.annotator.first_name } ${ USERS.annotator.last_name }`)).toBeVisible()
      await expect(page.campaign.edit.firstIndexInputs.first()).toHaveValue((FILE_RANGE.range.first_file_index + 1).toString())
      await expect(page.campaign.edit.lastIndexInputs.first()).toHaveValue((FILE_RANGE.range.last_file_index + 1).toString())
      await expect(page.getByText(USERS.creator.first_name)).not.toBeVisible()
      await expect(page.getByText(USERS.staff.first_name)).not.toBeVisible()
      await expect(page.getByText(USERS.superuser.first_name)).not.toBeVisible()
    })

    await test.step('Cannot edit or remove annotator with finished tasks', async () => {
      await expect(page.campaign.edit.firstIndexInputs.first()).toBeDisabled()
      await expect(page.campaign.edit.lastIndexInputs.first()).toBeDisabled()
      //TODO: Handle forced update and remove of annotators with finished tasks
      // const button = page.locator('.table-content button').last()
      // await expect(button).toBeVisible()
      // await expect(button).toBeDisabled()
    })

    await test.step('Can add new annotator', async () => {
      await page.getByPlaceholder('Search annotator').locator('input').fill(USERS.superuser.first_name);
      await page.locator('#searchbar-results').getByText(USERS.superuser.first_name).click();
      await expect(page.getByText(`${ USERS.superuser.first_name } ${ USERS.superuser.last_name }`)).toBeVisible()
      await expect(page.campaign.edit.firstIndexInputs.nth(1)).toBeVisible()
      await expect(page.campaign.edit.lastIndexInputs.nth(1)).toBeVisible()
    })

    await test.step('Can edit or remove annotator without finished tasks', async () => {
      await page.campaign.edit.firstIndexInputs.nth(1).fill("5")
      await page.campaign.edit.lastIndexInputs.nth(1).fill("15")
      const button = page.locator('.table-content button').last()
      await expect(button).toBeEnabled()
    })

    await test.step('Can add known annotator with some files', async () => {
      await page.getByPlaceholder('Search annotator').locator('input').fill(USERS.superuser.first_name);
      await page.locator('#searchbar-results').getByText(USERS.superuser.first_name).click()
      expect(await page.locator('.table-aplose').getByText(USERS.superuser.first_name).count()).toEqual(2)
    })

    await test.step('Cannot add known annotator with all files', async () => {
      await page.getByPlaceholder('Search annotator').locator('input').fill(USERS.superuser.first_name);
      await expect(page.locator('#searchbar-results').getByText(USERS.superuser.first_name)).not.toBeVisible();
    })

    await test.step('Can submit', async () => {
      const [ request ] = await Promise.all([
        page.waitForRequest(API_URL.fileRanges.post),
        page.getByRole('button', { name: 'Update campaign' }).click()
      ])
      const expectedData: Array<WriteAnnotationFileRange> = [ {
        id: FILE_RANGE.range.id,
        annotator: FILE_RANGE.range.annotator,
        first_file_index: FILE_RANGE.range.first_file_index,
        last_file_index: FILE_RANGE.range.last_file_index,
      }, {
        "annotator": USERS.superuser.id,
        "first_file_index": 4,
        "last_file_index": 14
      }, {
        "annotator": USERS.superuser.id,
        "first_file_index": 0,
        "last_file_index": CAMPAIGN.files_count - 1
      } ]
      expect(await request.postDataJSON()).toEqual({ data: expectedData })
    })
  })

})
