# Shared check-in adoption

Use Nuxt Check-in 0.1.0, Cloudflare 0.4.1, and Sentry 0.1.5 from the npm registry.
The lockfile records the released packages.

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
