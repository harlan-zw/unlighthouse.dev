#!/usr/bin/env node

/**
 * Read-only evidence collector for the daily check-in.
 *
 * Every probe is independent and records its own error, because a failed probe
 * is a finding rather than a reason to abandon the run. Missing data is never
 * health: the report has to say which probe went dark.
 *
 * Usage: node scripts/tools/daily-checkin-data.mjs [--save]
 */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseSentryIssuesResponse, parseWorkflowName, summarizeWorkflowRuns } from './checkin-observability.mjs'
import { runReadOnlyProcess } from './read-only-process.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
// The scheduled agent runs in a disposable worktree, so its archive lives
// outside the checkout. DAILY_CHECKIN_DIR names that home; unset means the
// repository directory, which the desktop uses.
const checkinDir = process.env.DAILY_CHECKIN_DIR ? resolve(process.env.DAILY_CHECKIN_DIR) : join(root, 'docs/ops/checkins')
const statePath = join(checkinDir, 'state.json')
const save = process.argv.includes('--save')
const now = new Date()
const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : null
const since = new Date(state?.lastRunAt || now.getTime() - 24 * 60 * 60 * 1000)
const sinceIso = since.toISOString()
const sinceSec = Math.floor(since.getTime() / 1000)
const nowSec = Math.floor(now.getTime() / 1000)
const wrangler = join(root, 'node_modules/.bin/wrangler')
const workerName = 'unlighthouse-dev'
const accountId = '5904138d55ca25d5670dca6adf99894e'
const siteOrigin = 'https://unlighthouse.dev'

function run(command, args) {
  return runReadOnlyProcess(spawnSync, command, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, NO_COLOR: '1' },
  })
}

function probe(load) {
  try {
    return load()
  }
  catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

async function probeAsync(load) {
  return await load().catch(error => ({ error: error instanceof Error ? error.message : String(error) }))
}

function commandJson(command, args) {
  return JSON.parse(run(command, args))
}

function d1Query(sql) {
  const output = commandJson(wrangler, ['d1', 'execute', 'DB', '--remote', '--json', '--command', sql, '--config', join(root, 'wrangler.local.toml')])
  const statement = output[0]
  if (!statement?.success)
    throw new Error('D1 query did not succeed')
  return statement.results ?? []
}

const git = probe(() => {
  const commits = run('git', ['log', `--since=${sinceIso}`, '--pretty=format:%H%x09%aI%x09%s'])
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [sha, authoredAt, ...subject] = line.split('\t')
      return { sha, authoredAt, subject: subject.join('\t') }
    })
  return {
    branch: run('git', ['branch', '--show-current']),
    head: run('git', ['rev-parse', 'HEAD']),
    dirtyFiles: run('git', ['status', '--short']).split('\n').filter(Boolean),
    commitsSinceLastRun: commits,
  }
})

const deploy = probe(() => {
  const deployments = commandJson(wrangler, ['deployments', 'list', '--json', '--config', join(root, 'wrangler.local.toml')])
  const latest = [...deployments].sort((a, b) => String(b.created_on).localeCompare(String(a.created_on)))[0] ?? null
  return {
    latest: latest && {
      id: latest.id,
      createdOn: latest.created_on,
      versionId: latest.versions?.find(version => version.percentage === 100)?.version_id ?? latest.versions?.[0]?.version_id ?? null,
      message: latest.annotations?.['workers/message'] ?? null,
      approxDeployedSha: latest.created_on ? run('git', ['rev-list', '-1', `--before=${latest.created_on}`, 'HEAD']) || null : null,
    },
  }
})

const runFields = 'databaseId,workflowName,displayTitle,headSha,status,conclusion,createdAt,updatedAt,url'

const ci = probe(() => {
  const workflowDir = join(root, '.github/workflows')
  const definedWorkflows = readdirSync(workflowDir)
    .filter(file => /\.ya?ml$/.test(file))
    .map(file => parseWorkflowName(readFileSync(join(workflowDir, file), 'utf8')))
    .filter(Boolean)
    .sort()
  // A low-cadence workflow falls outside a flat recent-runs page, and an absent
  // row reads as `missing`, so each workflow is paged on its own name.
  const perWorkflowRows = definedWorkflows.flatMap(name =>
    commandJson('gh', ['run', 'list', '--workflow', name, '--limit', '10', '--json', runFields]),
  )
  return {
    workflows: summarizeWorkflowRuns(perWorkflowRows, definedWorkflows),
    recent: commandJson('gh', ['run', 'list', '--limit', '10', '--json', runFields]),
  }
})

// Loop 1 covers the shapes that fail independently: the marketing home, the
// tools index, a docs page rendered from remote content, and a glossary page.
// Removing a probe silently reads as a passing probe, so any change belongs here
// in writing.
const http = await probeAsync(async () => {
  const entries = await Promise.all([
    `${siteOrigin}/`,
    `${siteOrigin}/tools`,
    `${siteOrigin}/integrations/cli`,
    `${siteOrigin}/glossary/lcp`,
  ].map(async (url) => {
    const hit = async () => await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15_000) })
      .then(response => response.status)
      .catch((error) => {
        console.warn(`[http] ${url} ${error instanceof Error ? error.message : String(error)}`)
        return null
      })
    const firstAttempt = await hit()
    if (firstAttempt === 200)
      return [url, 200]
    const status = await hit()
    return [url, status === firstAttempt ? status : { status, firstAttempt }]
  }))
  return Object.fromEntries(entries)
})

// The deployed verdict, computed by the same rules the site serves to any
// monitor. Reading it here proves the endpoint itself still works.
const health = await probeAsync(async () => {
  const response = await fetch(`${siteOrigin}/api/health`, { signal: AbortSignal.timeout(20_000) })
  if (!response.ok)
    throw new Error(`/api/health returned HTTP ${response.status}`)
  // A body that will not parse is the same finding as a body with no verdict:
  // production is not serving the health payload this branch defines.
  const body = await response.json().catch(error => ({ parseError: error instanceof Error ? error.message : String(error) }))
  if (!body || typeof body.status !== 'string') {
    const detail = body?.parseError ? ` Body did not parse: ${body.parseError}.` : ''
    throw new Error(`/api/health returned HTTP ${response.status} without a health payload.${detail} Production may be older than the endpoint in this branch.`)
  }
  return body
})

const d1 = probe(() => {
  const tables = new Set(d1Query(`SELECT name FROM sqlite_master WHERE type = 'table'`).map(row => row.name))
  const has = table => tables.has(table)
  if (!has('feedback') || !has('tool_lookups'))
    throw new Error(`Expected tables are missing: ${['feedback', 'tool_lookups'].filter(table => !has(table)).join(', ')}`)

  const day = nowSec - 24 * 60 * 60
  const week = nowSec - 7 * 24 * 60 * 60
  const month = nowSec - 30 * 24 * 60 * 60

  return {
    tables: [...tables],
    // Every feedback row since the last run, in full. This is the work list the
    // check-in exists to produce, so it is never summarised away.
    feedbackSinceLastRun: d1Query(`SELECT id, path, thumb, comment, created_at, user_id IS NOT NULL AS has_user, substr(COALESCE(metadata, ''), 1, 400) metadata FROM feedback WHERE created_at >= ${sinceSec} ORDER BY created_at DESC LIMIT 50`),
    feedbackOpenComments: d1Query(`SELECT id, path, comment, created_at FROM feedback WHERE comment IS NOT NULL AND comment != '' ORDER BY created_at DESC LIMIT 20`),
    feedbackTotals: d1Query(`SELECT
      COUNT(*) total,
      COALESCE(SUM(created_at >= ${day}), 0) total_24h,
      COALESCE(SUM(created_at >= ${day} AND thumb = 'up'), 0) up_24h,
      COALESCE(SUM(created_at >= ${day} AND thumb = 'down'), 0) down_24h,
      COALESCE(SUM(created_at >= ${day} AND comment IS NOT NULL AND comment != ''), 0) comments_24h,
      COALESCE(SUM(created_at >= ${week} AND thumb = 'up'), 0) up_7d,
      COALESCE(SUM(created_at >= ${week} AND thumb = 'down'), 0) down_7d,
      MAX(created_at) last_at
      FROM feedback`)[0],
    feedbackByPath: d1Query(`SELECT path, COUNT(*) n, COALESCE(SUM(thumb = 'down'), 0) down, COALESCE(SUM(comment IS NOT NULL AND comment != ''), 0) comments FROM feedback WHERE created_at >= ${month} GROUP BY path ORDER BY down DESC, n DESC LIMIT 15`),
    // `status` is null for rows written by a page load, so every rate is taken
    // over rows that recorded an outcome.
    tools24h: d1Query(`SELECT COUNT(*) lookups, COALESCE(SUM(status IS NOT NULL), 0) statused, COALESCE(SUM(status = 'error'), 0) errors, AVG(duration_ms) avg_ms, MAX(duration_ms) max_ms, COALESCE(SUM(duration_ms > 10000), 0) slow FROM tool_lookups WHERE created_at >= ${day}`)[0],
    toolsPrior6d: d1Query(`SELECT COUNT(*) lookups, COALESCE(SUM(status IS NOT NULL), 0) statused, COALESCE(SUM(status = 'error'), 0) errors FROM tool_lookups WHERE created_at >= ${week} AND created_at < ${day}`)[0],
    toolsByTool24h: d1Query(`SELECT tool, COUNT(*) lookups, COALESCE(SUM(status IS NOT NULL), 0) statused, COALESCE(SUM(status = 'error'), 0) errors FROM tool_lookups WHERE created_at >= ${day} GROUP BY tool ORDER BY lookups DESC`),
    toolErrorFingerprints: d1Query(`SELECT tool, COALESCE(error_code, 'none') error_code, COUNT(*) count, MIN(created_at) first_at, MAX(created_at) last_at FROM tool_lookups WHERE status = 'error' AND created_at >= ${week} GROUP BY tool, error_code ORDER BY count DESC LIMIT 15`),
    // A query repeated by many sessions is a product signal, not an error, and
    // is the cheapest read on what people came here to do.
    topQueries24h: d1Query(`SELECT tool, query, COUNT(*) n, COUNT(DISTINCT session_id) sessions FROM tool_lookups WHERE created_at >= ${day} AND query != '' GROUP BY tool, query ORDER BY n DESC LIMIT 10`),
    sessions24h: d1Query(`SELECT COUNT(DISTINCT session_id) sessions FROM tool_lookups WHERE created_at >= ${day} AND session_id IS NOT NULL`)[0],
    users: has('users') ? d1Query(`SELECT COUNT(*) total, COALESCE(SUM(created_at >= ${day}), 0) new_24h FROM users`)[0] : null,
  }
})

function cloudflareToken() {
  const environmentToken = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN
  if (environmentToken)
    return environmentToken
  const auth = commandJson(wrangler, ['auth', 'token', '--json'])
  if (!auth.token)
    throw new Error('Cloudflare token unavailable')
  return auth.token
}

const workers = await probeAsync(async () => {
  const query = `query { viewer { accounts(filter: {accountTag: "${accountId}"}) { workersInvocationsAdaptive(limit: 100, filter: {datetime_geq: "${sinceIso}", datetime_leq: "${now.toISOString()}"}) { dimensions { scriptName status } sum { requests errors } quantiles { cpuTimeP99 } } } } }`
  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${cloudflareToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const body = await response.json()
  if (!response.ok || body.errors?.length)
    throw new Error(`Cloudflare GraphQL ${response.status}: ${JSON.stringify(body.errors ?? body).slice(0, 300)}`)
  const rows = (body.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive ?? [])
    .filter(row => row.dimensions.scriptName === workerName)
  const outcomes = {}
  let errors = 0
  for (const row of rows) {
    outcomes[row.dimensions.status] = (outcomes[row.dimensions.status] ?? 0) + row.sum.requests
    errors += row.sum.errors ?? 0
  }
  return {
    outcomes,
    errors,
    nonOk: Object.entries(outcomes)
      .filter(([status]) => !['success', 'clientDisconnected', 'responseStreamDisconnected'].includes(status))
      .map(([status, requests]) => ({ status, requests })),
  }
})

// Token sources in descending order of read scope. `.env.sentry-build-plugin`
// carries source-map upload scope only and 403s on the issues API, so it is the
// last resort rather than the first.
function sentryToken() {
  if (process.env.SENTRY_AUTH_TOKEN)
    return { token: process.env.SENTRY_AUTH_TOKEN, source: 'SENTRY_AUTH_TOKEN env' }

  const rcPath = join(homedir(), '.sentryclirc')
  if (existsSync(rcPath)) {
    const rcToken = readFileSync(rcPath, 'utf8').match(/^token\s*=\s*(\S+)/m)?.[1]
    if (rcToken)
      return { token: rcToken, source: '~/.sentryclirc' }
  }

  const buildPluginPath = join(root, '.env.sentry-build-plugin')
  if (existsSync(buildPluginPath)) {
    const buildToken = readFileSync(buildPluginPath, 'utf8').match(/^SENTRY_AUTH_TOKEN=(\S+)/m)?.[1]
    if (buildToken)
      return { token: buildToken, source: '.env.sentry-build-plugin' }
  }

  return null
}

const SENTRY_ISSUE_LIMIT = 25

const sentry = await (async () => {
  const resolved = sentryToken()
  if (!resolved) {
    return {
      _tag: 'missing_observability',
      status: null,
      diagnostic: 'No Sentry token found in SENTRY_AUTH_TOKEN, ~/.sentryclirc, or .env.sentry-build-plugin.',
    }
  }
  const { token, source: tokenSource } = resolved
  // `lastSeen` catches an issue that fired again on an id already known.
  // `firstSeen` could only ever report births, which hides a fix that did not hold.
  const query = encodeURIComponent(`project:unlighthouse is:unresolved lastSeen:>${sinceIso.slice(0, 19)}`)
  const response = await fetch(`https://sentry.io/api/0/organizations/harlan-zw/issues/?query=${query}&sort=freq&limit=${SENTRY_ISSUE_LIMIT}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(error => ({ networkError: error instanceof Error ? error.message : String(error) }))
  if ('networkError' in response)
    return { _tag: 'provider_failure', status: null, diagnostic: `Sentry issues request failed: ${response.networkError}` }

  const issues = await response.json().catch(error => ({ parseError: error instanceof Error ? error.message : String(error) }))
  if (issues?.parseError)
    return { _tag: 'parse_failure', status: response.status, diagnostic: `Sentry issues response was not JSON: ${issues.parseError}` }

  return parseSentryIssuesResponse(response.status, issues, tokenSource, sinceIso, SENTRY_ISSUE_LIMIT)
})().catch(error => ({
  _tag: 'provider_failure',
  status: null,
  diagnostic: error instanceof Error ? error.message : String(error),
}))

const doc = { generatedAt: now.toISOString(), since: sinceIso, git, deploy, ci, http, health, d1, workers, sentry }

console.log(JSON.stringify(doc, null, 2))

const failedProbes = Object.entries({ git, deploy, ci, http, health, d1, workers, sentry })
  .filter(([name, value]) => value?.error || (name === 'sentry' && value?._tag !== 'available'))
if (failedProbes.length)
  console.error(`WARN ${failedProbes.length} probes failed: ${failedProbes.map(([name]) => name).join(', ')}. Missing data is not health.`)

if (save) {
  mkdirSync(checkinDir, { recursive: true })
  const archivePath = join(checkinDir, `${now.toISOString().slice(0, 10)}.json`)
  if (existsSync(archivePath)) {
    const time = now.toISOString().slice(11, 16).replace(':', '')
    const rerunPath = archivePath.replace(/\.json$/, `.rerun-${time}.json`)
    writeFileSync(rerunPath, `${JSON.stringify(doc, null, 2)}\n`)
    console.error(`Same-day rerun wrote ${rerunPath}. The morning baseline and state were not changed.`)
  }
  else {
    writeFileSync(archivePath, `${JSON.stringify(doc, null, 2)}\n`)
    // The window must not advance past feedback nobody read, so a failed D1
    // probe leaves the next run covering the same period.
    if (!d1.error)
      writeFileSync(statePath, `${JSON.stringify({ lastRunAt: now.toISOString() }, null, 2)}\n`)
    else
      console.error('State was not advanced because the D1 probe failed.')
    console.error(`Wrote ${archivePath}`)
  }
}
