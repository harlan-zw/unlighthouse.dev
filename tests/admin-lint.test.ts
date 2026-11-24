import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import test from 'node:test'
import { ESLint } from 'eslint'

test('admin page passes the installed lint rules', async () => {
  const root = resolve(import.meta.dirname, '..')
  const eslint = new ESLint({ cwd: root })
  const results = await eslint.lintFiles(['layers/admin/app/pages/admin/index.vue'])
  const errors = results.flatMap(result => result.messages.filter(message => message.severity === 2))
  assert.deepEqual(errors, [])
})
