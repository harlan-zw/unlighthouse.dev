/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'
import { createError } from 'h3'

const root = new URL('../', import.meta.url)

// The util names its imports with Nuxt's `~~` root alias, which plain Node
// does not resolve, so tests map that alias onto the repository root here.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('~~/'))
      return nextResolve(`${new URL(specifier.slice(3), root).href}.ts`, context)
    return nextResolve(specifier, context)
  },
})

// The util is written against Nitro's auto-imports. Tests provide the ones it
// uses, so the upstream request options are the only thing under test.
const globals = globalThis as unknown as Record<string, unknown>
globals.createError = createError
globals.useRuntimeConfig = () => ({ googleApiToken: 'test-key' })

interface CapturedCall {
  url: string
  options: Record<string, unknown>
}

async function captureCruxFetch(work: (calls: CapturedCall[]) => Promise<void>) {
  const calls: CapturedCall[] = []
  const previous = globals.$fetch
  globals.$fetch = async (url: string, options: Record<string, unknown>) => {
    calls.push({ url, options })
    return { record: { metrics: {}, collectionPeriods: [] } }
  }
  try {
    await work(calls)
  }
  finally {
    globals.$fetch = previous
  }
}

test('caps the crux current-record fetch with the same timeout as psi', async () => {
  await captureCruxFetch(async (calls) => {
    const { fetchCrUXCurrent } = await import('../layers/tools/server/utils/crux.ts')

    await fetchCrUXCurrent({} as never, 'https://example.com/', 'origin', 'ALL_FORM_FACTORS')

    const call = calls.at(-1)
    assert.equal(call?.url, 'https://chromeuxreport.googleapis.com/v1/records:queryRecord')
    assert.equal(call.options.timeout, 120_000)
  })
})

test('caps the crux history fetch with the same timeout as psi', async () => {
  await captureCruxFetch(async (calls) => {
    const { fetchCrUXHistory } = await import('../layers/tools/server/utils/crux.ts')

    await fetchCrUXHistory({} as never, 'https://example.com/', 'url', 'DESKTOP')

    const call = calls.at(-1)
    assert.equal(call?.url, 'https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord')
    assert.equal(call.options.timeout, 120_000)
  })
})
