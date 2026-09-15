# Brief: PageSpeed Insights versus Lighthouse

State: article reviewed. Original site Git revision: `8a8b40c004f22e27e12c5ec632bd54c58fae568b`.
Owner: root coordinator. Writer: product_writer. Independent reviewer: sources_reviewer.
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

Capture owner: root coordinator. Three real captures supplied and inspected by the writer on 15 September 2026. Independent factual figure review passed; root rendered figure review passed.
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
Writer response: factual draft ready on 15 September 2026; see current handoff below.
Independent factual review passed. Both humanize passes and writer meaning recheck completed; independent final prose review passed; root rendered acceptance passed.
Required final checks: one H1; title/description/canonical/dates; all retained factual components; native figure captions; desktop/mobile and both themes; real link navigation; private-record exclusions.
Current limitations: no current demand evidence; imported package docs differ by environment; examples are one run per environment, without causal attribution.

## Current factual handoff, 15 September 2026

Parent Git revision: `660319a43570ff21ae57452b716971f3c77246c7`, foundation [PR #110](https://github.com/harlan-zw/unlighthouse.dev/pull/110).
The writer replaced all four unsupported or illustrative component uses with ordinary prose and three real figures.
No product coverage promise, API entitlement, or executable public snippet remains.
The suggested `/learn-lighthouse/lighthouse-cli` has no local article and was omitted.
Internal destinations retained: core-web-vitals, glossary/tbt, glossary/inp; HTTP checks passed for all three destinations; root verified all three destination headings and browser Back.
Published date is unchanged. Review date updated to 2026-09-15 after independent factual acceptance and the writing passes.

Factual article SHA256 file digest: `ddca51fb480ab2d11a4a2631390fddf2e5c695a4fbd54454d8dbd53e6c1ef080`.
This is a file digest, not a Git commit or final article approval.

### Real run evidence

Tested URL for both lab runs: `https://unlighthouse.dev/`.
PSI mobile captured 15 September 2026 at 19:26 GMT+10: origin field assessment passed, LCP 1.8s, CLS 0.03, INP N/A; latest 28-day period.
PSI lab: score 48, LCP 5.9s, TBT 700ms, CLS 0, Lighthouse 13.4.1, Moto G Power emulation, Slow 4G, HeadlessChromium 151.0.7922.173.
Local run: 2026-09-15T09:28:02.976Z; score 66, LCP 4.5s, TBT 140ms, CLS 0.001.
Local runtime: Node.js 24.18.0, Lighthouse 13.4.1, HeadlessChrome 153.0.0.0; default mobile simulation, CPU 4×, RTT 150ms, throughput 1638.4 Kbps.
Raw report JSON/HTML, `local-observation.json`, PSI observation and annotated capture manifest are private under `~/scratch/unlighthouse-content-refresh/`.
These reports are illustrative observations, not repeated benchmarks, causal evidence, or proof of accuracy differences.

Root executed this invocation. Run from a scratch directory with Node.js 24.18.0 and Google Chrome installed at the specified path:

```sh
CHROME_PATH=/usr/bin/google-chrome pnpm dlx lighthouse@13.4.1 https://unlighthouse.dev/ --chrome-flags='--headless --disable-dev-shm-usage' --only-categories=performance --output=html --output=json --output-path=./local-lighthouse --quiet
```

This recreates the test setup and produces JSON/HTML reports. Current website, browser and machine conditions will change measured results.
No live authenticated test, API entitlement check or site-wide crawl was performed for this pilot.

### Publication images

Writer inspected each exported PNG and matched its SHA256 file digest to the root capture manifest.
All exports came from 2400×2200 PNGs captured at a 1200×1100 CSS viewport, with lossless 2× crops and numbered overlays.
The learn-route figure cap is 680 CSS pixels. Root verified desktop/mobile, both themes and all three full-size links.

| Asset in public/images/learn-lighthouse | Decoded pixels | Source pixels per CSS pixel at 680px | SHA256 file digest |
| --- | --- | --- | --- |
| psi-field-data-2026-09-15.png | 1984×1048 | 2.92 | `a6b89fb90c11577e643b6c2d88129740a29e3e87d76dcb28ee78dfbbbe59a89d` |
| psi-lab-report-2026-09-15.png | 1920×1420 | 2.82 | `726410ae396c8e7b6a13f04e7b5e9a2d0aa3fce1c33ca72fc6f3ec2a8ac33c89` |
| local-lighthouse-report-2026-09-15.png | 1560×1170 | 2.29 | `dd00e1cb45ad7c57aca489eb89a3efcd72ea2b24bf294b32404afd40fb9e9437` |

### Factual approval and writing passes, 15 September 2026

sources_reviewer independently accepted factual SHA256 file digest `ddca51fb480ab2d11a4a2631390fddf2e5c695a4fbd54454d8dbd53e6c1ef080`.
Root accepted that factual handoff. This approval applies to the historical factual draft, not automatically to later revisions.

Pass 1, surface: changed “matter substantially” to a specific reason to inspect TBT; shortened generic “Start by checking which results” phrasing.
Pass 2, structure: used shorter sentences to introduce the real report; removed the premature “both valid” takeaway; moved detailed local runtime/settings out of the caption and retained them in the evidence record.
Root feedback applied: “The This URL option is disabled” describes the control without implying that the homepage is unreachable.
Meaning recheck: origin scope, missing-INP exception, score/metric values, run dates, versions and single-run limitations preserved.
The example does not attribute the score gap to a specific cause or promote one environment as more accurate.

Humanized article SHA256 file digest: `23e83fe5458ff2ae7e77e93c6881e92fed78546d5c21033b82f29be09bc6263c`.
sources_reviewer independently accepted this humanized file digest on 15 September 2026. Root accepted the final article and rendered results; see final acceptance below.

### Renderer and local checks

Installed Nuxt UI 4.11.1 maps img to ProseImg and forwards attributes to Nuxt Image 2.1.0.
Its default zoom added a modal trigger; Nuxt Image generated unnecessary doubled IPX widths.
The pilot opts out per image with provider="none" and :zoom="false". Installed none provider returns the original URL unchanged.
Root authorized optional image.providers.none registration in nuxt.config.ts after the unregistered provider returned HTTP500. The installed module resolves the built-in none provider. The default provider remains unchanged; only pilot images select none. No shared component changed. Native figures/captions and direct full-size links remain.
Fresh humanized HTTP: 200, current prose, three figures/captions and explicit caption line breaks. Image src/srcset resolve to original PNG paths without IPX; modal trigger attributes are absent. Root verified browser currentSrc, both themes and navigation against the production Worker.
Article markdownlint (file-local native-tag allowlist), case-police, route/config ESLint and full typecheck passed. Existing test suite: 203 passed. Full production build passed with the authorized private process-only GitHub token. See build evidence below.
Preview uses the coordinator's private dev-layer for local native-binding resolution; this is not a production configuration change.

Comark retained old content during this preview session after Markdown edits. Restarting the task server regenerated current content. Inspect a changed sentence before accepting rendered evidence.

### Full-size link repair, 15 September 2026

Root browser testing found that keyboard Enter on a relative image link used SPA navigation and rendered a 404.
All three caption links now pass :external="true" through ProseA to ULink, using native same-tab navigation.
Installed ProseA forwards inherited attributes to ULink, whose external prop prevents router navigation.
This changes link behavior only; prose and image values are unchanged.
Current article SHA256 file digest: `1bd179cd1307e74816cfd3ef9060726911a613132aae5467075c18296497a1ce`. Root verified all three links with Tab, Enter, image decoding and browser Back.

### Production build evidence, 15 September 2026

Full lint passed with 42 existing warnings and zero errors. Full typecheck and 203 existing tests passed.
First normal build failed only prerender `/api/stats.json` and `/api/stats/summary.json` because local GitHub authentication was absent.
Root authorized a private process-only `NUXT_GITHUB_ACCESS_TOKEN` from `gh auth token`. The token was never printed or written by the loader.
The second full build passed without changing routes or faking stats. A private in-memory scan confirmed the token is absent from all generated `.output` files.
GitHub access uses private runtimeConfig and server-only Octokit.

Private logs: `~/scratch/unlighthouse-content-refresh/writer-{lint,typecheck,build,authenticated-build}.log`.
Production preview uses the generated Worker: `pnpm exec wrangler --cwd .output dev --local --port 3196`.
Worker HTTP returned the current 162KB pilot HTML with three figures. Root browser acceptance passed.
The earlier 3195 static snapshot uses real built HTML/JS from the first attempt; it does not establish a successful full build.

## Final acceptance, 15 September 2026

State: article reviewed, not published verified.
Root accepted final article SHA256 file digest `1bd179cd1307e74816cfd3ef9060726911a613132aae5467075c18296497a1ce`.
Independent factual review covered `ddca51fb480ab2d11a4a2631390fddf2e5c695a4fbd54454d8dbd53e6c1ef080`.
Independent final meaning review covered `23e83fe5458ff2ae7e77e93c6881e92fed78546d5c21033b82f29be09bc6263c`; the later change only makes three image links external.

Root checked the actual production Worker on 3196:

- One H1, correct title/description/canonical, preserved publication date and reviewed date.
- All three full-size links reached by Tab with solid focus outlines; Enter opened image/png; Back restored the article.
- All three core-web-vitals/TBT/INP client links reached their actual destination headings and returned with Back.
- Desktop 1440px and mobile 390px, light/dark, without overflow. Captions 14px, centered, muted and underlined links.
- Original PNG responses matched source bytes. At 660px display, density was 3.01/2.91/2.36 source pixels per CSS pixel.

Root inspected final media: `~/.dev-browser/tmp/unlighthouse-final-desktop-light.png` and `~/.dev-browser/tmp/unlighthouse-final-mobile-dark.png`.
Local Worker unknown routes self-redirect 301; this limits a local 404 exclusion assertion. Built collections/search/sitemap omit editorial records.
Root separately saw 404 for existing live COPY/editorial paths. That check does not prove this new article revision is deployed.
Production publication and remote CI remain outside this local acceptance.
