import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { defineNuxtConfig } from 'nuxt/config'
import { resolve } from 'pathe'
import { gray, logger } from './logger'

export default defineNuxtConfig({
  modules: [
    '@nuxtjs/seo',
    '@nuxt/ui-pro',
    'motion-v/nuxt',
    '@nuxt/content',
    '@vueuse/nuxt',
    '@nuxthub/core',
    '@mdream/nuxt',
    '@nuxt/scripts',
    '@nuxt/image',
    async (_, nuxt) => {
      nuxt.hooks.hook('nitro:init', (nitro) => {
        // from sponsorkit
        nitro.options.alias.sharp = 'unenv/mock/empty'
        nitro.options.alias.pnpapi = 'unenv/mock/empty' // ?
        nitro.hooks.hook('compiled', async (_nitro) => {
          const routesPath = resolve(nitro.options.output.publicDir, '_routes.json')
          if (existsSync(routesPath)) {
            const routes: { version: number, include: string[], exclude: string[] } = await readFile(routesPath)
              .then(buffer => JSON.parse(buffer.toString()))
            const preSize = routes.exclude.length
            routes.exclude = routes.exclude.filter((path) => {
              if (path.startsWith('/guides') || path.startsWith('/api-doc') || path.startsWith('/integrations')) {
                return false
              }
              return true
            })
            if (!routes.exclude.includes('/guides/*')) {
              routes.exclude.push('/guides/*')
            }
            if (!routes.exclude.includes('/api-doc/*')) {
              routes.exclude.push('/api-doc/*')
            }
            if (!routes.exclude.includes('/integrations/*')) {
              routes.exclude.push('/integrations/*')
            }
            if (preSize !== routes.exclude.length) {
              logger.info(`Optimizing CloudFlare \`_routes.json\` ${gray(`(${100 - Math.round(routes.exclude.length / preSize * 100)}% smaller)`)}`)
            }
            await writeFile(routesPath, JSON.stringify(routes, void 0, 2))
          }
        })
      })
    },
  ],

  sitemap: {
    exclude: [
      '**/.navigation',
      '/__nuxt_content/**',
    ],
    xslColumns: [
      { label: 'URL', width: '100%' },
    ],
  },

  uiPro: {
    mdc: true,
    content: true,
  },

  hub: {
    database: true,
    cache: true,
    kv: true,
  },

  future: {
    compatibilityVersion: 4,
  },

  runtimeConfig: {
    emailOctopusToken: '', // NUXT_EMAIL_OCTOPUS_TOKEN
    githubAccessToken: '', // NUXT_GITHUB_ACCESS_TOKEN
    githubAuthToken: '', // NUXT_GITHUB_AUTH_TOKEN
    githubAuthClientId: 'cabace556bd9519d9299', // NUXT_GITHUB_AUTH_CLIENT_ID
    githubAuthClientSecret: '', // NUXT_GITHUB_AUTH_SECRET_ID

    public: {
      // moduleDeps: pkgJson.dependencies,
      // version: pkgJson.version,
    },
  },

  fonts: {
    experimental: {
      processCSSVariables: true,
    },
    families: [
      { name: 'Hubot Sans', provider: 'local', weight: [200, 900], stretch: '75% 125%' },
    ],
  },

  nitro: {
    prerender: {
      failOnError: false,
      crawlLinks: true,
      routes: ['/', '/404.html'],
    },
    experimental: {
      openAPI: true,
    },
    cloudflare: {
      pages: {
        routes: {
          exclude: [
            '/guides/*',
            '/integrations/*',
            '/api-doc/*',
            '/__nuxt_content/*',
            '/llms.txt',
            '/llms-full.txt',
          ],
        },
      },
    },
  },

  linkChecker: {
    report: {
      // generate both a html and markdown report
      html: true,
      markdown: true,
      json: true,
      publish: true,
    },
  },

  site: {
    url: 'https://unlighthouse.dev',
    name: 'Unlighthouse',
    description: 'Google Lighthouse for your entire site.',
    titleSeparator: '·',
  },

  content: {
    database: { type: 'd1', binding: 'DB' },
    build: {
      markdown: {
        highlight: {
          theme: {
            light: 'github-light',
            default: 'github-light',
            dark: 'material-theme-palenight',
          },
          langs: [
            'ts',
            'vue',
            'json',
            'html',
            'bash',
            'diff',
            'md',
            'dotenv',
          ],
        },
      },
    },
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  hooks: {
    'components:extend': function (components) {
      for (const component of components) {
        if (component.pascalName === 'UAlert') {
          component.global = true
        }
      }
    },
  },

  mdc: {
    highlight: {
      noApiRoute: false,
      theme: {
        light: 'github-light',
        default: 'github-light',
        dark: 'material-theme-palenight',
      },
      langs: [
        'ts',
        'vue',
        'json',
        'html',
        'bash',
        'diff',
        'md',
        'dotenv',
      ],
    },
  },

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'Unlighthouse',
      logo: '/logo.svg',
    },
  },

  $production: {
    routeRules: {
      '/api/stats.json': { prerender: true },
      '/api/github/sponsors.json': { prerender: true },
      '/api/_mdc/highlight': { cache: { group: 'mdc', name: 'highlight', maxAge: 60 * 60 } },
      '/api/_nuxt_icon': { cache: { group: 'icon', name: 'icon', maxAge: 60 * 60 * 24 * 7 } },
      // /api/config -> /api-docs/config
      '/api/config': { redirect: { to: '/api-docs/config', statusCode: 301 } },
      // /api/glossary -> /api-docs/glossary
      '/api/glossary': { redirect: { to: '/api-docs/glossary', statusCode: 301 } },
      // /api/index -> /api-docs/index
      '/api': { redirect: { to: '/api-docs', statusCode: 301 } },
    },
    scripts: {
      registry: {
        fathomAnalytics: {
          site: 'WPEZVIVE',
        },
      },
    },
  },

  routeRules: {
  },

  css: [
    '~/css/global.css',
  ],

  ogImage: {
    zeroRuntime: true,
    fonts: [
      'Hubot+Sans:400',
      'Hubot+Sans:700',
    ],
  },

  icon: {
    customCollections: [{
      prefix: 'custom',
      dir: resolve('./app/assets/icons'),
    }],
    clientBundle: {
      scan: true,
      includeCustomCollections: true,
    },
    provider: 'iconify',
  },

  seo: {
    meta: {
      themeColor: [
        { content: '#18181b', media: '(prefers-color-scheme: dark)' },
        { content: 'white', media: '(prefers-color-scheme: light)' },
      ],
    },
  },

  app: {
    pageTransition: {
      name: 'page',
      mode: 'out-in',
    },
    head: {
      templateParams: {
        separator: '·',
      },
    },
  },

  compatibilityDate: '2025-07-23',
})
