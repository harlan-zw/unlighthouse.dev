# Q1 2026 SEO Execution Plan

**Sprint plan to capture organic traffic via learn-lighthouse content + free tools**

Last updated: February 27, 2026

---

## Q1 Scorecard

### Traffic (28-day windows)
| Month | Clicks | Impressions | CTR | Avg Pos | Target Clicks |
|-------|--------|-------------|-----|---------|---------------|
| Jan baseline | 557 | 4,867 | 2.14% | 29.2 | 600 |
| Feb actual | **1,320** | **77,062** | 1.7% | **8.4** | 900 |
| Mar target | — | — | — | — | 2,000 |

**Feb exceeded click target by 47%.** Impressions exploded 15x due to learn-lighthouse content indexing. CTR dipped because of 0-click high-impression clusters (fixed Feb 27).

### Ranking Targets
| Keyword | Jan Pos | Feb Pos | Mar Target | Status |
|---------|---------|---------|------------|--------|
| lighthouse cli | #11 | **#7.8** | #5 | Rising |
| bulk lighthouse test | #1 | #1 | #1 | Holding |
| lighthouse ci | #14 | **#11.2** | #8 | Rising |
| cls debugger | #5.6 | **#5.2** | #3 | Rising |
| lighthouse report viewer | #6.9 | **#7.0** | #5 | Stable |
| lighthouse scoring calculator | — | **#5.8** | #3 | NEW |
| lighthouse speed index | #10 | **#9.3** | #5 | Rising |
| how to fix lcp | — | #10.2 | #5 | NEW (9.6K impr!) |

### Content Delivered
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| learn-lighthouse pages | 24 | **55+** | Exceeded |
| Glossary pages | 3 | **8** | Exceeded |
| Tools launched | 3 | **11** (bulk-pagespeed, cls-debugger, inp-analyzer, cwv-compare, cwv-checker, cwv-history, lcp-finder, lighthouse-report-viewer, lighthouse-score-calculator, pagespeed-insights-performance, ttfb-checker) | Exceeded |
| Framework guides | 8 | 0 | Deferred to Q2 |
| Compare pages | 2 | 0 | Deferred |
| Cloud launch | 2 pages | 0 | Deferred |

---

## What's Done (Jan-Feb)

### ✅ Completed
- [x] `/tools/bulk-pagespeed` — live, getting impressions
- [x] `/tools/cls-debugger` — 496 impr, 17 clicks, pos 5.2
- [x] `/tools/inp-analyzer` — live
- [x] `/tools/cwv-compare` — live
- [x] `/tools/cwv-checker` — live
- [x] `/tools/cwv-history` — live
- [x] `/tools/lcp-finder` — live
- [x] `/tools/lighthouse-score-calculator` — live
- [x] `/tools/pagespeed-insights-performance` — live
- [x] `/tools/ttfb-checker` — live
- [x] `/tools/lighthouse-report-viewer` — 2,424 impr, 35 clicks, pos 9.5
- [x] `/tools` landing page — 975 impr, 14 clicks
- [x] learn-lighthouse content hub — LCP (12 pages), CLS (6 pages), INP (7 pages), SEO (8 pages), A11y (16 pages), Best Practices (13 pages), Playwright (3 pages), Lighthouse CI (6 pages)
- [x] Glossary — LCP, CLS, INP, FCP, Speed Index, TBT, TTFB, SI
- [x] PageSpeed Insights API guide
- [x] CLI page title/meta optimization
- [x] CI page title/meta optimization
- [x] CTR fixes on 16 high-impression pages (Feb 27)

### ⏭️ Deferred
- [ ] `/cloud` + `/cloud/pricing` — needs product readiness
- [ ] `/compare/debugbear` — needs cloud to exist for fair comparison
- [ ] `/compare/pagespeed-insights` — lower priority given content hub success
- [ ] Framework pages (Next.js, Nuxt, React, Vue) — Q2

---

## March 2026 Plan (4 weeks remaining in Q1)

### Week 1 (Mar 1-7): CTR Monitoring + Quick Wins

**Goal:** Verify CTR fixes are working, pick off low-hanging fruit.

**Tasks:**
1. **Check CTR fix impact** — pull GSC data for desktop flag, maxRoutes, LCP hub clusters
   - If still 0% CTR after 1 week: investigate SERP snippets, may need content changes not just meta
   - ✅ GSC 7d pull Mar 4: desktop flag cluster showing 2 clicks (up from 0), device page pos 4.4
2. ✅ **Lighthouse report viewer push** — pos 8.3 (7d), 840 impressions
   - Title updated: "Lighthouse Report Viewer - Analyze JSON Reports Online Free"
   - Added FAQ: "How do I view a Lighthouse report online?"
   - Made "Paste JSON" primary action button
   - Subtitle updated to mention "paste" and "analyze"
3. ✅ **Speed index page** — pos 12 (7d), 433 impressions, 0 clicks (REGRESSED from 9.3)
   - Title rewritten to match top query: "What Is Speed Index in PageSpeed Insights & Lighthouse?"
   - Added "pagespeed insights" keywords
   - Added internal links to bulk-pagespeed tool and score calculator
   - Added link from LCP hub relatedPages
4. ✅ **"lighthouse scoring calculator"** — pos 10.7 (7d), 220 impressions
   - Title changed to "Lighthouse Scoring Calculator" to match exact search query
   - Description updated with "scoring" keyword
5. ✅ **0-CTR pages fixed (Mar 4):**
   - Render-blocking (651 impr): title → "Eliminate Render-Blocking Resources: Lighthouse Audit Fix"
   - Meta-viewport (728 impr): title → "Zooming and Scaling Must Not Be Disabled: Lighthouse Fix"
   - CI GitHub Actions (440 impr): title → "Lighthouse CI GitHub Actions: Setup Guide & Documentation", added "documentation" keywords
   - Added internal links: render-blocking → bulk-pagespeed + speed-index, LCP hub → speed-index + lcp-finder

6. ✅ **More 0-CTR fixes (Mar 4 batch 2):**
   - CI budgets (336 impr, pos 4.1): title → "Performance Budgets with Lighthouse CI: Assertions & budget.json"
   - Layout shifts (277 impr, pos 7.4): title → "Fix Layout Shifts: CSS Reflow, Font-Size & CLS Causes", added "font-size cause reflow" keywords
   - PSI API Python (268 impr): title → includes "googleapis.com/pagespeedonline", added API URL keywords
   - PSI API Node.js (219 impr): same treatment
   - learn-lighthouse hub (310 impr, pos 10.4): title → "Learn Lighthouse & Web Vitals: Performance Guides"
7. ✅ **Hub page CTR improvements (Mar 4):**
   - CLS hub (1,974 impr): title → "Cumulative Layout Shift (CLS): What Is a Good Score & How to Fix" — matches "good cls score" queries
   - LCP hub (1,747 impr): title → "Largest Contentful Paint (LCP): Good Scores, Fixes & Guide" — matches "largest contentful paint (lcp)" query
   - SEO hub (1,751 impr): title → "Lighthouse SEO Audit: All 8 Checks Explained & How to Fix"

### Week 2 (Mar 8-14): Cluster Optimization + Monitoring

**Goal:** Optimize existing pages for keyword clusters. Monitor Mar 4 title fixes. Pull fresh GSC data mid-week.

**Tasks:**
1. ✅ **"bulk cwv tool"** — 147 impressions, pos 7.2, 0 clicks
   - Title changed to "Bulk Core Web Vitals Test - Compare CWV Across Sites"
   - Description updated with "bulk" and "compare" keywords
   - Migrated to `useToolSeo()` + `<ToolFaq>` (replaces manual SEO + hardcoded FAQ)
   - Dropped manual featureList from schema (not a ranking signal)

2. ✅ **"lighthouse continuous integration"** — 119 impressions, pos 11.6, 0 clicks
   - Added H2 "## Setting Up Lighthouse Continuous Integration" anchor heading
   - Added relatedPages: cwv-checker, bulk-pagespeed
   - Learn hub now links to Lighthouse CI section

3. **Monitor Mar 4 title fix impact** — pull GSC 7d data on Mar 10
   - Key metrics to check:
     - Desktop flag cluster CTR (was 0%, fixes deployed Feb 27 + Mar 4)
     - Hub page CTR (CLS, LCP, SEO — title changes Mar 4)
     - 0-CTR pages: budgets, layout-shifts, API examples
     - Speed index position (was pos 12, title rewritten Mar 4)

4. ✅ **PageSpeed API URL queries** — DONE in Mar 4 batch 2
   - Added `googleapis.com/pagespeedonline/v5/runpagespeed` to Python + Node.js page titles and keywords

5. **Puppeteer launch options** — 61 impressions, pos 9.8, 0 clicks
   - Keywords added Feb 27, monitor for improvement
   - If no CTR change by Mar 10: expand content section on launch options

6. ✅ **Learn hub expansion** — added Lighthouse CI, PageSpeed API, Playwright guides; SEO/A11y/Best Practices categories; 3 free tools section
7. ✅ **Python example fix** — fixed corrupted `ighthou` text and broken relatedPages path

### Week 3 (Mar 15-21): Internal Linking Audit

**Goal:** Strengthen topical authority through internal links between hub pages, fix pages, tools, and glossary.

**Tasks:**
1. ✅ **Audit internal links from learn-lighthouse hub pages**
   - Each metric hub (LCP, CLS, INP) should link to:
     - Its fix sub-pages ✅ (done via navigation)
     - Relevant tools ✅ (LCP hub → bulk-pagespeed, CLS hub → cls-debugger, SEO/A11y/BP hubs → tools)
     - Relevant glossary entries
   - Each fix page should link to:
     - Parent hub page ✅
     - Relevant tool ✅ (3 LCP fix pages → lcp-finder, 2 INP fix pages → inp-analyzer)
     - Related fix pages (e.g., render-blocking → lazy loading)

2. ✅ **Cross-link between sections**
   - SEO hub → bulk-pagespeed + lighthouse-score-calculator
   - A11y hub → CLS guide + lighthouse-report-viewer + lighthouse-score-calculator
   - Best Practices → lighthouse-report-viewer + bulk-pagespeed

3. ✅ **Complete internal linking coverage (Mar 4)**
   - INP fix pages 3-7 → `/tools/inp-analyzer` (5 pages)
   - LCP fix pages 5-12 → `/tools/lcp-finder` (8 pages)
   - `lcp/1.slow-server-response` → `/tools/ttfb-checker`
   - `1.core-web-vitals` → `/tools/cwv-compare`
   - `2.bulk-lighthouse-testing` → `/tools/bulk-pagespeed`
   - Tool → content reverse links:
     - `pagespeed-insights-performance.vue` → Related Guides (CWV, LCP, CLS, INP)
     - `cwv-history.vue` → Related Resources (CWV, LCP, CLS, INP)
     - `lighthouse-report-viewer.vue` → Core Web Vitals Guide link added

4. **Link from external repo docs to learn-lighthouse** — deferred (requires upstream repo changes)
   - Device config → link to learn-lighthouse/lcp (desktop vs mobile performance)
   - CI integration → link to learn-lighthouse/lighthouse-ci
   - Puppeteer → link to learn-lighthouse/lcp/client-side-rendering

### Week 4 (Mar 22-28): Q1 Review + Q2 Planning ✅ COMPLETED (Apr 13)

**Goal:** Measure Q1 results, perform technical SEO sweep, plan Q2 priorities.

**Tasks:**
1. ✅ **Full GSC data pull** — 28d ending Apr 11: 1,134 clicks, 109,973 impressions, 1.03% CTR, pos 7.5. March click target (2,000) missed; peaked ~1,389 in early March.
2. ✅ **Content audit** — Homepage dropped 731 clicks (-305 from March peak). Hub pages (seo, lcp, cls, lighthouse-ci) have 10K+ impressions with 0.1-0.4% CTR. Zero-click CLI clusters still unresolved after Feb 27 + Mar 4 fixes.
3. ✅ **New keyword clusters identified** — `playwright lighthouse` (353 impr), `pagespeed insights vs lighthouse` (441 impr), `largest contentful paint optimization best practices 2026` (341 impr), `lhci` (173 impr, wrong intent), `json size calculator` (120 impr on new tool page).
4. ✅ **Technical SEO sweep** — Sitemap clean: 141 URLs, 0 errors/warnings, last crawled Apr 7. GSC sync 544 days, healthy. Real CWV measurement on unlighthouse.dev itself deferred to standalone audit.
5. ✅ **Q2 priority ranking** written into `seo-strategy-2026.md`:
   - P1 Zero-click crisis (manual SERP audit, AI Overview investigation)
   - P2 Homepage traffic recovery
   - P3 Keyword cannibalization cleanup (lighthouse ci split across 2 pages)
   - P4 High-leverage content expansion
   - P5 Deferred items (cloud, compare, framework pages)
   - P6 Strategic bets (Spanish i18n, State of Web Perf report)
6. ✅ **seo-strategy-2026.md updated** with Q1 closeout section + Q2 plan.

---

## Striking Distance Priorities (Feb 27 data)

Ranked by potential clicks. These are keywords pos 4-20 with high impressions.

| Keyword | Impressions | Pos | Potential Clicks | Page | Action |
|---------|-------------|-----|------------------|------|--------|
| unlighthouse cli desktop flag | 948 | 4.5 | 142 | /guide/guides/device | CTR fix deployed Feb 27 |
| "--maxroutes" "unlighthouse" | 792 | 4.2 | 119 | /learn-lighthouse/bulk | CTR fix deployed Feb 27 |
| "--maxroutes" unlighthouse | 746 | 4.2 | 112 | /learn-lighthouse/bulk | CTR fix deployed Feb 27 |
| unlighthouse --desktop flag | 655 | 6.2 | 98 | /guide/guides/device | CTR fix deployed Feb 27 |
| "--ci" "unlighthouse" | 637 | 4.3 | 96 | /integrations/ci | Monitor |
| lighthouse cli | 582 | 7.8 | 87 | /integrations/cli | Rising, push to #5 |
| unlighthouse cli options --desktop | 493 | 4.7 | 74 | /guide/guides/device | CTR fix deployed Feb 27 |
| nuwave lighthouse latest version 2026 | 466 | 18.5 | 70 | — | IGNORE (wrong product) |
| unlighthouse --desktop | 388 | 4.7 | 58 | /guide/guides/device | CTR fix deployed Feb 27 |
| "optimizecss" "next.config.js" | 336 | 5.7 | 50 | /learn-lighthouse/lcp/render-blocking | CTR fix deployed Feb 27 |
| lighthouse speed index | 270 | 9.3 | 41 | /glossary/speed-index | Title fix deployed Feb 27 |
| unlighthouse cli desktop option | 228 | 5.4 | 34 | /guide/guides/device | CTR fix deployed Feb 27 |
| "optimizecss" experimental next.config.js | 214 | 7.2 | 32 | /learn-lighthouse/lcp/render-blocking | CTR fix + anchor heading deployed |
| "--max-routes" unlighthouse | 193 | 4.9 | 29 | /learn-lighthouse/bulk | CTR fix deployed Feb 27 |
| "--device desktop" "unlighthouse" | 177 | 4.4 | 27 | /guide/guides/device | CTR fix deployed Feb 27 |

**Summary:** ~6,000 impressions worth of desktop/maxRoutes queries now have optimized titles. If CTR goes from 0% → 5%, that's +300 clicks/month.

---

## Opportunity Keywords (not yet targeted)

| Keyword | Impressions | Pos | Score | Action |
|---------|-------------|-----|-------|--------|
| lighthouse continuous integration | 119 | 11.6 | 74 | Optimize CI page |
| dev lighthouse | 147 | 9.7 | 73 | Homepage already ranks, can ignore |
| bulk cwv tool | 147 | 7.2 | 69 | Optimize /tools or cwv-compare page |
| puppeteer launch options | 61 | 9.8 | 69 | Keywords added, monitor |
| PageSpeed API URLs | ~150 | 8-9 | 69 | Ensure API page targets these |

---

## March Success Criteria

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Monthly clicks | 2,000+ (28d) | GSC |
| CTR on desktop flag cluster | >3% | GSC keyword filter |
| CTR on maxRoutes cluster | >3% | GSC keyword filter |
| LCP hub CTR | >0.5% | GSC page filter |
| lighthouse cli position | <6 | GSC keyword |
| lighthouse report viewer position | <7 | GSC keyword |
| New keywords in top 10 | +10 vs Feb | GSC |

---

## Q2 Preview (if Q1 results warrant)

### Priority candidates:
1. **Framework pages** (Next.js, Nuxt first) — only if learn-lighthouse pages show we can rank for framework-adjacent queries
2. **Compare pages** (DebugBear, PageSpeed Insights) — only if cloud product exists
3. **New tools** based on traffic data:
   - Lighthouse score calculator (already ranking pos 5.8)
   - HAR file analyzer (DebugBear's #2 traffic source, 1,600 vol)
   - Page size checker (140 vol, low difficulty)
4. **Backlink campaign** — current domain rank limits our ceiling on competitive terms

---

*Review progress weekly. Pull GSC data every Friday. Next full review: March 27, 2026.*
