# Shared check-in adoption

This draft targets Nuxt Check-in 0.2.0-alpha.0, Cloudflare 0.4.1, and Sentry 0.1.5.
Publication is pending npm browser approval.
The committed dependency remains 0.1.0 until the prerelease can be installed.
This draft cannot run the new CLI with its committed dependencies yet.

The public health route returns a versioned CheckReport with aggregate evidence.
The existing health evaluator still controls traffic, tool outcomes, latency, and feedback thresholds.
The external collector validates report freshness and the deployed Worker version.
Missing Worker metadata produces unavailable identity evidence.
Sentry stays external and uses the public collector for the retained unresolved backlog.
No Sentry administration token is required in the Worker.

The Worker now declares CF_VERSION_METADATA through its generated Wrangler configuration.
Deploy the generated configuration so the health report can identify the current Worker version.

Before enabling the daily collector, deploy the Worker.
Verify /api/health against the active deployment and check the report coverage.
There is no system-health email sender in this site.

The existing 08:00 daily routine replaces the separate 07:00 Sentry routine.
The daily skill retains Sentry triage and reads shared severity and coverage.

## Registered external checks

Run `pnpm checkin` to prepare the registry, run checks, and save the report.
Use `pnpm exec nuxt-checkin` for a prepared registry without saving.
`checks/external` holds site checks. The package supplies the CLI.

Checks cover Git, CI, deployment, four public pages, the health report, activity, Worker outcomes, and Sentry.
The activity check retains feedback rows, tool outcomes, error groups, queries, sessions, and user counts.
CI failures and Worker errors produce explicit results. Missing evidence cannot pass.
The Worker query filters the site before applying the provider row limit.
[Cloudflare documents this filter](https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-workers-metrics/).

`DAILY_CHECKIN_DIR` overrides `docs/ops/checkins`.
The CLI writes private report files and preserves the first successful daily baseline.
Only complete passing reports advance `state.json`.
Use `--since ISO` with the shared command to select an explicit recovery window.
Legacy scripts and their synchronous process runner are removed.
