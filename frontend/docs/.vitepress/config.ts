import { defineConfig } from 'vitepress'
// @ts-ignore
import packageJSON from '../../../package.json';

// https://vitepress.dev/reference/site-config
// https://vitepress.dev/reference/default-theme-config
// https://vitepress.dev/reference/default-theme-sidebar
export default defineConfig({
  title: "APLOSE",
  description: "A web-based annotation plateform developed by and for Marine Passive Acoustic Monitoring researchers",
  cleanUrls: true,
  lastUpdated: true,

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'User', link: '/user' },
          { text: 'Developer', link: '/dev/docker' },
          { text: 'Changelog', link: 'https://github.com/Project-OSmOSE/osmose-app/releases', target: '_blank' },
          { text: 'APLOSE', link: '/../app/', target: '_blank' },
        ],
        sidebar: {
          '/user': [
            {
              text: 'Annotation',
              items: [
                { text: 'Access APLOSE', link: '/user/' },
                { text: 'Annotation campaign', link: '/user/campaign' },
                { text: 'Annotate', link: '/user/annotator' },
                {
                  text: 'Campaign creator',
                  items: [
                    { text: 'Generate a dataset', link: '/user/campaign-creator/generate-dataset' },
                    { text: 'Import a dataset', link: '/user/campaign-creator/import-dataset' },
                    { text: 'Create a campaign', link: '/user/campaign-creator/create-campaign' },
                    { text: 'Manage a campaign', link: '/user/campaign-creator/manage-campaign' },
                    { text: 'View results', link: '/user/campaign-creator/view-results' },
                  ]
                },
                {
                  text: 'Administrator',
                  items: [
                    { text: 'Administration presentation', link: '/user/administrator/presentation' },
                    { text: 'Manage users', link: '/user/administrator/manage-users' },
                  ]
                },
                { text: 'Terminology', link: '/user/terminology' },
              ],
            },
            {
              text: 'Manage account',
              link: '/user/account'
            },
            {
              text: 'FAQ',
              link: '/faq'
            }
          ],
          '/dev': [
            {
              text: 'Developer',
              items: [
                { text: 'Docker installation', link: '/dev/docker' },
              ],
            },
          ],
        },
      }
    },
    fr: {
      label: 'Français',
      lang: 'fr',
      themeConfig: {
        nav: [
          { text: 'Utilisateur', link: '/fr/user' },
          { text: 'Developer', link: '/dev/docker' },
          { text: 'Changelog', link: 'https://github.com/Project-OSmOSE/osmose-app/releases', target: '_blank' },
          { text: 'APLOSE', link: '/../app/', target: '_blank' },
        ],
        sidebar: {
          '/fr/user': [
            {
              text: 'Annotation',
              items: [
                { text: 'Accéder à APLOSE', link: '/fr/user/' },
                { text: 'Campagnes d\'annotation', link: '/fr/user/campaign' },
                { text: 'Annoter', link: '/fr/user/annotator' },
                {
                  text: 'Créateur de campagne',
                  items: [
                    { text: 'Générer un dataset', link: '/fr/user/campaign-creator/generate-dataset' },
                    { text: 'Importer un dataset', link: '/fr/user/campaign-creator/import-dataset' },
                    { text: 'Créer une campagne', link: '/fr/user/campaign-creator/create-campaign' },
                    { text: 'Gérer une campagne', link: '/fr/user/campaign-creator/manage-campaign' },
                    { text: 'Voir les résultats', link: '/fr/user/campaign-creator/view-results' },
                  ]
                },
                {
                  text: 'Administrateur',
                  items: [
                    { text: 'Présentation de l\'administration', link: '/fr/user/administrator/presentation' },
                    { text: 'Gérer les utilisateurs', link: '/fr/user/administrator/manage-users' },
                  ]
                },
                { text: 'Terminologie', link: '/fr/user/terminology' },
              ],
            },
            {
              text: 'Gestion du compte',
              link: '/fr/user/account'
            },
            {
              text: 'FAQ',
              link: '/fr/user/faq'
            }
          ],
        },
      }
    }
  },

  themeConfig: {
    logo: '/logo.png',
    outline: "deep",
    // https://vitepress.dev/reference/default-theme-config
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Project-OSmOSE/osmose-app' },
    ],
    search: {
      provider: 'local',
      options: {
        locales: {
          fr: {
            translations: {
              button: {
                buttonText: 'Rechercher'
              },
              modal: {
                noResultsText: 'Pas de résultats pour',
                footer: {
                  navigateText: 'pour naviguer',
                  selectText: 'pour sélectionner',
                  closeText: 'pour fermer',
                }
              }
            }
          }
        }
      }
    }
  },
  markdown: {
    image: {
      lazyLoading: true
    }
  },
})
