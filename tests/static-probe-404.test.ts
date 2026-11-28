import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'
import { defineEventHandler, H3 } from 'h3'
import { isStaticProbePath } from '../shared/static-probe-404.ts'

const root = new URL('../', import.meta.url)
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('~~/'))
      return nextResolve(`${new URL(specifier.slice(3), root).href}.ts`, context)
    return nextResolve(specifier, context)
  },
})

const { handleStaticProbe404 } = await import('../server/middleware/static-probe-404.ts')

const BLOCKED_PROBES = [
  // Unknown .well-known probes
  '/.well-known/traffic-advice',
  '/.well-known/agent.json',
  '/.well-known/ai-catalog.json',
  '/.well-known/security.txt',
  '/.well-known/openid-federation',
  // WordPress, PHP, and CMS scanner probes
  '/xmlrpc.php',
  '/wp-login.php',
  '/blog/wp-login.php',
  '/cms/wp-login.php',
  '/wp-json/batch/v1',
  '/learn-lighthouse/best-practices/wp-json/batch/v1',
  '/wp-content/uploads/2023/08/logo-gold.png',
  '/wp-admin/install.php',
  '/wp-includes/wlwmanifest.xml',
  '/chosen.php',
  '/ws.php',
  '/2.php',
  '/browse.php',
  '/index.php/foo',
  '/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php',
  '/phpmyadmin/',
  '/cgi-bin/luci',
  // Dotfiles and secret probes
  '/.env',
  '/.env.local',
  '/.env.prod',
  '/.env.bak',
  '/.env~',
  '/.git/config',
  '/.htaccess',
  '/guide/.html',
  // Retired demo report assets
  '/reports/glossary/__screenshot-thumbnails__/1.jpeg',
  '/reports/api-doc/__screenshot-thumbnails__/6.jpeg',
  '/reports/cloud/__screenshot-thumbnails__/7.jpeg',
  '/reports',
  // Legacy OG image paths (replaced by /_og/s/*)
  '/__og-image__/image/og.png',
  '/__og-image__/image/guide/getting-started/unlighthouse-cli/og.jpeg',
  '/integrations/webpack/__og_image__/og.png',
  // Missing static asset probes
  '/apple-touch-icon-precomposed.png',
  '/assets/favicon-aOK6_042.ico',
  '/icons/favicon.ico',
  '/images/01.jpg',
  '/main.c6d13be3ea6fc9cb.js',
  '/static/sspanel/css/sspanel.css',
  '/assets/REDACTED.js',
  // Stale HTML probes (other than /404.html and redirected /guide/config.html)
  '/guide/improving-accuracy.html',
  '/sitemap.html',
  // Malformed percent-encoding with probe extension
  '/%E0%A4%A.php',
]

const ALLOWED_ROUTES = [
  // Core pages and docs
  '/',
  '/guide/getting-started/installation',
  '/v1/guide/guides/migrating-to-v1',
  '/integrations/cli',
  '/api-doc/config',
  '/glossary',
  '/glossary/lcp',
  '/learn-lighthouse',
  '/learn-lighthouse/lcp',
  '/tools',
  '/tools/cwv-checker',
  '/releases',
  '/admin',
  // Human typos without static/scanner signatures still reach Nuxt 404 page
  '/nonexistent-doc-page',
  '/guide/recipes/missing-page',
  // Dynamic Nuxt & module prefixes
  '/_nuxt/entry.abc123.js',
  '/_nuxt/builds/latest.json',
  '/_nuxt-skew-sw.js',
  '/_og/s/o_abc123.png',
  '/_og/r/guide',
  '/_og/d/guide',
  '/_og-static-fonts/hubot.woff2',
  '/_ipx/w_400/logo.png',
  '/_fonts/hubot-sans.woff2',
  '/api/search.json',
  '/api/stats.json',
  '/api/stats/summary.json',
  '/api/github/sponsors.json',
  '/api/github/stars',
  '/api/_nuxt_icon/carbon.json',
  '/api/_auth/session',
  '/api/tools/cwv-check',
  '/api/health',
  '/auth/github',
  '/__comark_content/query',
  '/__comark_content/rev123/navigation/root',
  '/__nuxt_content/root/sql_dump.txt',
  '/__nuxt_error',
  '/__ai-ready/status',
  '/__ai-ready__/debug.json',
  '/__ai-ready-debug',
  '/__link-checker__/link-checker-report.json',
  '/__sitemap__/style.xsl',
  '/__sitemap__/comark-content-urls.json',
  '/__skew/health',
  '/__skew/admin/stats',
  // SEO, AI-ready, and Skills routes
  '/robots.txt',
  '/sitemap.xml',
  '/sitemap_index.xml',
  '/sitemap-0.xml',
  '/sitemap.md',
  '/llms.txt',
  '/llms-full.txt',
  '/SKILL.md',
  '/skills/unlighthouse/SKILL.md',
  // Legitimate .well-known routes
  '/.well-known/agent-skills/index.json',
  '/.well-known/agent-skills/unlighthouse/SKILL.md',
  '/.well-known/api-catalog',
  '/.well-known/apple-developer-merchantid-domain-association',
  '/.well-known/acme-challenge/test-token',
  '/.well-known/mcp/server-card.json',
  '/.well-known/mcp.json',
  // Markdown twin routes served by nuxt-ai-ready
  '/guide/getting-started/installation.md',
  '/v1/guide/guides/config.md',
  '/learn-lighthouse/lcp.md',
  '/glossary/tbt.md',
  // Active redirects & prerendered error page
  '/404.html',
  '/guide/config.html',
  '/api-doc/.md',
  '/api-doc/index.md',
  '/site.webmanifest',
]

test('fast-paths static, CMS, dotfile, unknown .well-known, and retired report probes', () => {
  for (const path of BLOCKED_PROBES) {
    assert.equal(isStaticProbePath(path), true, `Expected ${path} to be classified as a static probe`)
  }
})

test('never intercepts legitimate dynamic, SEO, markdown, or page routes', () => {
  for (const path of ALLOWED_ROUTES) {
    assert.equal(isStaticProbePath(path), false, `Expected ${path} to pass through`)
  }
})

test('middleware short-circuits matched probes with edge-cached plain-text 404 headers', async () => {
  const app = new H3()
  app.use(defineEventHandler(event => handleStaticProbe404(event)))
  app.use(defineEventHandler(() => 'passed-through'))

  const getRes = await app.fetch(new Request('https://unlighthouse.dev/xmlrpc.php?probe=1'))
  assert.equal(getRes.status, 404)
  assert.equal(getRes.headers.get('content-type'), 'text/plain; charset=utf-8')
  assert.equal(getRes.headers.get('cache-control'), 'no-store')
  assert.equal(getRes.headers.get('cloudflare-cdn-cache-control'), 'public, max-age=300')
  assert.equal(getRes.headers.get('x-robots-tag'), 'noindex')
  assert.equal(await getRes.text(), 'Not Found')

  const headRes = await app.fetch(new Request('https://unlighthouse.dev/.well-known/traffic-advice', { method: 'HEAD' }))
  assert.equal(headRes.status, 404)
  assert.equal(headRes.headers.get('cloudflare-cdn-cache-control'), 'public, max-age=300')
  assert.equal(await headRes.text(), '')

  const allowedRes = await app.fetch(new Request('https://unlighthouse.dev/_nuxt/entry.abc123.js'))
  assert.equal(allowedRes.status, 200)
  assert.equal(await allowedRes.text(), 'passed-through')

  const mdRes = await app.fetch(new Request('https://unlighthouse.dev/guide/getting-started/installation.md'))
  assert.equal(mdRes.status, 200)
  assert.equal(await mdRes.text(), 'passed-through')
})
