# Brief: PageSpeed Insights versus Lighthouse

State: brief reviewed. Original site Git revision: `8a8b40c004f22e27e12c5ec632bd54c58fae568b`.
Owner: root coordinator. Writer and independent reviewer: assigned after foundation acceptance.
Read [COPY](../../COPY.md), [SOURCES](../../SOURCES.md), [VERIFIED-CLAIMS](../../VERIFIED-CLAIMS.md), [SCREENSHOTS](../../SCREENSHOTS.md), and [GLOSSARY](../../../GLOSSARY.md).

## Reader and outcome

- File: `content/learn-lighthouse/3.pagespeed-insights-vs-lighthouse.md`.
- Stable route: `/learn-lighthouse/pagespeed-insights-vs-lighthouse`, verify generated path before final acceptance.
- Reader: developer seeing different results in PSI and a local Lighthouse report.
- Question: Which result answers my question, and why do the numbers disagree?
- Outcome: identify lab versus field evidence, check URL/origin and device scope, then choose a useful next test.
- For an observed passing assessment with INP unavailable, explain PSI-04 beside that screenshot.
- Contribution: walk through real field and lab sections for one public page, then compare a separately recorded local report.
- Exclusions: tool winner rankings, API quota setup, exhaustive scoring math, invented datacenter routing, and measured speed promises.
- Claims: PSI-01 through PSI-04; CRUX-01 and CRUX-02; LH-01 through LH-03; METRIC-01 and METRIC-02.
- Search evidence: historical SEO plans only. NuxtSEO unavailable; current Site, locale, and measured demand unresolved.

## Definitive sources

- <https://developers.google.com/speed/docs/insights/v5/about>
- <https://developer.chrome.com/docs/crux/methodology>
- <https://developer.chrome.com/docs/crux/api/>
- <https://developer.chrome.com/docs/lighthouse/performance/performance-scoring>
- <https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md>
- <https://web.dev/articles/tbt>
- <https://web.dev/articles/inp>
- <https://developer.chrome.com/blog/lighthouse-13-0>

Reopen these during independent brief review. Current report versions and environments require captured evidence, not inference from source publication dates.

## Progressive flow

1. Answer first: PSI includes a Lighthouse lab test and available CrUX field evidence; these are separate results.
2. Read one PSI report: selected device, page/origin scope, collection period, lab score and environment.
3. Compare a local Lighthouse run of the same page. Explain that uncontrolled environments cannot establish which tool is more accurate.
4. Choose the next action: debug a repeatable lab issue, inspect field responsiveness, or investigate missing field data.
5. Link deeper scoring, INP, and CLI guidance only where needed. A product mention requires scoped implementation evidence first.

## Required visual evidence

Capture owner: root coordinator. Images remain outstanding until both source and final figure review pass.
Use one disclosed public test URL. If the initial URL has no field data, show that state and explain it.
If a second example is needed for populated field data, label its different URL and scope clearly.

| Shot | Reader question | Required state | Figure and annotation | Caption and alt plan |
| --- | --- | --- | --- | --- |
| PSI field section | Does this describe this page or its origin? | URL/origin label and actual metrics or missing-data notice; observed device and collection period in adjacent text | Annotated result, numbers at scope and field section | Caption: capture date, URL/origin, device, measured period. Alt: actual field state, no invented outcome. |
| PSI lab section | Which score came from a new Lighthouse test? | Same test URL/device, score/metrics; observed environment and version in caption and private manifest | Annotated result, number at lab section | Caption: separate lab run settings and time. Alt: lab report section and relevant state. |
| Local Lighthouse report | What changed between test setups? | Same public page and actual report; observed version/device/throttling/runtime in caption and private manifest | Control/result detail, no before/after framing | Caption: local setup and distinct run time. Alt: actual report/settings. |

Capture manifest must record raw pixel dimensions, captured CSS bounds, crop, measured density, final display width, and annotations.
Use native figures in the learn route. Browser-verify renderer support and scoped small muted caption styles; do not repair unused FigureImage speculatively.

## Existing factual components

- Remove `LighthouseDevtoolsMockup` from this article when the real captures replace it. It is fabricated UI, not report evidence.
- Remove `PsiServerMap` here unless its city locations and nearest-server assertion gain primary evidence. Do not broaden scope to rebuilding the map.
- `LabVsFieldFlow` contains the contradicted `1000+ visits` claim. Remove from this pilot or repair with consumer review; do not leave it beneath corrected prose.
- `AuditImpact` mixes weights and threshold labels. Prefer a short explanation plus a link; retain only if the applicable version and threshold meanings are verified.
- Inspect every retained component's text, tooltip, accessibility label, and synthetic values with its article consumer. Shared repairs reopen affected consumers.

## Examples and validation

The core example is report interpretation, not an API client. No executable snippet is required merely to fill a template.
If keeping a CLI command, pin the actual Lighthouse package and Node/Chrome versions, record its exact invocation, and run it on the disclosed public page.
Expected artifact: real Lighthouse JSON/HTML with version and settings. Store raw results in private scratch and provide reproducible instructions outside published collections.
Do not run concurrent Lighthouse benchmarks on the same machine or infer performance improvements from these illustrative runs.
No authenticated page, API key creation, paid provider research, or Unlighthouse full-site crawl is required for this pilot.

Preserve `publishedAt: 2026-03-04`. Existing `updatedAt: 2026-08-09` changes only after actual prose review.
Keep the route and existing navigation label unless a reviewed reader-facing correction is needed.
Natural links: `/learn-lighthouse/core-web-vitals`, `/glossary/inp`, `/glossary/tbt`, `/learn-lighthouse/lighthouse-cli`.
Verify destination existence and source currency before selecting links; do not imply unreviewed linked articles are verified.

## Review record

Foundation and glossary approval: root accepted on 15 September 2026.
Independent brief review: sources_reviewer accepted on 15 September 2026 after reopening definitive sources. Root accepted the handoff.
Writer response: not started.
Factual draft, both humanize passes, final meaning review, and rendered acceptance: not started.
Required final checks: one H1; title/description/canonical/dates; all retained factual components; native figure captions; desktop/mobile and both themes; real link navigation; private-record exclusions.
Current limitations: captures and exact run versions pending; no current demand evidence; imported package docs differ by environment.
