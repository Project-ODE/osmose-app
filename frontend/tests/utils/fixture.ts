import { type Page as PageBase, test as testBase } from '@playwright/test';
import {
  AnnotatorNewPage,
  AnnotatorPage,
  CampaignCreatePage,
  CampaignDetailPage,
  CampaignEditPage,
  CampaignListPage,
  DatasetPage,
  HomePage,
  LoginPage
} from './pages';
import { Mock } from './services';

interface PageExtension {
  readonly mock: Mock;

  readonly home: HomePage;
  readonly login: LoginPage;
  readonly dataset: DatasetPage;
  readonly annotator: AnnotatorPage;
  readonly annotatorNew: AnnotatorNewPage;
  readonly campaign: {
    list: CampaignListPage;
    detail: CampaignDetailPage;
    create: CampaignCreatePage;
    edit: CampaignEditPage;
  }
}

export interface Page extends PageBase, PageExtension {
}

// Declare the types of your fixtures.
type Fixture = {
  page: Page;
};

export * from '@playwright/test';
export const test = testBase.extend<Fixture>({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  page: async ({ page }, use) => {
    await use(Object.assign(page, {
      mock: new Mock(page),

      home: new HomePage(page),
      login: new LoginPage(page),
      dataset: new DatasetPage(page),
      annotator: new AnnotatorPage(page),
      annotatorNew: new AnnotatorNewPage(page),
      campaign: {
        list: new CampaignListPage(page),
        detail: new CampaignDetailPage(page),
        create: new CampaignCreatePage(page),
        edit: new CampaignEditPage(page),
      },
    } satisfies PageExtension))
  },
});


