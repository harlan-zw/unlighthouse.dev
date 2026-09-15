---
name: daily-checkin
description: Gather unlighthouse.dev production evidence (user feedback, tool errors, health endpoint, front door, CI, deploy, Workers, Sentry), compare it with the previous run, then write a morning verdict and action list. Use when the user says "daily checkin", "morning checkin", "what happened overnight", or asks for production status.
---

# Daily check-in

Produce one read-only morning report that answers two questions first: what did users tell us, and what changed that nobody asked for. Everything else is context.

Archive home: every `docs/ops/checkins/` path below means `$DAILY_CHECKIN_DIR` when that variable is set. The scheduled agent runs in a disposable worktree and sets it to a persistent directory, so each morning still has yesterday's JSON and `state.json` to diff against. Write the report `.md` there too.

## Workflow

1. Run `pnpm checkin` from the repo root. Keep every unavailable result visible.
   The shared CLI archives timestamped JSON in `docs/ops/checkins/`.
   Complete reports advance state, including warnings and failures. Incomplete reports preserve state. Same-day reruns preserve the first complete baseline.
   Archives are private and gitignored because they hold user feedback text.
2. Read the newest prior JSON archive and `docs/ops/triage-ledger.md`. Compare fingerprints and rates, not only totals. A missing prior key is a new probe with no baseline.
3. Feedback comes first. Use the mappings below. For every row in `d1.feedbackSinceLastRun`:
   - Quote the comment, name its `path`, and state what the user was trying to do.
   - Say whether it is a bug, a docs gap, a missing feature, or praise.
   - Propose one action. A comment with no proposed action is an unanswered user.
   - Check `d1.feedbackOpenComments` for older comments that never got an action, and carry them forward.
   - A thumbs-down with no comment is still a signal: name the path and check whether that page also appears in `d1.toolErrorFingerprints` or Sentry.
4. Then verify these gates:
   - A failed public-page check is RED. A recovered request is a note.
   - Read the `site.report` result first. Unavailable means identity, freshness, coverage, or collection failed; it cannot support GREEN.
   - Read the `site.health` result in `health.report.results`. Its evidence holds the original status, reasons, warnings, and aggregate metrics.
   - Preserve Fail as RED and Warn as AMBER. Incomplete coverage remains visible alongside either verdict.
   - Read every `ci.workflows` state. `failure` means the gate is broken. `pending` after a prior failure must be followed until complete. `missing` is an observability gap.
   - `workers.nonOk` counts Worker exceptions. Compare them with unresolved IDs in the `sentry.site` result evidence.
   - Check report coverage and the Sentry result before interpreting an empty issue list. Incomplete evidence cannot establish that reporting works.
   - Compare issue IDs with prior complete reports. Persistent unresolved issues remain findings.
   - Fetch issue detail read-only when needed to identify a culprit, recurrence, or permalink. Do not infer recurrence from counts.
   - Keep the existing Sentry triage standard: give each unresolved issue a disposition, and verify any proposed repair.
   - `deploy.latest.approxDeployedSha` against `git.head` shows unshipped work. Days of drift is a finding.
5. Detect anomalies as steps, not levels:
   - Tool error rate: `d1.tools24h` against `d1.toolsPrior6d`. A rate that held all week is a known fault; the same rate appearing overnight is the lead.
   - Traffic: `d1.tools24h.lookups` and `d1.sessions24h` against the six-day baseline. A collapse means the tools broke silently.
   - Per-tool: a tool in `d1.toolsByTool24h` erroring on a quarter or more of its recorded runs is broken, whatever the site-wide rate says. Check `d1.toolErrorFingerprints` for how many distinct targets those errors cover: many targets is an outage, one target repeated is a visitor stuck on a URL the upstream API rejects, which is a UX finding rather than an incident.
   - `status` is null for lookups written by a page load, so every rate is taken over `statused`, never over `lookups`.
   - `d1.topQueries24h` shows what people came to do. A query repeated by many sessions with errors is the highest-value fix on the page.
6. Write `docs/ops/checkins/YYYY-MM-DD.md`:
   - First line: GREEN, AMBER, or RED plus one sentence.
   - User feedback: every new comment and vote, with the proposed action. Say "no new feedback" when there is none.
   - Pulse: lookups, sessions, error rate, feedback totals, new users.
   - Overnight: deploy, CI, and version changes.
   - Broken: only new or regressed fingerprints, each with evidence and a one-line hypothesis.
   - Drift: unshipped commits, observability gaps, failed probes.
   - Proposed actions: numbered, ordered by user impact, each small enough for one focused work pass.
7. Update `docs/ops/triage-ledger.md` with genuinely new fingerprints. Use `watch` until investigated. Resolve only with evidence that a fix deployed and the signal stopped. Never paste user feedback text into the ledger; the ledger is committed and this repository is public.
8. Print only the verdict, the feedback actions, and the report path.

## Report fields

The shared report stores entries in `results`, each with `id` and `result`.
Read evidence only when the result contains it. Keep unavailable results visible.

| Name used above | Shared evidence |
| --- | --- |
| `git` | `repository.git` result evidence |
| `deploy` | `site.deployment` result evidence |
| `ci` | `repository.ci` result evidence |
| `d1` | `site.activity` result evidence |
| `workers` | `cloudflare.workers` result evidence |
| `health.report` | `site.report` result evidence `report` |
| Sentry | `sentry.site` result evidence |

Public-page checks are `site.home`, `site.tools`, `site.docs`, and `site.glossary`.
Exit 0 means complete passing checks. Exit 1 means warnings or failures. Exit 2 means incomplete coverage.

## Rules

- Keep production access read-only. Do not deploy, mutate D1, or change Sentry state.
- Every reported number must come from the archived JSON. Extra reads are allowed only to investigate a new fingerprint, and must stay read-only.
- Lead with failed probes. Missing data cannot support GREEN.
- Never quote user feedback outside `docs/ops/checkins/`, which is gitignored.
- Keep the last 30 days of paired JSON and Markdown reports. Never delete `state.json`.
