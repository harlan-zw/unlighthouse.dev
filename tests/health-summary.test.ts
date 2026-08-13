/* eslint-disable test/no-import-node-test */
import type { HealthMetrics, ToolBreakdown, ToolWindow } from '../server/utils/health.ts'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { summarizeHealth } from '../server/utils/health.ts'

function toolWindow(overrides: Partial<ToolWindow> = {}): ToolWindow {
  return { lookups: 0, statused: 0, errors: 0, slow: 0, avgDurationMs: null, maxDurationMs: null, ...overrides }
}

function metrics(overrides: {
  feedback?: Partial<HealthMetrics['feedback']>
  last24h?: Partial<ToolWindow>
  prior6d?: Partial<ToolWindow>
  byTool?: ToolBreakdown[]
} = {}): HealthMetrics {
  return {
    feedback: {
      last24h: { total: 0, up: 0, down: 0, comments: 0 },
      last7d: { total: 0, up: 0, down: 0, comments: 0 },
      lastAt: null,
      ...overrides.feedback,
    },
    tools: {
      last24h: toolWindow(overrides.last24h),
      prior6d: toolWindow(overrides.prior6d),
      byTool: overrides.byTool ?? [],
    },
  }
}

function summarize(value: HealthMetrics) {
  return summarizeHealth({ database: { _tag: 'ok', value } })
}

describe('summarizeHealth', () => {
  it('is green with no feedback and no tool errors', () => {
    const summary = summarize(metrics({ last24h: { lookups: 40, statused: 30 }, prior6d: { lookups: 240 } }))
    assert.equal(summary.status, 'GREEN')
    assert.deepEqual(summary.reasons, [])
  })

  it('reports a database probe failure as red', () => {
    const summary = summarizeHealth({ database: { _tag: 'error', message: 'D1_ERROR' } })
    assert.equal(summary.status, 'RED')
    assert.deepEqual(summary.reasons, ['Database probe failed: D1_ERROR'])
  })

  it('turns amber when a user leaves a comment', () => {
    const summary = summarize(metrics({ feedback: { last24h: { total: 1, up: 0, down: 0, comments: 1 } } }))
    assert.equal(summary.status, 'AMBER')
    assert.deepEqual(summary.reasons, ['1 feedback comment awaiting a reply (last 24h)'])
  })

  it('turns amber on a thumbs-down vote', () => {
    const summary = summarize(metrics({ feedback: { last24h: { total: 2, up: 1, down: 1, comments: 0 } } }))
    assert.equal(summary.status, 'AMBER')
    assert.deepEqual(summary.reasons, ['1 thumbs-down vote awaiting triage (last 24h)'])
  })

  it('ignores a rate built from too few recorded runs', () => {
    const summary = summarize(metrics({ last24h: { lookups: 9, statused: 9, errors: 9 } }))
    assert.equal(summary.status, 'GREEN')
  })

  it('turns amber above a quarter error rate and red above half', () => {
    const amber = summarize(metrics({ last24h: { lookups: 20, statused: 20, errors: 6 } }))
    assert.equal(amber.status, 'AMBER')
    assert.deepEqual(amber.reasons, ['Tool error rate is 30% over 20 recorded runs'])

    const red = summarize(metrics({ last24h: { lookups: 20, statused: 20, errors: 12 } }))
    assert.equal(red.status, 'RED')
  })

  it('convicts a single tool that fails every recorded run', () => {
    const summary = summarize(metrics({
      last24h: { lookups: 30, statused: 25, errors: 5 },
      byTool: [
        { tool: 'pagespeed-insights', lookups: 20, statused: 20, errors: 0 },
        { tool: 'cwv-history', lookups: 6, statused: 5, errors: 5 },
      ],
    }))
    assert.equal(summary.status, 'RED')
    assert.deepEqual(summary.reasons, ['Tool cwv-history failed all 5 recorded runs in the last 24h'])
  })

  it('leaves a low-sample tool failure alone', () => {
    const summary = summarize(metrics({
      last24h: { lookups: 8, statused: 4, errors: 4 },
      byTool: [{ tool: 'cwv-history', lookups: 4, statused: 4, errors: 4 }],
    }))
    assert.equal(summary.status, 'GREEN')
  })

  it('flags a traffic collapse against the six-day baseline', () => {
    const summary = summarize(metrics({ last24h: { lookups: 4 }, prior6d: { lookups: 600 } }))
    assert.equal(summary.status, 'AMBER')
    assert.deepEqual(summary.reasons, ['Tool traffic fell to 4 lookups against a 100/day baseline'])
  })

  it('does not call a quiet day an outage without a baseline', () => {
    const summary = summarize(metrics({ last24h: { lookups: 0 }, prior6d: { lookups: 60 } }))
    assert.equal(summary.status, 'GREEN')
  })

  it('orders red reasons before amber reasons', () => {
    const summary = summarize(metrics({
      feedback: { last24h: { total: 1, up: 0, down: 1, comments: 0 } },
      last24h: { lookups: 20, statused: 20, errors: 20 },
      byTool: [{ tool: 'lcp', lookups: 20, statused: 20, errors: 20 }],
    }))
    assert.equal(summary.status, 'RED')
    assert.equal(summary.reasons[0], 'Tool error rate is 100% over 20 recorded runs')
    assert.equal(summary.reasons.at(-1), '1 thumbs-down vote awaiting triage (last 24h)')
  })

  it('warns on slow lookups without changing the verdict', () => {
    const summary = summarize(metrics({ last24h: { lookups: 20, statused: 20, slow: 2, maxDurationMs: 24000 } }))
    assert.equal(summary.status, 'GREEN')
    assert.deepEqual(summary.warnings, ['2 lookups took over 10s, slowest 24000ms'])
  })

  it('warns when a week of feedback is mostly negative', () => {
    const summary = summarize(metrics({
      feedback: { last7d: { total: 6, up: 2, down: 4, comments: 0 } },
    }))
    assert.deepEqual(summary.warnings, ['7-day feedback is 67% negative across 6 votes'])
  })
})
