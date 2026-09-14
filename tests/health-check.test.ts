/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { it } from 'node:test'
import { evaluateHealthCheck } from '../server/utils/health-check.ts'

it('missing database evidence cannot become a successful check', () => {
  assert.deepEqual(evaluateHealthCheck({ status: 'RED', reasons: ['Missing database'], warnings: [], metrics: null }), {
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
