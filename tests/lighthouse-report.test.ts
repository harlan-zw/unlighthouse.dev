/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { parseLighthouseReport } from '../layers/tools/app/utils/lighthouse.ts'

function lighthouseReport(overrides: Record<string, unknown> = {}) {
  return {
    lighthouseVersion: '12.2.1',
    requestedUrl: 'https://example.com',
    finalUrl: 'https://example.com/',
    fetchTime: '2026-08-24T09:59:00.000Z',
    configSettings: { formFactor: 'mobile', throttlingMethod: 'simulate' },
    categories: {
      'performance': {
        id: 'performance',
        title: 'Performance',
        score: 0.42,
        auditRefs: [
          { id: 'largest-contentful-paint', weight: 25, group: 'metrics' },
          { id: 'render-blocking-resources', weight: 0, group: 'diagnostics' },
          { id: 'uses-long-cache-ttl', weight: 0 },
        ],
      },
      'best-practices': { id: 'best-practices', title: 'Best Practices', score: 1, auditRefs: [] },
    },
    audits: {
      'largest-contentful-paint': {
        id: 'largest-contentful-paint',
        title: 'Largest Contentful Paint',
        score: 0.1,
        scoreDisplayMode: 'numeric',
        displayValue: '9.9 s',
        numericValue: 9901,
        numericUnit: 'millisecond',
      },
      'render-blocking-resources': {
        id: 'render-blocking-resources',
        title: 'Eliminate render-blocking resources',
        score: 0.3,
        scoreDisplayMode: 'numeric',
        details: { type: 'opportunity', headings: [], items: [], overallSavingsMs: 800 },
      },
      'uses-long-cache-ttl': {
        id: 'uses-long-cache-ttl',
        title: 'Serve static assets with an efficient cache policy',
        score: 1,
        scoreDisplayMode: 'numeric',
      },
    },
    ...overrides,
  }
}

test('rejects text that is not JSON without throwing', () => {
  const result = parseLighthouseReport('not json at all')

  assert.equal(result._tag, 'Err')
  assert.equal(result._tag === 'Err' && result.reason, 'invalid-json')
})

test('rejects JSON that is not a Lighthouse report', () => {
  const result = parseLighthouseReport(JSON.stringify({ log: { entries: [] } }))

  assert.equal(result._tag, 'Err')
  assert.equal(result._tag === 'Err' && result.reason, 'invalid-report')
})

test('rejects a report with a version but no categories', () => {
  const result = parseLighthouseReport(JSON.stringify({ lighthouseVersion: '12.2.1', audits: {} }))

  assert.equal(result._tag, 'Err')
  assert.equal(result._tag === 'Err' && result.reason, 'invalid-report')
})

test('rejects a JSON array', () => {
  const result = parseLighthouseReport(JSON.stringify([{ lighthouseVersion: '12.2.1', categories: {} }]))

  assert.equal(result._tag, 'Err')
  assert.equal(result._tag === 'Err' && result.reason, 'invalid-report')
})

test('parses a report into scores a reader can act on', () => {
  const result = parseLighthouseReport(JSON.stringify(lighthouseReport()))

  assert.equal(result._tag, 'Ok')
  if (result._tag !== 'Ok')
    return

  assert.equal(result.report.version, '12.2.1')
  assert.equal(result.report.url, 'https://example.com/')
  assert.equal(result.report.device, 'mobile')
  assert.equal(result.report.categories.performance?.score, 0.42)
  assert.equal(result.report.categories.seo, null)
  assert.deepEqual(result.report.performanceMetrics.map(metric => metric.name), ['LCP'])
  assert.deepEqual(result.report.opportunities.map(audit => audit.id), ['render-blocking-resources'])
  assert.deepEqual(result.report.passedAudits.map(audit => audit.id), ['uses-long-cache-ttl'])
})

test('reads a report that carries no audits or configSettings', () => {
  const result = parseLighthouseReport(JSON.stringify({
    lighthouseVersion: '12.2.1',
    categories: { seo: { id: 'seo', title: 'SEO', score: 0.9, auditRefs: [] } },
  }))

  assert.equal(result._tag, 'Ok')
  if (result._tag !== 'Ok')
    return

  assert.equal(result.report.device, 'desktop')
  assert.equal(result.report.url, '')
  assert.deepEqual(result.report.performanceMetrics, [])
  assert.equal(result.report.categories.seo?.score, 0.9)
})

test('reads a report whose category auditRefs are missing', () => {
  const result = parseLighthouseReport(lighthouseReport({
    categories: { performance: { id: 'performance', title: 'Performance', score: 0.5 } },
  }))

  assert.equal(result._tag, 'Ok')
  assert.equal(result._tag === 'Ok' && result.report.opportunities.length, 0)
})
