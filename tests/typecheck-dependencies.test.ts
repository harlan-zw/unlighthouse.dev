import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import test from 'node:test'

const root = resolve(import.meta.dirname, '..')

test('typechecks Node APIs and the elapsed timer with installed dependencies', async () => {
  const cache = resolve(root, 'tools/typecheck/.generated')
  await mkdir(cache, { recursive: true })
  const fixture = await mkdtemp(resolve(cache, 'dependencies-'))
  try {
    await writeFile(resolve(fixture, 'input.ts'), `
import { isIP } from 'node:net'
import { useNow as vueUseNow, useIntervalFn as vueUseIntervalFn } from '@vueuse/core'
import { computed as vueComputed, toValue as vueToValue } from 'vue'
import { useToolElapsed } from '${resolve(root, 'layers/tools/app/utils/tool-loading.ts')}'
declare global {
  const useNow: typeof vueUseNow
  const useIntervalFn: typeof vueUseIntervalFn
  const computed: typeof vueComputed
  const toValue: typeof vueToValue
}
const address: number = isIP('127.0.0.1')
const bytes: Uint8Array = Buffer.from(process.version)
const elapsed: number = useToolElapsed().elapsedMs.value
console.log(address, bytes, elapsed)
`)
    await writeFile(resolve(fixture, 'tsconfig.json'), JSON.stringify({
      extends: resolve(root, 'tsconfig.json'),
      compilerOptions: { noEmit: true, incremental: false },
      include: ['./input.ts'],
    }))
    const result = spawnSync(process.execPath, [resolve(root, 'tools/typecheck/check.ts'), '-p', resolve(fixture, 'tsconfig.json')], {
      cwd: root,
      encoding: 'utf8',
      timeout: 30_000,
    })
    if (result.error)
      throw result.error
    assert.equal(result.status, 0, result.stdout + result.stderr)
  }
  finally {
    await rm(fixture, { recursive: true, force: true })
  }
})
