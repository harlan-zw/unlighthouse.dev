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
  // These conclusions are the gate deciding not to give a verdict, such as the
  // deploy workflow skipping a PR-triggered run. They are ignored rather than
  // read as green. Any other completed conclusion, including `timed_out` and
  // `startup_failure`, carries a deploy verdict, so an unknown conclusion
  // keeps the louder reading and counts as a failure.
  const ignorableConclusions = new Set(['skipped', 'cancelled', 'neutral', 'action_required', 'stale'])
  const substantive = runs.filter(run => run.status === 'completed' && !ignorableConclusions.has(run.conclusion))
  const latest = substantive[0] ?? null
  if (!latest)
    return { _tag: 'missing' }
  if (latest.conclusion === 'success')
    return { _tag: 'success' }

  let consecutiveFailures = 0
  for (const run of substantive) {
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
