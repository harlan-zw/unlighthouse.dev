/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { createRunGate } from '../shared/run-gate.ts'

test('a current run accepts its own resolution', () => {
  const gate = createRunGate()
  const run = gate.begin()

  assert.ok(gate.isCurrent(run))
})

test('a resolution from a superseded run is rejected', () => {
  const gate = createRunGate()
  const first = gate.begin()
  gate.begin()

  assert.ok(!gate.isCurrent(first))
})

test('the newest run stays current across several rejections', () => {
  const gate = createRunGate()
  gate.begin()
  gate.begin()
  const third = gate.begin()

  assert.ok(gate.isCurrent(third))
})
