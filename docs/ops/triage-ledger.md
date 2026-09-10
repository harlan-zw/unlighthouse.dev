# Production triage ledger

Persistent fingerprints found by the daily check-in. Add a row only after evidence appears in an archived report.

This file is committed to a public repository. Never paste user feedback text here; reference the check-in date instead.

| Fingerprint | Surface | Verdict | First seen | Last count | Evidence and next condition |
| --- | --- | --- | --- | ---: | --- |
| `scriptThrewException` with no matching [Sentry](https://sentry.io) issue | Worker `unlighthouse-dev` | watch | 2026-08-13 | 1 exception / 7,391 successes / 24h | The 2026-09-10 check-in ended the five-window zero streak: Workers recorded 1 thrown exception against 7,391 successes in the 24h to 2026-09-10T22:00Z, while Sentry showed no new or recurring issues. Release finalization and client source maps shipped 2026-09-10T13:50Z (#76, #81, #90) should improve attribution at the next occurrence. Exit condition: one check-in that either attributes the exceptions to a named Sentry issue or shows the count at zero. |
| `inp` 502 on one target URL | Worker `unlighthouse-dev` `inp` tool | watch | 2026-09-05 | 2 of 5 runs / 24h | The 2026-09-10 check-in crossed the quarter-broken threshold: 2 of 5 statused `inp` runs (40%) failed 502 on one distinct target, fingerprint count 2 → 4, latest hit 2026-09-10T14:27Z after the deploy. Hypothesis: PSI deterministically fails to measure that one URL (heavy page or bot blocking); one repeated target is a UX finding, not an outage. Both hits stayed out of Sentry, so the expected-upstream-failure tagging from #80 held. Exit condition: one check-in where the target succeeds, the errors spread across distinct targets, or a named Sentry issue attributes them. |
