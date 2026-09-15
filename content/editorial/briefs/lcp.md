# Brief: Largest Contentful Paint

State: article reviewed. Root accepted the final production Worker rendering on 15 September 2026. Publication remains unverified. Independent reviewer and root accepted on 15 September 2026. Writer: product_writer; browser owner: root.
Parent Git revision: f1c66d74d1a2feeb6bffd516cf4929e1f8702878, accepted PSI pilot, PR111.
File: content/learn-lighthouse/lcp/0.index.md. Stable route: /learn-lighthouse/lcp.
Read [COPY](../../COPY.md), [SOURCES](../../SOURCES.md), [VERIFIED-CLAIMS](../../VERIFIED-CLAIMS.md), [SCREENSHOTS](../../SCREENSHOTS.md), and root GLOSSARY.md.

## Reader outcome

A developer has a slow LCP result and wants to locate the element and next diagnostic step.
Contribution: interpret an actual report's element and phase timings before selecting a fix.
Exclude exhaustive framework recipes, universal fix times, business uplift tables and product coverage claims.
No current demand or resolved locale is established. Historical plans show LCP intent only.

## Evidence and progression

Use LCP-01 through05, CWV-02, SEO-01, PSI-02/03 and the root's new observed capture after review.
Definition: <https://web.dev/articles/lcp>. Diagnostic source: <https://developer.chrome.com/docs/performance/insights/lcp-breakdown>.
Mechanisms: <https://web.dev/articles/optimize-lcp>. SEO boundary: <https://developers.google.com/search/docs/appearance/page-experience>.
Advanced instrumentation reference only: <https://github.com/GoogleChrome/web-vitals#attribution>.

1. Define the render timing and good target, scoped to field P75/device. Avoid equating it with completion of every important resource.
2. Find the actual LCP element in root's report. A text element is valid; do not assume a hero image.
3. Read that report's LCP breakdown and pick what to inspect next. Define four phases alongside actual observed rows.
4. Preserve heading Common LCP issues and its #common-lcp-issues fragment. Use a short phase-to-next-check table, without invented impact or delivery-time columns.
5. Remeasure comparable local conditions and later check matching field scope. Briefly explain changing candidates and missing URL data.

Remove AuditImpact usage so the hub does not mix a lab weight badge with unqualified field thresholds. Leave shared component unchanged.
Remove hardcoded1.0s/.25s budgets, load-event finalization, universal ranking claims, framework cards, Cloud roadmap and broad myths.
Remove the broken web-vitals snippet. An advanced source link is sufficient for this reader outcome; a new instrumentation tutorial is out of scope.

## Required shots and replay

Root is preparing one fresh Lighthouse13.4.1 report for <https://unlighthouse.dev> with --throttling-method=provided.
It uses mobile emulation without Lighthouse-added throttling. Exact Chrome, Node, invocation, date and report values await root's manifest.
Use this fresh report independently. Do not compare its score/timing to the pilot PSI runs or call it a benchmark.
Required pixels: LCP breakdown and actual selected element/node. One legible crop can suffice; use two if needed.
Callouts:1element,2largest observed phase, only after inspecting real rows. Do not invent missing resource rows.
Text LCP can require a webfont resource; text alone never implies zero resource phases. The largest phase suggests an investigation, not a proven cause.
Caption: URL, run date, local lab context, mobile emulation and no added Lighthouse throttling. Alt identifies actual element and timing.
Root supplies PNGs, raw JSON and source manifest. Writer verifies report values, decoded dimensions, digests and density before integration.
The eventual brief must retain the exact replay command and expected structural result, not guaranteed timing. Required screenshot remains outstanding until captured.

## Links, navigation and checks

Keep Core Web Vitals group, LCP hub and publishedAt2025-01-18. Preserve #common-lcp-issues because at least13local articles link it.
Natural destinations: CWV overview, accepted PSI comparison, then relevant LCP child guides for the observed phase.
Candidate children: slow-server-response, resource-load-delay, render-blocking-resources and large-images. Files exist; read the linked advice before retaining each. No blanket approval of their other claims.
Prefer current official advice if a child destination would teach a known conflicting procedure. Do not expand this two-article batch to rewrite siblings.
Verify oneH1, metadata/dates, old fragment, every retained route, accurate figures, native full-size keyboard links, mobile/desktop and both themes.
Run factual review, both humanize passes and independent final review. Root accepts before close. Current approvals and capture claims remain pending.

Independent brief review: sources_reviewer accepted on15September2026. Root accepted preparation on 15 September 2026. Explicit text-resource and causal guards reflect that review.

## Current factual handoff, 15 September 2026

Root and independent reviewer accepted this brief before drafting. Writer has completed the factual draft; neither humanize pass has run.

Article SHA256 file digest: `b5371985e88f86a968f078d2e7cd457e7f22b491b8a8ec3f9805c518eb745be9`.

Publication date preserved. Review date remains unchanged until factual acceptance. Markdown lint passed. Browser, full build and final review are pending.

### Accepted capture provenance

The earlier capture-pending notes describe brief preparation history. Root supplied and accepted the capture before this draft. Writer inspected the final PNG.

- Public asset: `/images/learn-lighthouse/lcp-breakdown-2026-09-15.png`, 1600 × 710.
- SHA256 file digest: `f326e7d45607634b4d3c82cd1e7a379140a77b272ca59a7e2a920921a13d47ab`.
- Report fetchTime: `2026-09-15T10:37:13.764Z`; Lighthouse 13.4.1, Node 24.18.0, HeadlessChrome 153.0.0.0.
- Mobile emulation, `throttlingMethod: provided`; no Lighthouse-added throttling.
- Raw LCP 1316.52 ms; raw TTFB 104.356 ms; raw render delay 1212.164 ms. Prose uses displayed 1.3 s, 100 ms and 1,210 ms.
- Marker 1 identifies the paragraph thumbnail; marker 2 points to render delay. Two observed phase rows only.
- Raw report, source capture, manifest and pixel verification remain private in `~/scratch/unlighthouse-batch-01/`. Root verified untouched pixels and 2.35 source pixels per CSS pixel at the 680 px cap.
- Root supplied the exact invocation below. A replay should produce an LCP breakdown and selected element, not guaranteed timings.

## Writing passes, 15 September 2026

Independent factual review passed, with the LCP external fragment corrected to `#1_eliminate_resource_load_delay` before humanization. Corrected LCP factual SHA256 file digest: `839ae5e20e233e4771d70a2d7a94aa52c3dda865bb8bd15174a3de717eb429d3`. Root authorized both writing passes. Earlier handoff states are dated history.

Pass 1 removed editorial wording such as “Do not add imaginary image-loading rows” and simplified assessment language. Pass 2 removed repeated metric instructions, repeated lab/field conclusions and the CWV moralizing ending. Definitions, threshold boundaries, missing-INP exception, origin scope, report timings, text/font qualification and causal uncertainty remain unchanged. Review date now records 15 September 2026.

Final humanized article SHA256 file digest: `5a526aafc178933316eed0b5658302f6c2795f229855ec7bbc3c455d4a45eb6f`. Independent final meaning review and root browser acceptance remain pending.

### Exact historical replay invocation

Executed by root with Node 24.18.0:

```bash
CHROME_PATH=/usr/bin/google-chrome pnpm dlx lighthouse@13.4.1 https://unlighthouse.dev/ --chrome-flags='--headless --disable-dev-shm-usage' --only-categories=performance --throttling-method=provided --output=html --output=json --output-path=/home/harlan/scratch/unlighthouse-batch-01/lcp-example --quiet
```

Internal link decision: inspected slow-server-response, resource-load-delay, render-blocking-resources and large-images. They retain respectively old audit thresholds/guaranteed savings, unconditional added-delay language and preload-first advice, a retired audit CLI, and arbitrary asset-size red flags. The current official optimization source is the safer next step for this overview. No sibling rewrite or blanket approval is implied.

Final meaning review: sources_reviewer accepted both humanized articles at 95/100 on 15 September 2026; root accepted the text. Full lint then removed one nonsemantic CWV adverb, accepted by root. Current CWV SHA256 file digest: `c541735e924c3d73bd093c081055c5ecca6458aba885b21c70fe8910e8add938`. LCP remains `5a526aafc178933316eed0b5658302f6c2795f229855ec7bbc3c455d4a45eb6f`. Earlier digests describe historical handoffs.

Local typecheck, full lint and 203 existing tests passed. Production build and root browser acceptance remain pending.

## Final local verification, 15 September 2026

Typecheck and all 203 existing tests passed. Full lint passed with 52 warnings and no errors. Scoped Markdown lint and case-police passed. Reviewer accepted the final CWV lint-only digest.

The first authenticated full build passed but captured pre-lint prose. A fresh generated `.nuxt` rebuild confirmed final wording, then failed on unrelated OG image 408 timeouts. One unchanged-source retry passed with zero prerender errors. No routes or build settings were weakened. GitHub token remained process-only.

Actual local production Worker on port 3198 serves both final article bodies with HTTP 200. CWV HTML contains “people encounter” and no stale “actually”. Both figure assets return image/png and match their recorded SHA256 bytes. Browser acceptance remains pending. Generated build and private logs remain in scratch; local unknown-route 301 limitation from the pilot is unchanged.

## Current accepted state, 15 September 2026

Root accepted the exact final article file digests after actual production Worker checks: CWV `c541735e924c3d73bd093c081055c5ecca6458aba885b21c70fe8910e8add938`; LCP `5a526aafc178933316eed0b5658302f6c2795f229855ec7bbc3c455d4a45eb6f`. Earlier pending statements above are dated handoff history.

Root checked desktop 1440 and mobile 390 in both themes, one H1, metadata, canonical, preserved publication dates and updated review date. Both figures decode their original PNG pixels, display at 660 CSS pixels on desktop, and have centered muted 14 px captions. Both full-size links passed Tab, Enter and Back. CWV/LCP navigation, CLS fragment, PSI navigation and the inherited LCP fragment passed. No overflow.

Generated public filenames, search, sitemap and both article HTML outputs exclude the new briefs and claims. Local Worker private-route 404 is not claimed because of the inherited unknown-path 301 behavior. Root noted an existing theme-toggle aria-label can lag after image Back navigation; theme switching works and this shared component is unchanged. No production deployment is established.

Private evidence: `~/scratch/unlighthouse-batch-01/root-browser-review.json`, `exclusion-check.json` and `build-retry.log`. Three of 98 local articles are now reviewed; 95 remain. This batch stops at its PR checkpoint.
