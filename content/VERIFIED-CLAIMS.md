# Verified article claims

Pilot seed, checked 15 September 2026 by request_content_lead through opened primary pages.
sources_reviewer independently reopened the pilot sources and accepted this seed on 15 September 2026.
Status identifies evidence, not publication approval.
Statuses: Documented, Observed, Unresolved, Withdrawn. Evidence kind remains separate.

| ID | Status | Evidence kind | Claim | Scope and qualifications | Supporting URL or evidence | Checked | Source date/version |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PSI-01 | Documented | Official documentation | PSI presents Lighthouse lab diagnostics and available CrUX field data. | The two sections answer different questions; field values do not form the Lighthouse score. | <https://developers.google.com/speed/docs/insights/v5/about> | 2026-09-15 | Updated 2024-10-21 |
| PSI-02 | Documented | Official documentation | PSI field metrics summarize the previous 28-day collection period at P75. | Check device and URL/origin scope; not a daily arithmetic average. | <https://developers.google.com/speed/docs/insights/v5/about> | 2026-09-15 | Updated 2024-10-21 |
| PSI-03 | Documented | Official documentation | Insufficient URL data can lead to origin data or no field data. | Neither state establishes good or bad performance for the tested page. | <https://developers.google.com/speed/docs/insights/v5/about> | 2026-09-15 | Updated 2024-10-21 |
| PSI-04 | Documented | Official documentation | With insufficient INP data, good P75 LCP and CLS can still pass the PSI assessment. | Missing INP does not establish good responsiveness; insufficient LCP or CLS prevents assessment. | <https://developers.google.com/speed/docs/insights/v5/about#core_web_vitals> | 2026-09-15 | Updated 2024-10-21 |
| CRUX-01 | Documented | Official documentation | Google does not disclose the exact popularity threshold. | Page/origin eligibility also involves discoverability and eligible users. No 1,000-visits rule. | <https://developer.chrome.com/docs/crux/methodology> | 2026-09-15 | Updated 2024-06-20 |
| CRUX-02 | Documented | Official documentation | CrUX API exposes page/origin field metrics, including INP. | PSI is not the only interface for this dataset. API use requires its own authorization and scope checks. | <https://developer.chrome.com/docs/crux/api/> | 2026-09-15 | Current page, not version pinned |
| LH-01 | Documented | Official documentation | A Lighthouse Performance score is a weighted combination of metric scores. | Distinguish metric weights from audit findings and field thresholds. | <https://developer.chrome.com/docs/lighthouse/performance/performance-scoring> | 2026-09-15 | Page labels table Lighthouse 10; footer 2019-09-19 |
| LH-02 | Documented | Release announcement | Lighthouse 13 replaced specified older audits with insights without changing performance scoring in that release. | Audit JSON changed too. This announcement does not prove the latest deployed PSI version. | <https://developer.chrome.com/blog/lighthouse-13-0> | 2026-09-15 | Published 2025-10-10 |
| LH-03 | Documented | Official source documentation | Page, browser, hardware, network, and resource contention can vary results. Repeated comparable runs are more useful than one score. | Local runs are not guaranteed consistent; shared-machine concurrent runs can distort results. | <https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md> | 2026-09-15 | Moving main, inspected this date |
| METRIC-01 | Documented | Official documentation | TBT can indicate responsiveness problems but does not substitute for INP. | Navigation TBT covers a loading window; Lighthouse timespan measurement can extend beyond page load. | <https://web.dev/articles/tbt> | 2026-09-15 | Article update 2025-10-15; footer 2024-11-04 |
| METRIC-02 | Documented | Official documentation | INP concerns user interactions across the page lifecycle. | Do not describe every tap duration as the final INP, or claim all lab interaction measurement is impossible. | <https://web.dev/articles/inp> | 2026-09-15 | Current page, version not pinned |
| SOURCE-01 | Observed | Implementation inspection | Local imported documentation selects unlighthouse-alt before unlighthouse; absent both, it fetches GitHub docs. | This environment's imported docs are not proof of production docs or a released package. | content.config.ts at Git revision 8a8b40c004f22e27e12c5ec632bd54c58fae568b | 2026-09-15 | See editorial/README.md for resolved Git revisions |

## Withdrawn or unresolved pilot assertions

These treatments are applied in the reviewed pilot; production publication remains unverified.

| ID | Status | Existing assertion | Required treatment |
| --- | --- | --- | --- |
| OLD-01 | Withdrawn | CrUX needs about 1,000 page loads; component says 1000+ visits. | Replace with CRUX-01 in prose, tables, FAQ, and LabVsFieldFlow.vue usage. |
| OLD-02 | Withdrawn | PSI is the only source of INP without custom RUM. | CRUX-02 supplies another official interface. |
| OLD-03 | Withdrawn | Local scores are consistently high quality; applied throttling always lowers scores and is more realistic. | Explain environment differences with LH-03; remove unmeasured winner labels. |
| OLD-04 | Unresolved | PSI quota universally grants 25,000 free daily requests. | Outside pilot outcome. Omit number and link a separately reviewed API guide only after its own check. |
| OLD-05 | Unresolved | PSI routes to the nearest named city shown by PsiServerMapClient.vue. | Current primary page names broad regions, not that routing algorithm. Remove map from pilot or support every claim. |
| OLD-06 | Unresolved | Unlighthouse audits every discovered page, including INP. | Pin released implementation and sampling behavior before product claims; imported docs are not evidence. |
| OLD-07 | Unresolved | PSI and local Lighthouse always use version 13, cold cache, or separate clean profiles. | Record actual run version/settings; omit universal claims without current evidence. |

## Source conflicts and next evidence

PSI's overview still lists TTI among lab metrics. The scoring page labels its newer table Lighthouse 10 despite an older footer.
The TBT page has different article and footer update dates. Preserve both; use the specific metric discussion for scope.
Do not copy stale version or audit labels from a high-priority page without checking the captured report and matching release source.

Pilot captures and exact Lighthouse execution are recorded below. No additional Unlighthouse capability is established.
No original performance benchmark, live API entitlement, or search-demand measurement is established by this seed.

## Pilot observations, 15 September 2026

Root captured the reports; product_writer inspected the exports and local report settings.
Full replay instructions and image SHA256 file digests: [pilot brief](editorial/briefs/pagespeed-insights-vs-lighthouse.md#real-run-evidence).

| ID | Status | Evidence kind | Claim and limit | Evidence |
| --- | --- | --- | --- | --- |
| OBS-PSI-01 | Observed | Real PSI report | Mobile origin data for `https://unlighthouse.dev` passed, LCP 1.8s, CLS 0.03, INP N/A, latest 28-day period. No URL-level or good-INP inference. | Root capture 15 September 2026 at 19:26 GMT+10; public/images/learn-lighthouse/psi-field-data-2026-09-15.png |
| OBS-PSI-02 | Observed | Real PSI report | One mobile Lighthouse 13.4.1 run scored 48: LCP 5.9s, TBT 700ms, CLS 0. Environment: Moto G Power, Slow 4G, HeadlessChromium 151.0.7922.173. | Same capture; public/images/learn-lighthouse/psi-lab-report-2026-09-15.png |
| OBS-LH-01 | Observed | Local Lighthouse JSON/HTML | Same URL, separate run 2026-09-15T09:28:02.976Z scored 66: LCP 4.5s, TBT 140ms, CLS 0.001. Node.js 24.18.0, Lighthouse 13.4.1, HeadlessChrome 153.0.0.0, mobile simulated throttling. One run cannot establish cause or tool accuracy. | Root scratch local-lighthouse.report.json and local-observation.json; public/images/learn-lighthouse/local-lighthouse-report-2026-09-15.png |
| LH-04 | Documented | Official source documentation | Lighthouse defaults to simulated throttling, including PSI and DevTools. Request-level throttling is another approximation, not a guarantee of lower scores. | <https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md>, opened 15 September 2026 |
| LH-05 | Documented | Official documentation | DevTools exposes Clear storage; local browser/device state can influence reports. Do not assert DevTools uses a separate profile. | <https://developer.chrome.com/docs/devtools/lighthouse#advanced-settings>, opened 15 September 2026 |

Root accepted the pilot article and rendered figures on 15 September 2026. The [pilot brief](editorial/briefs/pagespeed-insights-vs-lighthouse.md#final-acceptance-15-september-2026) records exact file digests, browser evidence and limits. Observation status does not imply a controlled benchmark or live publication.
