import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { defineNuxtConfig } from 'nuxt/config'
import { resolve } from 'pathe'
import { gray, logger } from './logger'
import { SENTRY_DSN, sentryRelease } from './shared/sentry'

const staticPageHeaders = {
  'cache-control': 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
}

const hasSentryAuthToken = Boolean(process.env.SENTRY_AUTH_TOKEN)
  || existsSync('.env.sentry-build-plugin')

export default defineNuxtConfig({
  extends: ['./layers/tools', './layers/admin'],

  nuxtDx: {
    report: true,
  },

  modules: [
    '@harlan-zw/nuxt-dx',
    '@harlan-zw/nuxt-github-sponsors',
    '@nuxtjs/seo',
    '@nuxt/ui',
    ['motion-v/nuxt', { directives: true }],
    '@nuxt/content',
    '@vueuse/nuxt',
    'nitro-cloudflare-dev',
    '@nuxt/scripts',
    '@nuxt/image',
    'nuxt-skew-protection',
    'nuxt-ai-ready',
    '@sentry/nuxt/module',
    // '@nuxtjs/mcp-toolkit',
    'nuxt-auth-utils',
    async (_, nuxt) => {
      nuxt.hooks.hook('nitro:init', (nitro) => {
        nitro.hooks.hook('compiled', async (_nitro) => {
          const routesPath = resolve(nitro.options.output.publicDir, '_routes.json')
          if (existsSync(routesPath)) {
            const routes: { version: number, include: string[], exclude: string[] } = await readFile(routesPath)
              .then(buffer => JSON.parse(buffer.toString()))
            const preSize = routes.exclude.length
            routes.exclude = routes.exclude.filter((path) => {
              if (path.startsWith('/guide') || path.startsWith('/api-doc') || path.startsWith('/integrations')) {
                return false
              }
              return true
            })
            if (!routes.exclude.includes('/guide/*')) {
              routes.exclude.push('/guide/*')
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
    zeroRuntime: true,
    exclude: [
      '**/.navigation',
      '/__nuxt_content/**',
      '/api-doc',
      '/api-doc/config',
      '/api-doc/glossary',
      '/admin',
      '/admin/**',
    ],
    xslColumns: [
      { label: 'URL', width: '100%' },
    ],
  },

  ui: {
    experimental: {
      componentDetection: true,
    },
    mdc: true,
    content: true,
  },

  future: {
    compatibilityVersion: 5,
  },

  aiReady: {
    database: {
      type: 'd1',
      bindingName: 'DB',
    },
    cron: true,
    runtimeSync: {
      ttl: 60 * 60,
    },
    indexNow: true,
  },

  skewProtection: {
    updateStrategy: 'ws',
    reloadStrategy: 'idle',
    connectionTracking: true,
    routeTracking: true,
    ipTracking: true,
  },

  runtimeConfig: {
    githubSponsors: {
      token: process.env.NUXT_GITHUB_AUTH_TOKEN || '',
    },
    oauth: {
      github: {
        redirectUrl: '', // NUXT_OAUTH_GITHUB_REDIRECT_URL
        clientId: '', // NUXT_OAUTH_GITHUB_CLIENT_ID
        clientSecret: '', // NUXT_OAUTH_GITHUB_CLIENT_SECRET
      },
    },
    session: {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      password: '', // NUXT_SESSION_PASSWORD
      cookie: {
        sameSite: 'lax',
        secure: true,
      },
    },
    emailOctopusToken: '', // NUXT_EMAIL_OCTOPUS_TOKEN
    githubAccessToken: '', // NUXT_GITHUB_ACCESS_TOKEN
    githubAuthToken: '', // NUXT_GITHUB_AUTH_TOKEN
    githubAuthClientId: '', // NUXT_GITHUB_AUTH_CLIENT_ID
    githubAuthClientSecret: '', // NUXT_GITHUB_AUTH_SECRET_ID
    googleApiToken: '', // NUXT_GOOGLE_API_TOKEN (PageSpeed Insights)
    cloudflareAccountId: '', // NUXT_CLOUDFLARE_ACCOUNT_ID
    cloudflareAnalyticsApiToken: '', // NUXT_CLOUDFLARE_ANALYTICS_API_TOKEN
    sentry: {
      dsn: SENTRY_DSN,
      enabled: process.env.NODE_ENV === 'production',
      environment: 'production',
      release: sentryRelease() ?? '',
      tracesSampleRate: 0.05,
    },

    public: {
      // moduleDeps: pkgJson.dependencies,
      // version: pkgJson.version,
    },
  },

  githubSponsors: {
    login: 'harlan-zw',
    mode: 'prerender',
    route: '/api/github/sponsors.json',
    tiers: [
      { key: 'top', minimumMonthlyDollars: 50 },
      { key: 'gold', minimumMonthlyDollars: 25 },
    ],
    overrides: {
      'Kintell-labs': { name: 'Kintell', websiteUrl: 'https://kintell.com' },
      'Massive Monster': { websiteUrl: 'https://massivemonster.co' },
    },
  },

  fonts: {
    defaults: {
      styles: ['normal'],
    },
    experimental: {
      processCSSVariables: true,
    },
    families: [
      { name: 'Hubot Sans', stretch: '75% 125%', global: true },
      { name: 'Nunito Sans' },
    ],
  },

  nitro: {
    plugins: [
      resolve('./server/plugins/escape-inline-payload.ts'),
    ],
    externals: {
      external: ['agents/mcp', 'drizzle-orm'],
    },
    preset: 'cloudflare-durable',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
      wrangler: {
        name: 'unlighthouse-dev',
        account_id: '5904138d55ca25d5670dca6adf99894e',
        compatibility_date: '2025-01-01',
        compatibility_flags: ['nodejs_compat'],
        // Required for application redirects and headers to run before static HTML assets.
        // This trades static asset-only requests for Worker invocations.
        assets: {
          run_worker_first: true,
        },
        limits: {
          cpu_ms: 120_000, // 2 min for slow PSI calls
        },
        routes: [
          {
            pattern: 'unlighthouse.dev',
            zone_name: 'unlighthouse.dev',
            custom_domain: true,
          },
          // {
          //   pattern: 'www.unlighthouse.dev',
          //   zone_name: 'unlighthouse.dev',
          //   custom_domain: true,
          // },
        ],
        kv_namespaces: [
          { binding: 'KV', id: '29fb5bd433c44a989ac1fbd72940f1e4' },
          { binding: 'CACHE', id: '8f765d0c531c41edb94790f2d31d8dba' },
        ],
        d1_databases: [
          { binding: 'DB', database_name: 'unlighthouse', database_id: '5274d98a-9e23-4a78-b9af-46444ec20b2a' },
        ],
        analytics_engine_datasets: [
          { binding: 'TOOL_ANALYTICS', dataset: 'unlighthouse_tool_usage' },
        ],
        durable_objects: {
          bindings: [
            {
              name: '$DurableObject',
              class_name: '$DurableObject',
            },
          ],
        },
        migrations: [
          {
            tag: 'v1',
            new_classes: ['$DurableObject'],
          },
        ],
        ai: {
          binding: 'AI',
          experimental_remote: true,
        },
        observability: {
          logs: {
            enabled: true,
            head_sampling_rate: 1,
            invocation_logs: true,
          },
        },
        vars: {
          NUXT_SESSION_PASSWORD: process.env.NUXT_SESSION_PASSWORD || '',
          NUXT_OAUTH_GITHUB_CLIENT_ID: process.env.NUXT_OAUTH_GITHUB_CLIENT_ID || '',
          NUXT_OAUTH_GITHUB_CLIENT_SECRET: process.env.NUXT_OAUTH_GITHUB_CLIENT_SECRET || '',
          NUXT_OAUTH_GITHUB_REDIRECT_URL: process.env.NUXT_OAUTH_GITHUB_REDIRECT_URL || '',
          NUXT_GITHUB_ACCESS_TOKEN: process.env.NUXT_GITHUB_ACCESS_TOKEN || '',
          NUXT_EMAIL_OCTOPUS_TOKEN: process.env.NUXT_EMAIL_OCTOPUS_TOKEN || '',
          NUXT_GITHUB_AUTH_TOKEN: process.env.NUXT_GITHUB_AUTH_TOKEN || '',
          NUXT_GITHUB_SPONSORS_TOKEN: process.env.NUXT_GITHUB_AUTH_TOKEN || '',
          NUXT_CLOUDFLARE_ANALYTICS_API_TOKEN: process.env.NUXT_CLOUDFLARE_ANALYTICS_API_TOKEN || '',
          NUXT_CLOUDFLARE_ACCOUNT_ID: process.env.NUXT_CLOUDFLARE_ACCOUNT_ID || '',
          NUXT_GOOGLE_API_TOKEN: process.env.NUXT_GOOGLE_API_TOKEN || '',
        },
      },
    },
    prerender: {
      autoSubfolderIndex: false,
      crawlLinks: true,
      routes: ['/', '/404.html'],
      ignore: ['/llms.txt', '/auth/github', '/auth', '/api/admin/*', '/admin/*', '/api/debug'],
    },
    experimental: {
      openAPI: true,
      websocket: true,
      asyncContext: true,
      tasks: true,
    },
    storage: {
      cache: {
        driver: 'cloudflare-kv-binding',
        binding: 'CACHE',
      },
      kv: {
        driver: 'cloudflare-kv-binding',
        binding: 'KV',
      },
      // devStorage: {
      //   cache: { driver: 'memory' },
      //   kv: { driver: 'memory' },
      // },
      fs: {
        driver: 'fs',
        base: '.data/kv',
      },
    },
  },

  linkChecker: {
    excludeLinks: ['/llms.txt', '/llms-full.txt'],
    report: {
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
    database: { type: 'd1', bindingName: 'DB' },
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
      '/api/stats/summary.json': { prerender: true },
      '/api/search.json': { prerender: true },
      '/api/github/sponsors.json': { prerender: true },
      '/api/_mdc/highlight': { cache: { group: 'mdc', name: 'highlight', maxAge: 60 * 60 } },
      '/api/_nuxt_icon': { cache: { group: 'icon', name: 'icon', maxAge: 60 * 60 * 24 * 7 } },
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
    '/api/config': { redirect: { to: '/api-doc/config', statusCode: 301 } },
    '/api/glossary': { redirect: { to: '/api-doc/glossary', statusCode: 301 } },
    '/guide/getting-started/unlighthouse-cli': { redirect: { to: '/guide/getting-started/installation', statusCode: 301 } },
    '/api': { redirect: { to: '/api-doc', statusCode: 301 } },
    '/cloud': { redirect: { to: '/', statusCode: 301 } },
    '/guide': { redirect: { to: '/guide/getting-started/installation', statusCode: 301 } },
    '/guide/': { redirect: { to: '/guide/getting-started/installation', statusCode: 301 } },
    '/guide/getting-started': { redirect: { to: '/guide/getting-started/installation', statusCode: 301 } },
    '/learn-lighthouse/tbt': { redirect: { to: '/glossary/tbt', statusCode: 301 } },
    '/glossary/index': { redirect: { to: '/glossary', statusCode: 301 } },
    '/api-doc.md': { redirect: { to: '/api-doc', statusCode: 301 } },
    '/api-doc/config.md': { redirect: { to: '/api-doc/config', statusCode: 301 } },
    '/api-doc/glossary.md': { redirect: { to: '/api-doc/glossary', statusCode: 301 } },
    '/api-doc/.md': { redirect: { to: '/api-doc', statusCode: 301 } },
    '/api-doc/index.md': { redirect: { to: '/api-doc', statusCode: 301 } },
    '/learn-lighthouse/accessibility/fix': { redirect: { to: '/learn-lighthouse/accessibility#common-accessibility-issues', statusCode: 301 } },
    '/learn-lighthouse/best-practices/fix': { redirect: { to: '/learn-lighthouse/best-practices#all-best-practices-issues', statusCode: 301 } },
    '/learn-lighthouse/lcp/fix': { redirect: { to: '/learn-lighthouse/lcp#common-lcp-issues', statusCode: 301 } },
    '/learn-lighthouse/cls/fix': { redirect: { to: '/learn-lighthouse/cls#common-cls-issues', statusCode: 301 } },
    '/learn-lighthouse/inp/fix': { redirect: { to: '/learn-lighthouse/inp#common-inp-issues', statusCode: 301 } },
    '/learn-lighthouse/seo/fix': { redirect: { to: '/learn-lighthouse/seo#all-seo-audits', statusCode: 301 } },

    '/': { prerender: true, headers: staticPageHeaders },
    '/guide/**': { prerender: true, headers: staticPageHeaders },
    '/integrations/**': { prerender: true, headers: staticPageHeaders },
    '/api-doc': { prerender: true, headers: staticPageHeaders },
    '/api-doc/**': { prerender: true, headers: staticPageHeaders },
    '/glossary': { prerender: true, headers: staticPageHeaders },
    '/glossary/**': { prerender: true, headers: staticPageHeaders },
    '/learn-lighthouse': { prerender: true, headers: staticPageHeaders },
    '/learn-lighthouse/**': { prerender: true, headers: staticPageHeaders },
    '/tools': { prerender: true, headers: staticPageHeaders },
    '/tools/**': { prerender: true, headers: staticPageHeaders },

    // auth endpoints must not be cached or prerendered
    '/auth/**': { prerender: false, cache: false, headers: { 'cache-control': 'no-store' } },
    '/admin': {
      prerender: false,
      cache: false,
      headers: {
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex, nofollow',
      },
    },
    '/admin/**': {
      prerender: false,
      cache: false,
      headers: {
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex, nofollow',
      },
    },
    '/api/debug/**': { prerender: false },
  },

  css: [
    '~/css/global.css',
  ],

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
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
      bodyAttrs: {
        class: 'antialiased font-sans text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-900',
      },
    },
  },

  sentry: {
    enabled: process.env.NODE_ENV === 'production',
    org: 'harlan-zw',
    project: 'unlighthouse',
    authToken: process.env.SENTRY_AUTH_TOKEN,
    release: { name: sentryRelease() },
    sourcemaps: {
      disable: !hasSentryAuthToken,
      filesToDeleteAfterUpload: ['**/*.map'],
    },
    bundleSizeOptimizations: {
      excludeReplayShadowDom: true,
      excludeReplayIframe: true,
      excludeReplayWorker: true,
    },
    telemetry: false,
  },

  sourcemap: {
    client: hasSentryAuthToken ? 'hidden' : false,
    server: false,
  },

  compatibilityDate: '2025-07-23',
})
