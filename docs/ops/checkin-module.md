# Shared check-in adoption

This draft depends on harlan-zw/harlan-nuxt#143.
Release Nuxt Check-in and the Sentry checks export before enabling this branch.
Resolve the released integration version and regenerate the lockfile before marking the draft ready.
Local package paths and artifacts must not enter the lockfile.

The public health route returns a versioned CheckReport with aggregate evidence.
The existing health evaluator still controls traffic, tool outcomes, latency, and feedback thresholds.
The external collector validates report freshness and the deployed Worker version.
Missing Worker metadata produces unavailable identity evidence.
Sentry stays external and uses the public collector for the retained unresolved backlog.
No Sentry administration token is required in the Worker.

The Worker now declares CF_VERSION_METADATA through its generated Wrangler configuration.
Deploy the generated configuration so the health report can identify the current Worker version.

Before enabling the daily collector, resolve package versions and deploy the Worker.
Verify /api/health against the active deployment and check the report coverage.
There is no system-health email sender in this site.
