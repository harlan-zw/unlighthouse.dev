/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { parseWorkflowName } from '../scripts/tools/checkin-observability.mjs'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const script = join(repoRoot, 'scripts/tools/daily-checkin-data.mjs')

function definedWorkflowNames() {
  const dir = join(repoRoot, '.github/workflows')
  return readdirSync(dir)
    .filter(file => /\.ya?ml$/.test(file))
    .map(file => parseWorkflowName(readFileSync(join(dir, file), 'utf8')))
    .filter(Boolean)
    .sort()
}

// A gh where every per-workflow listing works and the flat recent-runs
// listing is rate limited, reproducing the reported probe failure.
function writeGhShim(dir: string) {
  const gh = join(dir, 'gh')
  writeFileSync(gh, `#!/usr/bin/env bash
args=("$@")
for i in "\${!args[@]}"; do
  if [[ "\${args[$i]}" == "--workflow" ]]; then
    printf '[{"workflowName":"%s","status":"completed","conclusion":"success"}]' "\${args[$((i+1))]}"
    exit 0
  fi
done
echo "gh: HTTP 403 rate limit exceeded" >&2
exit 1
`)
  chmodSync(gh, 0o755)
}

describe('daily-checkin-data ci probe', () => {
  it('keeps per-workflow results when the flat recent-runs listing is rate limited', () => {
    const shimDir = mkdtempSync(join(tmpdir(), 'checkin-gh-shim-'))
    writeGhShim(shimDir)
    try {
      const run = spawnSync(process.execPath, [script], {
        cwd: repoRoot,
        encoding: 'utf8',
        timeout: 120_000,
        env: { ...process.env, PATH: `${shimDir}:${process.env.PATH}` },
      })
      assert.equal(run.status, 0, run.stderr)
      const doc = JSON.parse(run.stdout)
      const names = definedWorkflowNames()
      assert.ok(names.length > 0)
      assert.equal(doc.ci.error, undefined)
      assert.equal(doc.ci.workflows.length, names.length)
      for (const name of names) {
        const workflow = doc.ci.workflows.find((entry: { name: string }) => entry.name === name)
        assert.ok(workflow, `missing workflow ${name}`)
        assert.equal(workflow.state._tag, 'success')
      }
    }
    finally {
      rmSync(shimDir, { recursive: true, force: true })
    }
  })
})
