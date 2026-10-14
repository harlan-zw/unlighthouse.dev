/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { assessPsiFieldData, formatMetricValue, getRating, parseFieldData, parsePsiFieldData } from '../layers/tools/server/utils/web-vitals.ts'

function loadingExperience(metrics: Record<string, unknown>) {
  return { id: 'https://example.com', metrics }
}

const INP_GOOD = {
  percentile: 150,
  category: 'FAST',
  distributions: [
    { min: 0, max: 200, proportion: 0.82 },
    { min: 200, max: 500, proportion: 0.14 },
    { min: 500, proportion: 0.04 },
  ],
}

describe('parseFieldData', () => {
  it('returns null when the response carries no field data', () => {
    assert.equal(parseFieldData(undefined), null)
    assert.equal(parseFieldData(null), null)
    assert.equal(parseFieldData({}), null)
  })

  it('returns null when metrics exist but none are recognised', () => {
    assert.equal(parseFieldData(loadingExperience({ SOME_FUTURE_METRIC: { percentile: 10 } })), null)
  })

  it('reads INP from CrUX with its distribution', () => {
    const field = parseFieldData(loadingExperience({ INTERACTION_TO_NEXT_PAINT: INP_GOOD }))
    assert.deepEqual(field?.inp, {
      value: 150,
      displayValue: '150 ms',
      rating: 'good',
      histogram: { good: 82, needsImprovement: 14, poor: 4 },
    })
    assert.equal(field?.lcp, null)
  })

  it('maps the CrUX bucket names onto ratings the UI can colour', () => {
    assert.equal(parseFieldData(loadingExperience({
      INTERACTION_TO_NEXT_PAINT: { ...INP_GOOD, percentile: 210, category: 'FAST' },
    }))?.inp?.rating, 'good')
    assert.equal(parseFieldData(loadingExperience({
      INTERACTION_TO_NEXT_PAINT: { ...INP_GOOD, category: 'AVERAGE' },
    }))?.inp?.rating, 'needs-improvement')
    assert.equal(parseFieldData(loadingExperience({
      INTERACTION_TO_NEXT_PAINT: { ...INP_GOOD, category: 'SLOW' },
    }))?.inp?.rating, 'poor')
  })

  it('keeps an unknown PSI provider rating unavailable instead of guessing numeric units', () => {
    const field = parseFieldData(loadingExperience({
      INTERACTION_TO_NEXT_PAINT: { ...INP_GOOD, percentile: 640, category: 'UNKNOWN' },
    }))
    assert.equal(field?.inp?.rating, 'unknown')
  })

  it('drops a metric with no percentile rather than reporting zero', () => {
    const field = parseFieldData(loadingExperience({
      INTERACTION_TO_NEXT_PAINT: INP_GOOD,
      LARGEST_CONTENTFUL_PAINT_MS: { category: 'SLOW' },
    }))
    assert.equal(field?.lcp, null)
    assert.ok(field?.inp)
  })

  it('treats a missing distribution as zero shares instead of failing', () => {
    const field = parseFieldData(loadingExperience({
      CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 0.05 },
    }))
    assert.deepEqual(field?.cls?.histogram, { good: 0, needsImprovement: 0, poor: 0 })
    assert.equal(field?.cls?.displayValue, '0.050')
  })
})

describe('PSI field source and assessment', () => {
  it('keeps an origin fallback separate from the tested URL and includes its period and device', () => {
    const field = parsePsiFieldData({
      loadingExperience: { metrics: {} },
      originLoadingExperience: loadingExperience({ INTERACTION_TO_NEXT_PAINT: INP_GOOD }),
    }, 'https://example.com/article', 'desktop')
    assert.deepEqual(field?.source, {
      provider: 'CrUX',
      scope: 'origin',
      url: 'https://example.com',
      device: 'desktop',
      collectionPeriod: { _tag: 'Rolling', days: 28 },
    })
    assert.equal(assessPsiFieldData(field)._tag, 'Unavailable')
  })

  it('does not fill partial URL field measurements with another origin population', () => {
    const field = parsePsiFieldData({
      loadingExperience: loadingExperience({ INTERACTION_TO_NEXT_PAINT: INP_GOOD }),
      originLoadingExperience: loadingExperience({ LARGEST_CONTENTFUL_PAINT_MS: { percentile: 1000 } }),
    }, 'https://example.com/article', 'mobile')
    assert.equal(field?.source.scope, 'url')
    assert.equal(field?.lcp, null)
    assert.equal(assessPsiFieldData(field)._tag, 'Unavailable')
  })

  it('keeps the assessment unavailable when no eligible field measurements exist', () => {
    assert.equal(assessPsiFieldData(null)._tag, 'Unavailable')
  })
})

describe('getRating', () => {
  it('places values against the web.dev boundaries', () => {
    assert.equal(getRating(200, 'inp'), 'good')
    assert.equal(getRating(201, 'inp'), 'needs-improvement')
    assert.equal(getRating(501, 'inp'), 'poor')
    assert.equal(getRating(0.1, 'cls'), 'good')
    assert.equal(getRating(0.26, 'cls'), 'poor')
  })
})

describe('formatMetricValue', () => {
  it('formats by metric shape', () => {
    assert.equal(formatMetricValue(0.0512, 'cls'), '0.051')
    assert.equal(formatMetricValue(2600, 'lcp'), '2.6 s')
    assert.equal(formatMetricValue(180, 'inp'), '180 ms')
  })
})
