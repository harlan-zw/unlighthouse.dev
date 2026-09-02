import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { defineNuxtConfig } from 'nuxt/config'
import { resolve } from 'pathe'
import { gray, logger } from './logger'
import { CLOUDFLARE_REQUIRED_SECRETS } from './shared/cloudflare'
import { EXPECTED_UPSTREAM_FAILURE_MESSAGE_RE, STACKLESS_FETCH_FAILURE_MESSAGE_RE, STACKLESS_UNHANDLED_REJECTION_EVENT_MESSAGE_RE, STACKLESS_UNHANDLED_REJECTION_OBJECT_MESSAGE_RE } from './shared/sentry'

// workerd installs its Node-compatible `console` as soon as anything in the
// bundle imports `node:console` (undici, via node-fetch-native, does). That
// console declares `createTask` but throws ERR_METHOD_NOT_IMPLEMENTED when it
// is called. `hookable` feature-detects the property once at module scope and
// then calls it on every hook, so every non-prerendered route returned a 500.
//
// The swap happens at link time, so no import ordering avoids it and a Nitro
// plugin runs far too late. This banner is the only code that runs before
// hookable's module body. It probes the method and, when the probe throws,
// removes it so hookable's detection fails and it uses its own no-op runner.
// Wrapped in an IIFE: a bare `var` at chunk scope collides with Terser's own
// minified bindings and fails the build.
const workerdConsoleTaskFix = `;(function(){try{var c=globalThis.console;if(c&&typeof c.createTask==="function"&&!c.__ctProbed){c.__ctProbed=1;try{c.createTask("probe")}catch(e){c.createTask=void 0}}}catch(e){}})();`

export default defineNuxtConfig({
  extends: ['./layers/tools', './layers/admin'],

  nuxtDx: {
    report: true,
  },

  nuxtSentry: {
    dsn: 'https://51433a56963f6765e73969dbca31337e@o4510507748163584.ingest.us.sentry.io/4511887362555904',
    project: 'unlighthouse',
    policy: {
      // Every PageSpeed Insights and Chrome UX Report failure this site raises on
      // purpose. A Google outage is not a defect here, and it used to fill the
      // issue feed. The module reads no marker from `data`, so the Drop Rule
      // matches the message instead.
      ignoreErrors: [EXPECTED_UPSTREAM_FAILURE_MESSAGE_RE],
      // The app manifest poll that fails with no stack. Matching the message alone
      // would also drop the same failure raised from site code, so this rule needs
      // the empty frame list as well.
      dropStacklessErrors: [
        STACKLESS_FETCH_FAILURE_MESSAGE_RE,
        // Safari raises unhandledrejection as a frameless CustomEvent the SDK cannot
        // stack. See shared/sentry.ts for the full story.
        STACKLESS_UNHANDLED_REJECTION_EVENT_MESSAGE_RE,
        // A plain object reaching the global rejection handler is serialized the same
        // way, with the stringified keys as a varying tail. See shared/sentry.ts.
        STACKLESS_UNHANDLED_REJECTION_OBJECT_MESSAGE_RE,
      ],
    },
  },

  modules: [
    '@harlan-zw/nuxt-cloudflare',
    '@harlan-zw/nuxt-dx',
    '@harlan-zw/nuxt-github-sponsors',
    '@nuxtjs/seo',
    '@comark/nuxt',
    '@nuxt/ui',
    ['motion-v/nuxt', { directives: true }],
    '@harlan-zw/comark-content',
    '@vueuse/nuxt',
    'nitro-cloudflare-dev',
    '@nuxt/scripts',
    '@nuxt/image',
    'nuxt-skew-protection',
    'nuxt-ai-ready',
    '@sentry/nuxt/module',
    '@harlan-zw/nuxt-sentry',
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

  nuxtCloudflare: {
    kvCache: { binding: 'CACHE' },
    requiredSecrets: CLOUDFLARE_REQUIRED_SECRETS,
  },

  sitemap: {
    zeroRuntime: true,
    exclude: [
      '**/.navigation',
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
      // Empty on purpose. The Worker secret binding NUXT_GITHUB_SPONSORS_TOKEN
      // supplies it at runtime. A token read at build time is baked into the
      // deployed bundle, and `@harlan-zw/nuxt-cloudflare` fails the build for it.
      token: '',
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
    githubAuthClientSecret: '', // NUXT_GITHUB_AUTH_CLIENT_SECRET
    googleApiToken: '', // NUXT_GOOGLE_API_TOKEN (PageSpeed Insights)
    cloudflareAccountId: '', // NUXT_CLOUDFLARE_ACCOUNT_ID
    cloudflareAnalyticsApiToken: '', // NUXT_CLOUDFLARE_ANALYTICS_API_TOKEN
    public: {
      // moduleDeps: pkgJson.dependencies,
      // version: pkgJson.version,
    },
  },

  githubSponsors: {
    login: 'harlan-zw',
    route: '/api/github/sponsors.json',
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
    rollupConfig: {
      output: {
        banner: workerdConsoleTaskFix,
      },
    },
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
        // workerd only exposes `node:console` (which Nitro emits as an external
        // import) from a much later date than this was pinned at. Matches the
        // value nuxtseo.com deploys on.
        compatibility_date: '2026-08-11',
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
          // Full log volume. The module default is 0.01.
          logs: { head_sampling_rate: 1 },
        },
        vars: {
          NUXT_OAUTH_GITHUB_CLIENT_ID: process.env.NUXT_OAUTH_GITHUB_CLIENT_ID || '',
          NUXT_OAUTH_GITHUB_REDIRECT_URL: process.env.NUXT_OAUTH_GITHUB_REDIRECT_URL || '',
          NUXT_CLOUDFLARE_ACCOUNT_ID: process.env.NUXT_CLOUDFLARE_ACCOUNT_ID || '',
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

    '/': { prerender: true },
    '/guide/**': { prerender: true },
    '/integrations/**': { prerender: true },
    '/api-doc': { prerender: true },
    '/api-doc/**': { prerender: true },
    '/glossary': { prerender: true },
    '/glossary/**': { prerender: true },
    '/learn-lighthouse': { prerender: true },
    '/learn-lighthouse/**': { prerender: true },
    '/tools': { prerender: true },
    '/tools/**': { prerender: true },

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
      scan: {
        globInclude: ['**/*.{vue,jsx,tsx,md,mdc,mdx,yml,yaml}', '**/app.config.{ts,js}'],
      },
      icons: [
        'vscode-icons:file-type-arduino',
        'vscode-icons:file-type-assembly',
        'vscode-icons:file-type-bicep',
        'vscode-icons:file-type-cppheader',
        'vscode-icons:file-type-csharp',
        'vscode-icons:file-type-dartlang',
        'vscode-icons:file-type-dotenv',
        'vscode-icons:file-type-editorconfig',
        'vscode-icons:file-type-elixir',
        'vscode-icons:file-type-erlang',
        'vscode-icons:file-type-eslint',
        'vscode-icons:file-type-favicon',
        'vscode-icons:file-type-fortran',
        'vscode-icons:file-type-fsharp',
        'vscode-icons:file-type-git',
        'vscode-icons:file-type-gleam',
        'vscode-icons:file-type-go',
        'vscode-icons:file-type-haskell',
        'vscode-icons:file-type-js',
        'vscode-icons:file-type-julia',
        'vscode-icons:file-type-kotlin',
        'vscode-icons:file-type-lisp',
        'vscode-icons:file-type-markdown',
        'vscode-icons:file-type-node',
        'vscode-icons:file-type-npm',
        'vscode-icons:file-type-nuxt',
        'vscode-icons:file-type-perl',
        'vscode-icons:file-type-pnpm',
        'vscode-icons:file-type-powershell',
        'vscode-icons:file-type-python',
        'vscode-icons:file-type-ruby',
        'vscode-icons:file-type-rust',
        'vscode-icons:file-type-scala',
        'vscode-icons:file-type-tailwind',
        'vscode-icons:file-type-tsconfig',
        'vscode-icons:file-type-typescript',
        'vscode-icons:file-type-vscode',
        'vscode-icons:file-type-vue',
        'vscode-icons:file-type-yaml',
        'vscode-icons:file-type-yarn',
      ],
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

  compatibilityDate: '2025-07-23',
  // `@harlan-zw/nuxt-sentry` sets `sourcemap.client` when a Sentry auth token is
  // present, and deliberately leaves the server alone, where Nuxt defaults to true.
  // Without this the server bundle ships its own source maps.
  sourcemap: {
    server: false,
  },

})
