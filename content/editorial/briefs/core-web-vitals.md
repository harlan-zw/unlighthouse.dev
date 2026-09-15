# Brief: Core Web Vitals

State: article reviewed. Root accepted the final production Worker rendering on 15 September 2026. Publication remains unverified. Independent reviewer and root accepted on 15 September 2026. Writer: product_writer; browser owner: root.
Parent Git revision: f1c66d74d1a2feeb6bffd516cf4929e1f8702878, accepted PSI pilot, PR111.
File: content/learn-lighthouse/1.core-web-vitals.md. Stable route: /learn-lighthouse/core-web-vitals.
Read [COPY](../../COPY.md), [SOURCES](../../SOURCES.md), [VERIFIED-CLAIMS](../../VERIFIED-CLAIMS.md), [SCREENSHOTS](../../SCREENSHOTS.md), and root GLOSSARY.md.

## Reader outcome

A developer sees a Core Web Vitals result and needs to choose the next investigation.
Explain the three metrics, interpret a real field report, and route the reader to the relevant metric guide.
Contribution: a worked scope-and-missing-data interpretation before any optimization checklist.
Exclude complete metric algorithms, business case-study tables, web-wide pass-rate statistics, framework lists and product sales claims.
No measured demand or resolved locale is available. Historical SEO plans are leads only.

## Evidence and progression

Use claims CWV-01 through04, SEO-01, PSI-01 through04 and existing OBS-PSI-01. Exact URLs/dates are in claims.md.
Definitive starting sources: <https://web.dev/articles/vitals> and <https://developers.google.com/speed/docs/insights/v5/about>.
Metric details: <https://web.dev/articles/lcp>, <https://web.dev/articles/cls>, <https://web.dev/articles/inp>.
Search boundary: <https://developers.google.com/search/docs/appearance/page-experience>.

1. Answer what the three metrics measure. Give one compact threshold table with precise boundaries and units.
2. Interpret the accepted real PSI field screenshot. Explain P75 using measurements, not unique visitors.
3. Show the next investigation for each metric. Keep CLS's session-window meaning and INP's interaction scope accurate without algorithm detours.
4. Explain lab diagnosis versus field verification. Link the accepted PSI comparison for the deeper distinction.
5. Briefly address missing field data, delayed post-fix field changes, and SEO limits where readers need them.

Required corrections: remove incorrect CLS arithmetic, automatic ranking/conversion promises in description, metric-weight prioritization as a CWV strategy, universal test coverage and duplicate broken ending.
No factual Vue component is currently used here. Do not introduce synthetic report UI.

## Visual and example contract

Required figure: reuse public/images/learn-lighthouse/psi-field-data-2026-09-15.png, digest a6b89fb90c11577e643b6c2d88129740a29e3e87d76dcb28ee78dfbbbe59a89d,1984×1048.
Question: what does a passed origin assessment with INP unavailable establish?
Keep existing callouts1Origin and2period. Explain both in indexable text. Explain INP N/A separately without pretending there is a third callout.
Caption must identify mobile, origin <https://unlighthouse.dev>, latest28-day period and capture15September2026. Alt describes relevant visible results.
Use the approved native figure/provider/zoom/external-link pattern and680px cap. New caption and integration still require review.
No executable public snippet is needed. Browser replay is PSI mobile inspection; current results need not reproduce the historical capture.

## Links, navigation and checks

Keep Core Web Vitals group, Overview leaf, both existing URLs and publishedAt2025-01-12.
Natural links: LCP hub for loading diagnosis; CLS/INP hubs for each metric; accepted PSI comparison for lab/field confusion.
Do not endorse unreviewed tool capabilities through relatedPages. Review every retained destination's relevant section and actual navigation.
Writer verifies oneH1, metadata, precise tables, dates, image decode, full-size keyboard link and both widths/themes.
Run factual review, both humanize passes, final meaning review, then rendered acceptance. Date changes follow factual acceptance.
Review decisions, writer response and final digest remain pending. Root approves before close.

Independent brief review: sources_reviewer accepted on15September2026. Root accepted preparation on 15 September 2026.

## Current factual handoff, 15 September 2026

Root and independent reviewer accepted this brief before drafting. Writer has completed the factual draft; neither humanize pass has run.

Article SHA256 file digest: `72fc048f4df9e174af5833b9bd96241d6bf90112dae2154e0ebcaac9d3111b3c`.

Publication date preserved. Review date remains unchanged until factual acceptance. Markdown lint passed. Browser, full build and final review are pending.

## Writing passes, 15 September 2026

Independent factual review passed, with the LCP external fragment corrected to `#1_eliminate_resource_load_delay` before humanization. Corrected LCP factual SHA256 file digest: `839ae5e20e233e4771d70a2d7a94aa52c3dda865bb8bd15174a3de717eb429d3`. Root authorized both writing passes. Earlier handoff states are dated history.

Pass 1 removed editorial wording such as “Do not add imaginary image-loading rows” and simplified assessment language. Pass 2 removed repeated metric instructions, repeated lab/field conclusions and the CWV moralizing ending. Definitions, threshold boundaries, missing-INP exception, origin scope, report timings, text/font qualification and causal uncertainty remain unchanged. Review date now records 15 September 2026.

Final humanized article SHA256 file digest: `7c2018858c233361f164b1c39e1c8709e2b00fe50426b7445374e7175e46a5f3`. Independent final meaning review and root browser acceptance remain pending.

Internal link decision: retained CLS `#diagnose-the-failing-visit` after reading that practical recording checklist. Omitted the broad INP hub: its subparts section repeats an unverified 60%+ claim, and measurement guidance includes a stale DevTools checkbox and unsupported proxy comparison. Existing official INP definition supplies the needed scope. This is a bounded link decision, not approval or rewrite of those sibling articles.

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
