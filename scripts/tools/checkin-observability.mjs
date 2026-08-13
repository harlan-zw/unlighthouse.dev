function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null
}

function nonnegativeInteger(value) {
  if (typeof value === 'number')
    return Number.isSafeInteger(value) && value >= 0 ? value : null
  if (typeof value !== 'string' || !/^\d+$/.test(value))
    return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

/**
 * The CI gate must cover every workflow the repository defines, not a list kept
 * by hand. A hand-kept list silently drops any workflow added later.
 */
export function parseWorkflowName(source) {
  const declared = source.match(/^name:([^\n]*)$/m)?.[1]?.trim()
  if (!declared)
    return null
  return declared.replace(/^(['"])(.*)\1$/, '$2').trim() || null
}

function completedState(runs) {
  const completed = runs.filter(run => run.status === 'completed')
  const latest = completed[0] ?? null
  if (!latest)
    return { _tag: 'missing' }
  if (latest.conclusion === 'success')
    return { _tag: 'success' }

  let consecutiveFailures = 0
  for (const run of completed) {
    if (run.conclusion === 'success')
      break
    consecutiveFailures++
  }
  return { _tag: 'failure', consecutiveFailures }
}

export function summarizeWorkflowRuns(rows, requiredWorkflowNames) {
  return requiredWorkflowNames.map((name) => {
    const runs = rows.filter(row => row.workflowName === name)
    const latestRun = runs[0] ?? null
    const latestCompletedRun = runs.find(run => run.status === 'completed') ?? null
    const previousState = completedState(runs)

    if (!latestRun)
      return { name, latestRun, latestCompletedRun, state: { _tag: 'missing' } }

    if (latestRun.status !== 'completed') {
      return {
        name,
        latestRun,
        latestCompletedRun,
        state: {
          _tag: 'pending',
          consecutiveFailures: previousState._tag === 'failure' ? previousState.consecutiveFailures : 0,
          previousConclusion: latestCompletedRun?.conclusion || null,
        },
      }
    }
    return { name, latestRun, latestCompletedRun, state: previousState }
  })
}

/**
 * Split Sentry issues by whether the window created them or only saw them again.
 * A recurrence is the signal that a shipped fix did not hold, so it has to reach
 * the report on its own rather than hide behind a first-seen filter.
 */
export function parseSentryIssuesResponse(status, body, tokenSource, sinceIso, limit) {
  if (status === 401 || status === 403) {
    const origin = tokenSource ? ` Token came from ${tokenSource}.` : ''
    return {
      _tag: 'missing_observability',
      status,
      diagnostic: status === 403
        ? `Sentry token lacks issue-read permission (HTTP 403).${origin} Use a token with event:read and org:read, such as the one sentry-cli writes to ~/.sentryclirc.`
        : `Sentry authorization failed with HTTP 401 (token missing or expired).${origin}`,
    }
  }
  if (status < 200 || status >= 300)
    return { _tag: 'provider_failure', status, diagnostic: `Sentry issues request failed with HTTP ${status}.` }
  if (!Array.isArray(body))
    return { _tag: 'parse_failure', status, diagnostic: 'Sentry issues response was not an array.' }

  const windowStart = typeof sinceIso === 'string' ? Date.parse(sinceIso) : Number.NaN
  const newIssues = []
  const recurringIssues = []
  for (const candidate of body) {
    const issue = record(candidate)
    const count = nonnegativeInteger(issue?.count)
    const userCount = nonnegativeInteger(issue?.userCount)
    if (!issue
      || typeof issue.id !== 'string'
      || typeof issue.shortId !== 'string'
      || typeof issue.title !== 'string'
      || typeof issue.culprit !== 'string'
      || typeof issue.permalink !== 'string'
      || count === null
      || userCount === null
      || typeof issue.firstSeen !== 'string'
      || typeof issue.lastSeen !== 'string') {
      return { _tag: 'parse_failure', status, diagnostic: 'Sentry issues response contained an invalid issue.' }
    }
    const parsed = {
      id: issue.id,
      shortId: issue.shortId,
      title: issue.title.slice(0, 160),
      culprit: issue.culprit.slice(0, 240),
      permalink: issue.permalink,
      count,
      userCount,
      firstSeen: issue.firstSeen,
      lastSeen: issue.lastSeen,
    }
    // An unparseable window start must not reclassify everything as a
    // recurrence, so an unknown boundary keeps the louder reading.
    if (Number.isNaN(windowStart) || Date.parse(issue.firstSeen) >= windowStart)
      newIssues.push(parsed)
    else
      recurringIssues.push(parsed)
  }
  return {
    _tag: 'available',
    newIssues,
    recurringIssues,
    // A full page means Sentry had more to say. Reporting the cap keeps a
    // truncated list from reading as a complete one.
    truncatedAtLimit: typeof limit === 'number' && body.length >= limit,
  }
}
