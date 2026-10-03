/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { join } from 'pathe'
import { optimizeCloudflareRoutes } from '../shared/routes-exclude.ts'

interface Routes {
  version: number
  include: string[]
  exclude: string[]
}

async function withRoutesFile(routes: Routes | null, run: (dir: string) => Promise<void>) {
  const dir = await mkdtemp(join(tmpdir(), 'routes-exclude-'))
  try {
    if (routes) {
      await writeFile(join(dir, '_routes.json'), JSON.stringify(routes))
    }
    else {
      await mkdir(dir, { recursive: true })
    }
    await run(dir)
  }
  finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function readRoutes(dir: string): Promise<Routes> {
  return JSON.parse(await readFile(join(dir, '_routes.json'), 'utf8'))
}

test('excludes the zero-runtime og-image route from the worker', async () => {
  await withRoutesFile({ version: 1, include: ['/*'], exclude: ['/favicon.ico', '/og.png'] }, async (dir) => {
    await optimizeCloudflareRoutes(dir)
    const routes = await readRoutes(dir)
    assert.ok(routes.exclude.includes('/_og/d/*'))
    assert.ok(routes.include.includes('/*'))
  })
})

test('collapses prerendered page assets into one wildcard per tree', async () => {
  await withRoutesFile({
    version: 1,
    include: ['/*'],
    exclude: ['/guide/index.html', '/guide/getting-started/installation.html', '/api-doc/config.html', '/favicon.ico'],
  }, async (dir) => {
    const sizes = await optimizeCloudflareRoutes(dir)
    const routes = await readRoutes(dir)
    assert.ok(!routes.exclude.includes('/guide/index.html'))
    assert.ok(!routes.exclude.includes('/guide/getting-started/installation.html'))
    assert.ok(!routes.exclude.includes('/api-doc/config.html'))
    assert.ok(routes.exclude.includes('/guide/*'))
    assert.ok(routes.exclude.includes('/api-doc/*'))
    assert.ok(routes.exclude.includes('/integrations/*'))
    assert.ok(routes.exclude.includes('/favicon.ico'))
    assert.equal(sizes?.before, 4)
    assert.equal(sizes?.after, routes.exclude.length)
  })
})

test('does not duplicate excludes when it runs twice', async () => {
  await withRoutesFile({ version: 1, include: ['/*'], exclude: ['/favicon.ico'] }, async (dir) => {
    await optimizeCloudflareRoutes(dir)
    const first = await readRoutes(dir)
    await optimizeCloudflareRoutes(dir)
    const second = await readRoutes(dir)
    assert.equal(
      second.exclude.filter(path => path === '/_og/d/*').length,
      1,
    )
    assert.deepEqual(second.exclude.sort(), first.exclude.sort())
  })
})

test('keeps the exclude list untouched when the file is missing', async () => {
  await withRoutesFile(null, async (dir) => {
    const sizes = await optimizeCloudflareRoutes(dir)
    assert.equal(sizes, null)
  })
})
