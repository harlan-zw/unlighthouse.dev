/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { it } from 'node:test'
import { evaluateHealthCheck } from '../server/utils/health-check.ts'

it('missing database evidence cannot become a successful check', () => {
  assert.deepEqual(evaluateHealthCheck({ status: 'RED', reasons: ['Database probe failed: D1 connection reset'], warnings: [], metrics: null }), {
    _tag: 'Unavailable',
    reason: 'Database probe failed: D1 connection reset',
  })
})

it('missing database evidence falls back to a generic reason when no probe errors exist', () => {
  assert.deepEqual(evaluateHealthCheck({ status: 'RED', reasons: [], warnings: [], metrics: null }), {
    _tag: 'Unavailable',
    reason: 'Database health evidence is unavailable.',
  })
})

for (const [status, tag] of [['GREEN', 'Pass'], ['AMBER', 'Warn'], ['RED', 'Fail']] as const) {
  it(`preserves the existing ${status} decision`, () => {
    const result = evaluateHealthCheck({ status, reasons: ['Existing policy'], warnings: [], metrics: {} })
    assert.equal(result._tag, tag)
    assert.deepEqual('evidence' in result && result.evidence, { status, reasons: ['Existing policy'], warnings: [], metrics: {} })
  })
}
