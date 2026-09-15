/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { it } from 'node:test'
import { runExternalChecks } from '@harlan-zw/nuxt-checkin/external'
import deployment from '../checks/external/deployment.mjs'

function git(root: string, ...args: string[]) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
}

function commit(root: string, message: string, date: string) {
  git(root, 'add', '-A')
  execFileSync('git', ['commit', '--allow-empty', '-m', message], {
    cwd: root,
    env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
  })
}

function fakeWrangler(root: string, createdOn: string | null = '2026-09-15T08:25:57Z') {
  const binDir = join(root, 'node_modules/.bin')
  mkdirSync(binDir, { recursive: true })
  const wrangler = join(binDir, 'wrangler')
  writeFileSync(wrangler, `#!/usr/bin/env node
console.log(JSON.stringify([{
  id: 'deployment-1',
  created_on: ${JSON.stringify(createdOn)},
  versions: [{ version_id: 'version-1', percentage: 100 }],
  annotations: { 'workers/message': 'deploy' },
}]))
`)
  chmodSync(wrangler, 0o755)
}

it('derives approxDeployedSha from origin/main, not the checked-out branch', async () => {
  const root = mkdtempSync(join(tmpdir(), 'checkin-deploy-'))
  git(root, 'init', '-q', '-b', 'main')
  git(root, 'config', 'user.name', 'test')
  git(root, 'config', 'user.email', 'test@example.com')
  commit(root, 'base', '2026-09-01T00:00:00Z')
  git(root, 'switch', '-q', '-c', 'routine')
  commit(root, 'routine work', '2026-09-10T00:00:00Z')
  git(root, 'switch', '-q', 'main')
  commit(root, 'release', '2026-09-14T00:00:00Z')
  const releaseSha = git(root, 'rev-parse', 'refs/heads/main')
  git(root, 'update-ref', 'refs/remotes/origin/main', releaseSha)
  git(root, 'switch', '-q', 'routine')
  fakeWrangler(root)

  try {
    const { report } = await runExternalChecks([deployment], { required: ['site.deployment'] }, {
      rootDir: root,
      env: { ...process.env },
    })
    const result = report.results[0].result
    assert.equal(result._tag, 'Pass')
    assert.equal((result.evidence as { latest: { approxDeployedSha: string } }).latest.approxDeployedSha, releaseSha)
  }
  finally {
    rmSync(root, { recursive: true, force: true })
  }
})

it('reports a null approxDeployedSha when origin/main is missing', async () => {
  const root = mkdtempSync(join(tmpdir(), 'checkin-deploy-'))
  git(root, 'init', '-q', '-b', 'main')
  git(root, 'config', 'user.name', 'test')
  git(root, 'config', 'user.email', 'test@example.com')
  commit(root, 'base', '2026-09-01T00:00:00Z')
  fakeWrangler(root)

  try {
    const { report } = await runExternalChecks([deployment], { required: ['site.deployment'] }, {
      rootDir: root,
      env: { ...process.env },
    })
    const result = report.results[0].result
    assert.equal(result._tag, 'Pass')
    assert.equal((result.evidence as { latest: { approxDeployedSha: string | null } }).latest.approxDeployedSha, null)
  }
  finally {
    rmSync(root, { recursive: true, force: true })
  }
})

it('reports a null approxDeployedSha when created_on is missing', async () => {
  const root = mkdtempSync(join(tmpdir(), 'checkin-deploy-'))
  git(root, 'init', '-q', '-b', 'main')
  git(root, 'config', 'user.name', 'test')
  git(root, 'config', 'user.email', 'test@example.com')
  commit(root, 'release', '2026-09-14T00:00:00Z')
  const releaseSha = git(root, 'rev-parse', 'refs/heads/main')
  git(root, 'update-ref', 'refs/remotes/origin/main', releaseSha)
  fakeWrangler(root, null)

  try {
    const { report } = await runExternalChecks([deployment], { required: ['site.deployment'] }, {
      rootDir: root,
      env: { ...process.env },
    })
    const result = report.results[0].result
    assert.equal(result._tag, 'Pass')
    assert.equal((result.evidence as { latest: { approxDeployedSha: string | null } }).latest.approxDeployedSha, null)
  }
  finally {
    rmSync(root, { recursive: true, force: true })
  }
})
