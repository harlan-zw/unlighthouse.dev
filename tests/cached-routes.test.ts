import assert from 'node:assert/strict'
import { createRequire, registerHooks } from 'node:module'
import { extname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { H3Event } from 'h3'

const root = new URL('../', import.meta.url)
const nitroRequire = createRequire(import.meta.resolve('nitro/cache'))
const ocache = nitroRequire.resolve('ocache')
const fixture = new URL('./fixtures/cache-boundaries.ts', import.meta.url).href
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '#nitro/virtual/cache')
      return { url: 'fixture:cache-storage', shortCircuit: true }
    if (specifier === './app.mjs' && context.parentURL?.endsWith('/internal/cache.mjs'))
      return { url: 'fixture:nitro-app', shortCircuit: true }
    if (specifier === 'nuxt/server' || specifier === 'ofetch' || specifier === '#server/utils/analytics' || specifier === '~~/server/utils/github' || specifier === '~~/logger' || specifier.endsWith('/public-fetch'))
      return { url: fixture, shortCircuit: true }
    if (specifier.startsWith('#server/'))
      return nextResolve(`${new URL(`server/${specifier.slice(8)}`, root).href}.ts`, context)
    if (specifier.startsWith('~~/'))
      return nextResolve(`${new URL(specifier.slice(3), root).href}.ts`, context)
    if (specifier.startsWith('.') && !extname(specifier))
      return nextResolve(`${specifier}.ts`, context)
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url === 'fixture:cache-storage') {
      return { format: 'module', shortCircuit: true, source: `import { createMemoryStorage } from ${JSON.stringify(new URL(ocache, 'file://').href)}; const storage = createMemoryStorage(); export const createCacheStorage = () => storage; export const cacheFunctionDefaults = {}; export const cacheHandlerDefaults = {};` }
    }
    if (url === 'fixture:nitro-app')
      return { format: 'module', shortCircuit: true, source: 'export const useNitroApp = () => ({})' }
    return nextLoad(url, context)
  },
})

const { state } = await import('./fixtures/cache-boundaries.ts')
const { fetchPSI } = await import('../server/utils/psi.ts')
const tools = ['cwv-check', 'pagespeed-insights', 'inp', 'page-size', 'cls', 'lcp', 'page-weight'] as const
const handlers = new Map<string, (event: H3Event) => unknown>()
for (const tool of tools) {
  const { default: handler } = await import(`../layers/tools/server/api/tools/${tool}.get.ts`)
  handlers.set(tool, handler)
}
const { default: lastCommit } = await import('../server/api/github/last-file-commit.get.ts')
const { default: releases } = await import('../server/api/github/releases.get.ts')

function event(path: string, ip = '203.0.113.1', db?: object) {
  const req = new Request(`https://local.test${path}`, { headers: { 'cf-connecting-ip': ip } })
  Object.assign(req, { runtime: { cloudflare: { env: db ? { DB: db } : {} } } })
  return new H3Event(req)
}

async function json(handler: (event: H3Event) => unknown, request: H3Event) {
  const response = await handler(request) as Response
  assert.equal(response.status, 200)
  return await response.json() as Record<string, unknown>
}

for (const tool of tools) {
  test(`${tool} honors URL and strategy on cold and warm requests`, async () => {
    const handler = handlers.get(tool)!
    const url = `https://example.com/${tool}`
    for (const strategy of ['desktop', 'mobile']) {
      for (let repeat = 0; repeat < 2; repeat++) {
        const result = await json(handler, event(`/api/tools/${tool}?url=${encodeURIComponent(url)}&strategy=${strategy}`))
        assert.equal(result.url, url)
        if (tool !== 'page-weight')
          assert.equal(result.strategy, strategy)
      }
    }
  })
}

test('versioned last-commit lookups honor file and branch cold and warm', async () => {
  for (const branch of ['v1', '0.x']) {
    for (let repeat = 0; repeat < 2; repeat++) {
      const result = await json(lastCommit, event(`/api/github/last-file-commit?file=guide&branch=${branch}`))
      assert.equal(result.message, `guide.md:${branch}`)
    }
  }
})

test('releases honor body=false and limit=1 cold and warm without poisoning defaults', async () => {
  for (let repeat = 0; repeat < 2; repeat++) {
    const result = await json(releases, event('/api/github/releases?body=false&limit=1'))
    assert.deepEqual(result.releases, [{ name: 'v2', publishedAt: null }])
  }
  const defaults = await json(releases, event('/api/github/releases'))
  assert.deepEqual(defaults.releases, [
    { name: 'v2', publishedAt: null, body: 'second' },
    { name: 'v1', publishedAt: null, body: 'first' },
  ])
})

for (const tool of tools) {
  test(`${tool} charges distinct clients to their own D1 counters including warm hits`, async () => {
    const db = new DatabaseSync(':memory:')
    db.exec('CREATE TABLE rate_limits (key TEXT PRIMARY KEY, count INTEGER, expires_at INTEGER)')
    const binding = {
      prepare: (sql: string) => ({
        bind: (...values: unknown[]) => ({
          first: async (column: string) => (db.prepare(sql).get(...values as never[]) as Record<string, unknown>)?.[column] ?? null,
        }),
      }),
    }
    try {
      for (const ip of ['203.0.113.10', '203.0.113.20']) {
        for (let repeat = 0; repeat < 2; repeat++) {
          const response = await handlers.get(tool)!(event(`/api/tools/${tool}?url=https://example.com/quota-${tool}`, ip, binding)) as Response
          assert.equal(response.status, 200)
          assert.equal(response.headers.get('X-RateLimit-Remaining'), String(49 - repeat))
          await response.json()
        }
      }
      assert.deepEqual(db.prepare('SELECT key, count FROM rate_limits ORDER BY key').all().map(row => ({ ...row })), [
        { key: 'ratelimit:tool:ip:203.0.113.10', count: 2 },
        { key: 'ratelimit:tool:ip:203.0.113.20', count: 2 },
      ])
    }
    finally {
      db.close()
    }
  })
}

test('a 40-second PageSpeed lookup succeeds and is cached', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] })
  state.delay = 40_000
  const before = state.psiCalls
  const request = event('/raw')
  const pending = fetchPSI(request, 'https://example.com/slow', 'desktop')
  const result = assert.doesNotReject(pending)
  await new Promise(resolve => setImmediate(resolve))
  t.mock.timers.tick(40_000)
  await result
  assert.deepEqual(await fetchPSI(request, 'https://example.com/slow', 'desktop'), await pending)
  assert.equal(state.psiCalls - before, 1)
  state.delay = 0
})

for (const tool of tools.filter(tool => tool !== 'page-weight')) {
  test(`${tool} permits a 40-second cold PageSpeed result and caches it`, async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] })
    state.delay = 40_000
    const before = state.psiCalls
    const path = `/api/tools/${tool}?url=https://example.com/slow-${tool}`
    const pending = json(handlers.get(tool)!, event(path))
    const settled = assert.doesNotReject(pending)
    await new Promise(resolve => setImmediate(resolve))
    t.mock.timers.tick(40_000)
    await settled
    const result = await pending
    assert.equal(result.url, `https://example.com/slow-${tool}`)
    assert.deepEqual(await json(handlers.get(tool)!, event(path)), result)
    assert.equal(state.psiCalls - before, 1)
    state.delay = 0
  })
}
