/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { commitMetadataBranch, docsBranch, docsVersion, switchDocsVersion } from '../utils/docs-version.ts'

test('keeps the same document when switching versions', () => {
  assert.equal(switchDocsVersion('/guide/guides/config', 'beta', ['/v1/guide/guides/config']), '/v1/guide/guides/config')
  assert.equal(switchDocsVersion('/v1/api-doc', 'stable', ['/api-doc']), '/api-doc')
})

test('uses installation when the other version has no matching document', () => {
  assert.equal(switchDocsVersion('/v1/architecture', 'stable', ['/api-doc']), '/guide/getting-started/installation')
})

test('does not treat similarly named URLs as beta docs', () => {
  assert.equal(docsVersion('/v10/example'), 'stable')
  assert.equal(docsBranch('/v1/api-doc'), 'v1')
  assert.equal(docsBranch('/guide'), '0.x')
})

test('loads commit metadata only for repository-backed documentation', () => {
  assert.equal(commitMetadataBranch('root'), '0.x')
  assert.equal(commitMetadataBranch('beta'), 'v1')
  assert.equal(commitMetadataBranch('glossary'), null)
  assert.equal(commitMetadataBranch('learnLighthouse'), null)
})
