/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !specifier.endsWith('.ts'))
      return nextResolve(`${specifier}.ts`, context)
    return nextResolve(specifier, context)
  },
})

const globals = globalThis as unknown as Record<string, unknown>
globals.defineCachedEventHandler = (handler: unknown) => handler
globals.checkFreeToolRateLimit = async () => {}
globals.getQuery = () => ({ url: 'https://example.com/article', strategy: 'desktop' })
globals.validateUrl = async (value: string) => value
globals.trackToolRequest = async (_event: unknown, _metadata: unknown, run: () => Promise<unknown>) => run()

const goodLab = {
  categories: { performance: { score: 1 } },
  audits: {
    'largest-contentful-paint': { numericValue: 1000, score: 1 },
    'cumulative-layout-shift': { numericValue: 0.02, score: 1 },
    'total-blocking-time': { numericValue: 50, score: 1 },
  },
}
const goodField = {
  id: 'https://example.com/article',
  metrics: {
    LARGEST_CONTENTFUL_PAINT_MS: { percentile: 1500, category: 'FAST' },
    CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 5, category: 'FAST' },
  },
}

test('a good Lighthouse run never supplies a missing field assessment', async () => {
  globals.fetchPSI = async () => ({ lighthouseResult: goodLab })
  const { default: handler } = await import('../layers/tools/server/api/tools/cwv-check.get.ts')
  const result = await handler({} as never)
  assert.equal(result.assessment._tag, 'Unavailable')
  assert.equal(result.field, null)
  assert.equal(result.lab.tbt?.value, 50)
})

test('the checker uses eligible provider field ratings with optional INP without assuming PSI CLS numeric units', async () => {
  globals.fetchPSI = async () => ({ lighthouseResult: goodLab, loadingExperience: goodField })
  const { default: handler } = await import('../layers/tools/server/api/tools/cwv-check.get.ts')
  const result = await handler({} as never)
  assert.equal(result.assessment._tag, 'Passed')
  assert.equal(result.assessment.measuredMetricCount, 2)
  assert.equal(result.field?.cls?.value, 5)
  assert.equal(result.field?.source.scope, 'url')
  assert.equal(result.field?.source.device, 'desktop')
})

test('the checker retains origin fallback and refuses an assessment with an unknown field rating', async () => {
  globals.fetchPSI = async () => ({
    lighthouseResult: goodLab,
    originLoadingExperience: {
      ...goodField,
      id: 'https://example.com',
      metrics: { ...goodField.metrics, CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 5, category: 'UNKNOWN' } },
    },
  })
  const { default: handler } = await import('../layers/tools/server/api/tools/cwv-check.get.ts')
  const result = await handler({} as never)
  assert.equal(result.assessment._tag, 'Unavailable')
  assert.equal(result.field?.source.scope, 'origin')
  assert.equal(result.field?.source.url, 'https://example.com')
  assert.deepEqual(result.field?.cls?.histogram, { good: 0, needsImprovement: 0, poor: 0 })
})
