/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { realpathSync } from 'node:fs'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

// Resolve the nanotar instance exactly as nuxt-build-cache resolves it at runtime.
const nuxtBuildCacheEntry = realpathSync(createRequire(import.meta.url).resolve('nuxt-build-cache'))
const { createTar, parseTar } = createRequire(nuxtBuildCacheEntry)('nanotar')

test('build-cache restore round-trips a zero-size file entry without crashing writeFile', async () => {
  const tar = createTar([{ name: 'empty.js', data: new Uint8Array(0) }])
  const [item] = parseTar(tar)

  assert.ok(item.data instanceof Uint8Array)

  const dir = await mkdtemp(join(tmpdir(), 'nanotar-restore-'))
  try {
    const target = join(dir, item.name)
    await writeFile(target, item.data)
    assert.equal((await readFile(target)).length, 0)
  }
  finally {
    await rm(dir, { recursive: true, force: true })
  }
})
