# Production triage ledger

Persistent fingerprints found by the daily check-in. Add a row only after evidence appears in an archived report.

This file is committed to a public repository. Never paste user feedback text here; reference the check-in date instead.

| Fingerprint | Surface | Verdict | First seen | Last count | Evidence and next condition |
| --- | --- | --- | --- | ---: | --- |
| `scriptThrewException` with no matching [Sentry](https://sentry.io) issue | Worker `unlighthouse-dev` | watch | 2026-08-13 | 152 requests / 24h | [Cloudflare](https://cloudflare.com) invocation analytics recorded 152 thrown exceptions against 2,573 successes in the 24h to 2026-08-13T08:30Z, while the Sentry query for unresolved issues seen in the same window returned none. Either the throwing path runs before the Sentry Nitro plugin, or those issues are marked resolved and recurring outside the query. Exit condition: one check-in that either attributes the exceptions to a named Sentry issue or shows the count at zero. |
