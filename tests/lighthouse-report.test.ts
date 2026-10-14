/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { getAuditSavings, parseLighthouseReport } from '../layers/tools/app/utils/lighthouse.ts'

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

test('keeps fetchTime null when the report has no timestamp', () => {
  const result = parseLighthouseReport(JSON.stringify({
    lighthouseVersion: '12',
    categories: { seo: { id: 'seo', title: 'SEO', score: 0.9, auditRefs: [] } },
  }))

  assert.equal(result._tag, 'Ok')
  assert.equal(result._tag === 'Ok' && result.report.fetchTime, null)
})

test('reads a report whose category auditRefs are missing', () => {
  const result = parseLighthouseReport(lighthouseReport({
    categories: { performance: { id: 'performance', title: 'Performance', score: 0.5 } },
  }))

  assert.equal(result._tag, 'Ok')
  assert.equal(result._tag === 'Ok' && result.report.opportunities.length, 0)
})

test('keeps native audit states out of passed checks and separates modern insights', () => {
  const modes = [
    ['passed', 'numeric', 0.95, 'diagnostics'],
    ['insight', 'metricSavings', 0, 'insights'],
    ['irrelevant', 'notApplicable', null, 'diagnostics'],
    ['human', 'manual', null, 'diagnostics'],
    ['information', 'informative', null, 'diagnostics'],
    ['broken', 'error', null, 'insights'],
  ] as const
  const result = parseLighthouseReport(lighthouseReport({
    lighthouseVersion: '13.5.0',
    categories: { performance: { auditRefs: modes.map(([id, , , group]) => ({ id, group })) } },
    audits: Object.fromEntries(modes.map(([id, scoreDisplayMode, score]) => [id, {
      id,
      title: id,
      scoreDisplayMode,
      score,
    }])),
  }))
  assert.equal(result._tag, 'Ok')
  if (result._tag !== 'Ok')
    return
  assert.deepEqual(result.report.passedAudits.map(audit => audit.id), ['passed'])
  assert.deepEqual(result.report.insights.map(audit => audit.id), ['insight'])
  assert.deepEqual(result.report.notApplicableAudits.map(audit => audit.id), ['irrelevant'])
  assert.deepEqual(result.report.manualAudits.map(audit => audit.id), ['human'])
  assert.deepEqual(result.report.informativeAudits.map(audit => audit.id), ['information'])
  assert.deepEqual(result.report.errorAudits.map(audit => audit.id), ['broken'])
})

test('does not mark Total Blocking Time as a Core Web Vital', () => {
  const result = parseLighthouseReport(lighthouseReport({ audits: {
    'total-blocking-time': { id: 'total-blocking-time', title: 'Total Blocking Time', numericValue: 100, score: 0.95 },
  } }))
  assert.equal(result._tag, 'Ok')
  if (result._tag !== 'Ok')
    return
  assert.equal(result.report.performanceMetrics[0]?.isCoreWebVital, false)
})

test('includes non-performance category checks when a report has no Performance category', () => {
  const result = parseLighthouseReport(lighthouseReport({
    categories: { accessibility: { auditRefs: [{ id: 'contrast' }] } },
    audits: { contrast: { id: 'contrast', title: 'Color contrast', score: 0, scoreDisplayMode: 'binary' } },
  }))
  assert.equal(result._tag, 'Ok')
  if (result._tag !== 'Ok')
    return
  assert.deepEqual(result.report.diagnostics.map(audit => audit.id), ['contrast'])
})

test('keeps CLS savings unitless and time savings in milliseconds', () => {
  assert.deepEqual(getAuditSavings({
    id: 'layout-shift-insight',
    title: 'Layout shifts',
    score: 0,
    scoreDisplayMode: 'metricSavings',
    metricSavings: { CLS: 0.03, LCP: 350, FCP: 0 },
  }), [
    { metric: 'CLS', value: 0.03, unit: 'unitless' },
    { metric: 'LCP', value: 350, unit: 'ms' },
  ])
})

test('retains Agentic Browsing and its native fraction excluding manual, irrelevant, informative and hidden audits', () => {
  const modes = [
    ['passed', 'binary', 1, undefined],
    ['failed', 'binary', 0, undefined],
    ['human', 'manual', null, undefined],
    ['irrelevant', 'notApplicable', null, undefined],
    ['information', 'informative', null, undefined],
    ['hidden', 'binary', 1, 'hidden'],
  ] as const
  const result = parseLighthouseReport(lighthouseReport({
    categories: {
      'agentic-browsing': {
        id: 'agentic-browsing',
        title: 'Agentic Browsing',
        score: 0.5,
        categoryScoreDisplayMode: 'fraction',
        auditRefs: modes.map(([id, , , group]) => ({ id, group, weight: 1 })),
      },
    },
    audits: Object.fromEntries(modes.map(([id, scoreDisplayMode, score]) => [id, { id, title: id, scoreDisplayMode, score }])),
  }))
  assert.equal(result._tag, 'Ok')
  if (result._tag !== 'Ok')
    return
  assert.equal(result.report.categories.agenticBrowsing?.title, 'Agentic Browsing')
  assert.deepEqual(result.report.categoryScores['agentic-browsing'], { _tag: 'Fraction', numPassed: 1, numPassableAudits: 2, score: 0.5 })
})

test('does not call a future explicit mode or a missing-mode error passed', () => {
  const result = parseLighthouseReport(lighthouseReport({
    categories: { performance: { auditRefs: [{ id: 'future' }, { id: 'error' }, { id: 'historical' }] } },
    audits: {
      future: { id: 'future', title: 'Future result', score: 1, scoreDisplayMode: 'future' },
      error: { id: 'error', title: 'Audit error', score: 1, errorMessage: 'Audit could not run' },
      historical: { id: 'historical', title: 'Historical scored check', score: 1 },
    },
  }))
  assert.equal(result._tag, 'Ok')
  if (result._tag !== 'Ok')
    return
  assert.deepEqual(result.report.passedAudits.map(audit => audit.id), ['historical'])
  assert.deepEqual(result.report.informativeAudits.map(audit => audit.id), ['future'])
  assert.equal(result.report.errorAudits[0]?.errorMessage, 'Audit could not run')
})
