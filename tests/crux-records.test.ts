/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'
import { createError } from 'h3'

const root = new URL('../', import.meta.url)
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('~~/'))
      return nextResolve(`${new URL(specifier.slice(3), root).href}.ts`, context)
    if (specifier.startsWith('.') && !specifier.endsWith('.ts'))
      return nextResolve(`${specifier}.ts`, context)
    return nextResolve(specifier, context)
  },
})

const period = {
  firstDate: { year: 2026, month: 9, day: 1 },
  lastDate: { year: 2026, month: 9, day: 28 },
}

test('keeps a missing historical field percentile unavailable rather than turning it into zero', async () => {
  const { normaliseCruxHistory } = await import('../layers/tools/server/utils/crux.ts')
  const history = normaliseCruxHistory({
    key: { origin: 'https://example.com', formFactor: 'PHONE' },
    collectionPeriods: [period],
    metrics: {
      largest_contentful_paint: { histogramTimeseries: [], percentilesTimeseries: { p75s: [1500] } },
      cumulative_layout_shift: { histogramTimeseries: [], percentilesTimeseries: { p75s: [null] } },
    },
  })
  assert.equal(history[0]?.lcp75, 1500)
  assert.equal(history[0]?.cls75, undefined)
})

test('drops an invalid current percentile instead of supplying it to an assessment', async () => {
  const { normalizeCruxCurrent } = await import('../layers/tools/server/utils/crux.ts')
  const current = normalizeCruxCurrent({
    key: { origin: 'https://example.com', formFactor: 'PHONE' },
    collectionPeriod: period,
    metrics: { cumulative_layout_shift: { histogram: [], percentiles: { p75: 'NaN' } } },
  })
  assert.equal(current.cls, undefined)
})

test('retains origin fallback identity, collection period, device and raw CLS units at the metric API boundary', async () => {
  const globals = globalThis as unknown as Record<string, unknown>
  globals.defineEventHandler = (handler: unknown) => handler
  globals.readBody = async () => ({ url: 'https://example.com/article', metric: 'cls', formFactor: 'DESKTOP' })
  globals.normalizeUrl = (value: string) => value
  globals.isValidUrl = () => true
  globals.createError = createError
  globals.useRuntimeConfig = () => ({ googleApiToken: 'test-key' })
  const requests: Record<string, unknown>[] = []
  globals.$fetch = async (_url: string, options: { body: Record<string, unknown> }) => {
    requests.push(options.body)
    if (options.body.url)
      throw createError({ statusCode: 404 })
    return { record: {
      key: { origin: 'https://example.com', formFactor: 'DESKTOP' },
      collectionPeriod: period,
      metrics: { cumulative_layout_shift: { percentiles: { p75: '0.05' }, histogram: [{ density: 0.9 }, { density: 0.08 }, { density: 0.02 }] } },
    } }
  }
  const { default: handler } = await import('../layers/tools/server/api/crux/metric.post.ts')
  const result = await handler({} as never)
  assert.deepEqual(requests, [{ formFactor: 'DESKTOP', url: 'https://example.com/article' }, { formFactor: 'DESKTOP', origin: 'https://example.com' }])
  assert.equal(result.p75, 0.05)
  assert.deepEqual(result.source, {
    provider: 'CrUX',
    scope: 'origin',
    url: 'https://example.com',
    device: 'desktop',
    collectionPeriod: { _tag: 'Dates', start: '2026-09-01', end: '2026-09-28' },
  })
  assert.deepEqual(result.histogram, { good: 90, needsImprovement: 8, poor: 2 })
})
