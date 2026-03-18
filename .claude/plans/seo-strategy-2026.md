# Unlighthouse SEO Strategy 2026

**Data-Driven Content Strategy to Capture DebugBear Traffic**

Generated: January 24, 2026
Last reviewed: March 4, 2026
Based on: 28-day GSC data with period-over-period comparison

---

## February 2026 Review

### Current State (Feb 27, 2026 — 28d window ending Feb 23)
| Metric | Feb 2026 | Jan 2026 | Change |
|--------|----------|----------|--------|
| Organic Clicks | 1,320 | 557 | **+137%** |
| Impressions | 77,062 | 4,867 | **+1,484%** |
| CTR | 1.7% | 2.14% | -0.4pp (diluted by new impressions) |
| Avg Position | 8.4 | 29.2 | **+20.8 positions** |
| Total Keywords | 897 | ~250 | **+3.6x** |

### What Worked
1. **learn-lighthouse content hub** — now generating 9,607 impressions for LCP alone, playwright content getting clicks from zero
2. **Tools gaining traction** — lighthouse-report-viewer: 1→35 clicks, cls-debugger: 1→17 clicks
3. **lighthouse cli** rising: pos 11→7.8, clicks 5→10
4. **lighthouse ci** rising: pos 14→11, clicks 0→3
5. **Brand growing** — "unlighthouse" clicks 568→737

### What Needs Work
1. **Desktop flag queries** — 4,000+ impressions, 0 clicks (CTR fix deployed Feb 27)
2. **maxRoutes queries** — 1,700+ impressions, 0 clicks (CTR fix deployed Feb 27)
3. **optimizeCss queries** — 550 impressions, 0 clicks (CTR fix deployed Feb 27)
4. **LCP hub** — 9,607 impressions but only 11 clicks (0.1% CTR, title fix deployed Feb 27)
5. **Speed Index** — 270 impressions, 1 click, pos 9.3 (title fix deployed Feb 27)

### Actions Taken (Feb 27)
- Deployed title/description/keyword fixes across 16 pages targeting 0% CTR clusters
- Added `### Next.js optimizeCss` anchor heading to render-blocking-resources page
- Added CLS Debugger internal link from CLS hub measurement section
- Files changed in both `~/pkg/unlighthouse/docs/` (4 files) and local content (12 files)
- **Internal linking pass:** Migrated `## Related` markdown sections → `relatedPages` frontmatter across ~81 learn-lighthouse pages. Hub pages got expanded cross-links (e.g., SEO↔Best Practices↔Accessibility). Sub-pages got glossary/tool links (LCP→/glossary/lcp, CLS→/tools/cls-debugger, INP→/glossary/inp). Added "Related Guides" section to bulk-pagespeed tool page. Added INP Analyzer inline link to INP hub measurement section. Added learn-lighthouse links to 3 external docs (device.md, ci.md, large-sites.md).
- **Active optimization pass (5 targets):**
  - Lighthouse Report Viewer: title → "Free Lighthouse Viewer - View JSON Reports Online", added "lighthouse viewer"/"lighthouse json viewer" targeting, added FAQ
  - Speed Index glossary: title → "Speed Index: What It Is, Good Scores & How to Improve", added keywords (speed index test/score/improve), added related links to score calculator + render-blocking fix. Updated both local and remote copies.
  - Puppeteer: title → "Puppeteer Launch Options for Lighthouse Audits", added keywords (puppeteer launch options list, puppeteer headless chrome), added Lighthouse CI related link
  - Lighthouse CI: title → "Lighthouse CI: Continuous Integration Performance Testing", added keywords (lighthouse continuous integration, lighthouse ci cd, lighthouse github actions, automate lighthouse), expanded description
  - Bulk CWV: /tools title → "Free Lighthouse & Core Web Vitals Tools", bulk-pagespeed title → "Bulk PageSpeed & Core Web Vitals Test", added "bulk core web vitals"/"bulk cwv test" keywords to learn-lighthouse guide
- **Fixed SSR build crash** on `/tools/bulk-pagespeed` — removed unconditional `v-motion` directive from upsell section that caused `Element is not defined` during prerender. Build now passes cleanly.

### Top Pages (Feb 2026)
| URL | Clicks | Impressions | CTR | Pos | vs Prev |
|-----|--------|-------------|-----|-----|---------|
| `/` | 981 | 6,012 | 16.3% | 11.9 | +280 clicks |
| `/integrations/cli` | 35 | 6,222 | 0.6% | 4.9 | +22 clicks |
| `/tools/lighthouse-report-viewer` | 35 | 2,424 | 1.4% | 9.5 | +34 clicks |
| `/guide/guides/authentication` | 26 | 933 | 2.8% | 5.3 | +12 clicks |
| `/guide/recipes/large-sites` | 22 | 2,274 | 1.0% | 5.6 | +16 clicks |
| `/tools/cls-debugger` | 17 | 496 | 3.4% | 9.5 | +16 clicks |
| `/learn-lighthouse/playwright` | 14 | 1,191 | 1.2% | 5.4 | NEW |
| `/tools` | 14 | 975 | 1.4% | 11.3 | NEW |
| `/learn-lighthouse/lcp` | 11 | 9,607 | 0.1% | 10.2 | NEW |

### Rising Keywords
| Keyword | Clicks | Pos | Prev Pos | Change |
|---------|--------|-----|----------|--------|
| lighthouse cli | 10 | 7.8 | 11.1 | -3.3 pos |
| lighthouse ci | 3 | 11.2 | 14.2 | -3.1 pos |
| lighthouse viewer | 1 | 9.5 | 17.2 | -7.8 pos |
| lighthouse scoring calculator | 2 | 5.8 | NEW | NEW |
| cls debugger | 5 | 5.2 | 5.6 | -0.3 pos |

### Geographic Shift
| Country | Clicks | Prev | Change |
|---------|--------|------|--------|
| Spain | 103 | 34 | **+69** |
| USA | 81 | 61 | +20 |
| India | 82 | 105 | -23 |
| Mexico | 40 | 14 | +26 |
| France | 38 | 18 | +20 |

Spain overtook India as #1. Latin America (Mexico, Argentina, Colombia) growing fast. Likely driven by Spanish-language queries hitting English content.

### Next Actions (March 2026)
1. **Monitor CTR fixes** — recheck desktop flag/maxRoutes/LCP clusters ~March 13-17 (2-3 weeks post-deploy)
2. **Monitor internal linking impact** — verify pill buttons render on hub/sub-pages, check if cross-links improve crawl depth
3. ~~**Push lighthouse-report-viewer**~~ ✅ DONE — title/desc optimized for "lighthouse viewer" + "lighthouse json viewer"
4. ~~**Speed Index page**~~ ✅ DONE — title/desc/keywords optimized, related links added (both local + remote)
5. ~~**Puppeteer launch options**~~ ✅ DONE — title/desc/keywords optimized for CTR
6. ~~**"lighthouse continuous integration"**~~ ✅ DONE — keywords + desc expanded for CI page
7. ~~**"bulk cwv tool"**~~ ✅ DONE — /tools page + bulk-pagespeed titles target "core web vitals", keywords added to learn guide
8. **PageSpeed API URLs** — 207 combined impressions (up from 150), pos 8-9, 0 clicks. Three URL variants: `pagespeedonline.googleapis.com` (81 imp), `www.googleapis.com/pagespeedonline` (69 imp), `www.googleapis.com pagespeedonline v5` (57 imp). Ensure pagespeed-insights-api page targets these exact URL patterns.
9. **Monitor active optimization impact** — recheck report-viewer, speed-index, puppeteer, CI, bulk-cwv positions ~March 13-17
10. **Create `/automation/github-actions`** — only missing page from March content calendar (Week 12). All other 7 pages already exist.
11. **"lcp meaning"** — NEW keyword, 80 impressions, pos 8.2 on /learn-lighthouse/lcp. Add "lcp meaning" to keywords frontmatter.
12. **"what is speed index in lighthouse"** — 58 impressions, pos 8.6. Ensure glossary/speed-index targets this phrase.
13. **"puppeteer evaluateonnewdocument localstorage"** — 133 impressions, pos 4.8 (already ranking well!). Niche but high-intent. Must add a dedicated section to puppeteer page.
14. **"lighthouse continuous integration"** — 119 impressions, pos 10.3 on /integrations/ci (improved from pos 18.9 prev period!). Keep monitoring, may need dedicated content push.
15. **"dev lighthouse"** — 147 impressions, pos 9.7, 0 clicks. Ambiguous intent but worth monitoring.

### March Content Calendar Status (checked Feb 27)
| Week | Content | Status | Notes |
|------|---------|--------|-------|
| 9 | `/learn-lighthouse/lcp/render-blocking-resources` | ✅ EXISTS | ~9.8 KB, comprehensive guide |
| 9 | `/learn-lighthouse/lcp/large-images` | ✅ EXISTS | ~11 KB, AVIF/WebP/srcset |
| 10 | `/learn-lighthouse/cls/images-without-dimensions` | ✅ EXISTS | ~10 KB (at `/cls/unsized-images`) |
| 10 | `/learn-lighthouse/cls/dynamic-content-injection` | ✅ EXISTS | ~14 KB, space reservation/skeletons |
| 11 | `/learn-lighthouse/inp/long-running-javascript` | ✅ EXISTS | ~10.7 KB, Workers/scheduler.yield |
| 11 | `/learn-lighthouse/inp/third-party-scripts` | ✅ EXISTS | ~10 KB, facade pattern/Partytown |
| 12 | `/automation/github-actions` | ✅ EXISTS | At `/learn-lighthouse/lighthouse-ci/github-actions` (~400 lines) |
| 12 | `/learn-lighthouse/pagespeed-insights-api` | ✅ EXISTS | ~6.2 KB, API overview |

**8/8 March content complete.** All pages exist (github-actions lives at `/learn-lighthouse/lighthouse-ci/github-actions`).

### New Keyword Opportunities (discovered Feb 27)
| Keyword | Impressions | Clicks | Pos | Page | Action |
|---------|-------------|--------|-----|------|--------|
| lcp meaning | 80 | 0 | 8.2 | /learn-lighthouse/lcp | Add to keywords frontmatter |
| what is speed index in lighthouse | 58 | 0 | 8.6 | /glossary/speed-index | Add to keywords frontmatter |
| puppeteer evaluateonnewdocument localstorage | 133 | 0 | 4.8 | /guide/guides/puppeteer | Already ranking well, add section |
| lighthouse continuous integration | 119 | 0 | 10.3 | /integrations/ci | Improved from pos 18.9! Monitor |
| dev lighthouse | 147 | 0 | 9.7 | / | Ambiguous intent, monitor |
| lighthouse scan | 50 | 0 | 9.0 | — | Only declining keyword (-0.6 pos) |
| bulk cwv tool | 147 | 0 | 7.2 | — | Fix deployed Feb 27, monitor |

### Movers & Shakers (Feb 27 — 28d)
**Rising (14 keywords):**
| Keyword | Clicks | Pos | Prev Pos | Change |
|---------|--------|-----|----------|--------|
| npx unlighthouse | 37 | 1.3 | 3.6 | **-2.3 pos** |
| lighthouse cli | 10 | 7.8 | 11.1 | **-3.3 pos** |
| lighthouse ci | 3 | 11.2 | 14.2 | **-3.1 pos** |
| lighthouse viewer | 1 | 9.5 | 17.2 | **-7.8 pos** |
| lighthouse scoring calculator | 2 | 5.8 | NEW | NEW |
| npx lighthouse | 7 | 4.5 | 5.0 | -0.5 pos |
| npm unlighthouse | 3 | 3.3 | 5.1 | -1.8 pos |
| lighthouse speed index | 1 | 9.3 | 10.1 | -0.7 pos |
| lighthouse report viewer | 2 | 7.0 | 6.9 | stable |

**Declining (1 keyword):**
| Keyword | Clicks | Pos | Prev Pos | Change |
|---------|--------|-----|----------|--------|
| lighthouse scan | 0 | 9.0 | 8.3 | +0.6 pos |

**Health: 14 rising vs 1 declining — strong upward trajectory.**

---

## March 2026 Review (March 4 Update)

### Current State (28d window ending March 4)
| Metric | March 4 | Feb 27 | Change |
|--------|---------|--------|--------|
| Organic Clicks | 1,389 | 1,320 | **+5.2%** |
| Impressions | 78,779 | 77,062 | **+2.2%** |
| Avg Position | 8.0 | 8.4 | **+0.4 positions** |
| Total Keywords | 930 | 897 | **+33** |

### Key Improvements
- **Homepage:** 1,036 clicks (+307 vs prev period)
- **`npx unlighthouse`:** 42 clicks (was 15), pos 1.6 — brand search exploding
- **`lighthouse cli`:** 15 clicks (was 5), pos 7.3 (was 10.8 in Jan, 7.8 in Feb)
- **`lighthouse ci`:** 4 clicks (was 0), pos 10.3 (was 14.2 in Jan, 11.2 in Feb), **-3.6 positions**
- **`cls debugger`:** 7 clicks (was 0), pos 5.2
- **`lcp meaning`:** pos 8.2 → **5.6** after keyword frontmatter addition — validates the approach
- **`lighthouse report`:** pos 54.2 → **37.8** — report viewer gaining authority
- **`lighthouse speed index`:** pos 10.1 → **9.0**, 1 click (was 0)

### New High-Impression Pages (not in Feb review)
| URL | Clicks | Impressions | CTR | Pos | Note |
|-----|--------|-------------|-----|-----|------|
| `/learn-lighthouse/accessibility/meta-viewport` | 5 | **1,889** | 0.3% | 8.3 | NEW opportunity — "zooming and scaling must not be disabled" |
| `/learn-lighthouse/cls` | 3 | **2,272** | 0.1% | 15.3 | CLS hub gaining impressions fast |
| `/learn-lighthouse/lcp/fix` | 4 | **1,266** | 0.3% | 10.1 | Fix guide getting traction |
| `/learn-lighthouse/lcp/lcp-lazy-loaded` | 3 | **1,315** | 0.2% | 7.7 | "avoid lazy-loading lcp image" |
| `/learn-lighthouse/best-practices/deprecations` | 2 | **751** | 0.3% | 8.1 | "uses deprecated apis" |
| `/learn-lighthouse/bulk-lighthouse-testing` | 4 | **986** | 0.4% | 4.6 | NEW — maxRoutes content landing here |

### New Keyword Signals
| Keyword | Impressions | Pos | Prev Pos | Note |
|---------|-------------|-----|----------|------|
| lighthouse seo | 542 | 28.0 | 79.0 | **-51 positions!** Huge jump, /learn-lighthouse/seo ranking |
| speed index | 275 | 28.2 | 30.8 | Head term starting to appear |
| cumulative layout shift | 138 | 62.9 | 72.0 | Crawling up slowly |
| google lighthouse | 326 | 46.3 | 47.7 | Stable, very competitive |
| lighthouse report | 149 | 37.8 | 54.2 | **-16.4 positions** — report viewer working |
| speed index web performance metric | 154 | 24.4 | NEW | Long-tail appearing |
| largest contentful paint optimization best practices 2026 | 66 | 8.7 | NEW | Time-stamped query, good sign |

### Critical Problem: CLI Flag Query Mismatch (0% CTR Crisis)
~5,000+ impressions across desktop flag/maxRoutes/optimizeCss queries with **ZERO clicks** despite title/meta fixes deployed Feb 27. Users are searching for Unlighthouse-specific CLI options but landing on mismatched educational pages:
*   `unlighthouse cli desktop flag` → lands on `/learn-lighthouse/seo` (Should be `/guide/guides/device`)
*   `unlighthouse --desktop` → lands on `/tools/lighthouse-report-viewer`
*   `--maxroutes` → lands on `/learn-lighthouse/bulk-lighthouse-testing`

### AI Overviews (SGE) Presence
SERP analysis shows active AI Overviews for our targets:
*   `lighthouse cls culprits`: We rank #4 organically with `/tools/cls-debugger` (DevTools #1, DebugBear #2). Triggers AI Overview.
*   `long animation frames javascript`: We don't rank. DebugBear #3. Triggers AI Overview.

---

## Executive Summary

### Baseline (Jan 2026)
| Metric | Value | vs Previous 28d |
|--------|-------|-----------------|
| Organic Clicks | 557 | -2.6% (-15) |
| Impressions | 4,867 | +42% (+1,446) |
| CTR | 2.14% | -28% |
| Avg Position | 29.2 | -0.4 |
| Estimated Monthly Traffic | 128 | Stable |
| Domain Rank | 31 | - |

### Competitor Comparison
| Domain | Monthly Traffic | Top Traffic Source |
|--------|----------------|-------------------|
| **debugbear.com** | **108,000** | /test/website-speed (88,725) |
| pagespeed.web.dev | 374,790 | / (374,790) |
| speedvitals.com | 4,238 | / (declining -20%) |
| calibreapp.com | 3,316 | / (2,513) |
| **unlighthouse.dev** | **1,389** | / (1,036) |

**Gap to close: 100x traffic increase to match DebugBear**

### Key Insight
DebugBear's traffic is **69% from one page**: `/test/website-speed`. Their strategy is **free tools → paid conversion**. We must replicate this with `/tools/bulk-pagespeed` and similar.

---

## Q2 2026 Advanced Strategy & Competitive Intelligence
Based on deep-dive market research (March 2026), our basic SEO foundation is solid, but to close the traffic gap with DebugBear and grow DR 30 → 60+, we must execute advanced, niche-specific strategies.

### 1. Competitive Landscape & Monetization Funnels
The web performance tool space has fractured into specific go-to-market strategies:
*   **DebugBear (Traffic: 108k, DR 81):** Moving aggressively upmarket. They are expanding into broad browser dev tools content (`/docs/net-internals` is now driving 7.6k traffic, `/blog/use-chrome-devtools` 1.9k) and general site health (`/website-seo-checker` 4k traffic, `/test/website-down-checker` 2k traffic).
    *   **Our Counter-Play:** Do NOT follow them into generic browser dev tools. They have DR 81 to rank for those broad terms; we have DR 31. We must stay laser-focused on the "bulk performance / CI automation" niche where we have the product advantage.
*   **SpeedVitals (Traffic: ~4.2k, DR 62):** Declining (-20%). Their traffic is much smaller than previously thought.
*   **Calibre (Traffic: 3.3k, DR 68):** Heavily focused on Enterprise CI/CD and GitHub pipeline integration.
*   **Our Opportunity:** DebugBear has largely abandoned the "free bulk testing / CLI" narrative. We can aggressively capture bottom-of-funnel developer intent by positioning as the ultimate *local* and *bulk* alternative that doesn't require SaaS vendor lock-in.

### 2. Emerging Keyword Research Data (2025-2026)
With Lighthouse 13 (Oct 2025) and the full replacement of FID by INP, search volumes have shifted. Target these emerging clusters:
*   **LoAF (Long Animation Frames):** The new standard for INP debugging.
    *   SERP for "long animation frames javascript": Chrome DevTools #1, MDN #2, **DebugBear #3**, SpeedCurve #4 — we don't rank (gap!)
    *   Triggers AI Overview — AEO opportunity
    *   **Validated volume:** ~150-200/mo for exact phrase. "LoAF" <50/mo (overlaps "loaf of bread"). Real demand sits at parent topic "Interaction to Next Paint" (~5K/mo). Use LoAF as secondary keyword within INP guides, not standalone.
*   **Lighthouse 13 "Insights" (New Terminology):**
    *   SERP for "lighthouse cls culprits": Chrome DevTools #1, DebugBear #2, web.dev #3, **unlighthouse.dev #4** — already ranking!
    *   Triggers AI Overview
    *   ⚠️ Volume unverified. The SERP exists and we rank, so worth targeting regardless.
*   **High-Intent "Vs" Queries:**
    *   ⚠️ Volumes unverified. DataForSEO returned no results for "lighthouse ci vs debugbear" or "unlighthouse vs calibre". May be too low volume to track but high-intent for conversion.

### 3. Content Format Gaps & Programmatic SEO (pSEO)
Generic "How to fix LCP in React" articles are saturated. Developer tool SEO in 2026 is driven by **Utility-First Assets**:
*   **Programmatic SEO (Data-Driven Benchmarks):** Instead of thin framework pages, run Unlighthouse across the top 1,000 open-source Next.js and Nuxt templates. Auto-generate pages: `"Next.js Boilerplate Core Web Vitals Benchmarks 2026"`. This provides highly linkable *original data*.
*   **Interactive Mini-Tools:** DebugBear drives traffic with basic, un-gated utilities. We should build:
    *   `unlighthouse.config.ts` visual builder (Vol: 200/mo for "lighthouse config generator").
    *   Standalone JSON-to-Lighthouse-Report diff tool.

### 4. International / Multilingual SEO (Spain/LatAm Surge)
Our GSC data shows Spain overtaking India, with Mexico/LatAm surging.
*   **Validated keyword volumes (Ahrefs/Semrush via Gemini):**
    *   `prueba de velocidad web`: 1,500-2,500/mo — BUT KD 40+ and saturated by PSI/GTmetrix/Pingdom. **Do NOT target.**
    *   `rendimiento web`: 1,500-2,500/mo global, ~400-600/mo Spain. KD 30-40.
    *   `core web vitals que es`: 150-300/mo Spain. KD 15-20. **Sweet spot.**
    *   `auditoria lighthouse`: 100-250/mo Spain. KD 25. **Targetable.**
    *   `lighthouse puntuacion`: <50/mo. Skip.
*   **The Play:** Do NOT translate generic tool pages — you won't outrank Google PSI or GTmetrix for broad Spanish speed test queries. Instead target the **technical B2B gap**: translate `/tools/cls-debugger` and specific glossary pages (CLS, LCP, INP, CWV), optimizing for `auditoria lighthouse` and `core web vitals que es`. Currently dominated by generic SEO marketing agencies writing surface-level content — our utility tools will easily outrank them.
*   **Implementation:** Nuxt i18n for `/es/tools/cls-debugger`, `/es/glossary/lcp`, `/es/glossary/cls`, `/es/glossary/inp`, `/es/learn-lighthouse/core-web-vitals`

### 5. Link Building: The DR 30 → 60 Playbook
Generic link building (guest posts) fails for dev tools. Case studies of tools like *Plausible Analytics* (DR 40->75 in 18 months) show they grew via "David vs Goliath" transparency and open-source integrations.
*   **"State of Web Performance" Report:** Publish an annual report using our CLI data (e.g., "We ran Lighthouse on the Top 10,000 Shopify sites. Here are the average scores"). This is a "Link Magnet" for newsletters like *TLDR Web Dev* and *Cooperpress*.
*   **Integration Ecosystem Links:** Create dedicated PRs to get Unlighthouse listed in high DA repos: `awesome-vite`, `awesome-nuxt`, `awesome-vue`.
*   **Marketplace Listings:** Ensure official listings on GitHub Actions Marketplace and npm with back-links directly to `/learn-lighthouse` deep pages, not just the homepage.

### 6. SERP Features & AI Overviews (SGE)
Google's AI Overviews heavily favor "Atomic Answers" for informational queries, while traditional rich snippets dominate tool queries.
*   **Targeting People Also Ask (PAA):** Implement strict `FAQPage` schema on `/compare/pagespeed-insights` to specifically target the highly visible PAA question: *"Why is my Lighthouse score different from PageSpeed Insights?"*
*   **The 50-Word AEO Rule:** For our INP and LoAF glossary pages, immediately follow the `H2` with a 40-50 word bolded summary. AI Overviews extract these "information blocks" almost verbatim when citing developer documentation.

---

## Part 1: GSC Performance Analysis

### Top Performing Pages (28 days)
| URL | Clicks | Impressions | CTR | Pos | Trend |
|-----|--------|-------------|-----|-----|-------|
| `/` | 653 | 3,584 | 18.2% | 17.6 | -57 clicks |
| `/integrations/ci` | 23 | 1,143 | 2.6% | 9.4 | +9 clicks |
| `/guide/getting-started/unlighthouse-cli` | 19 | 1,469 | 1.5% | 6.4 | +3 clicks |
| `/api-doc/config` | 18 | 645 | 3.5% | 6.6 | stable |
| `/guide/guides/generating-static-reports` | 14 | 533 | 2.3% | 7.3 | +2 clicks |

**Observation:** Homepage losing traffic (-57 clicks), but CI and CLI pages growing. Documentation is becoming discoverable.

### Top Keywords (28 days)
| Keyword | Clicks | Impressions | CTR | Position |
|---------|--------|-------------|-----|----------|
| unlighthouse | 520 | 2,436 | 21.5% | 3.0 |
| npx unlighthouse | 16 | 47 | 40.0% | 2.3 |
| unlight house | 12 | 36 | 44.4% | 1.9 |
| npx lighthouse | 3 | 56 | 4.7% | 5.3 |
| lighthouse cli | 2 | 245 | 0.4% | 10.8 |
| bulk pagespeed insights | 1 | 5 | 16.7% | 14.3 |

**Observation:** Brand keywords dominate. Non-brand keywords have huge impression-to-click gaps.

### Striking Distance Keywords (Position 4-20, High Impressions)
| Keyword | Pos | Impressions | Potential Clicks | Action |
|---------|-----|-------------|------------------|--------|
| lighthouse cli | 10.8 | 245 | 37 | Dedicated page |
| nuwave lighthouse latest version 2026 | 15.7 | 121 | 18 | Ignore (wrong intent) |
| lighthouse dev | 8.7 | 77 | 8 | Homepage optimization |
| lighthouse cli documentation | 8.9 | 54 | 5 | CLI page optimization |

### Rising Keywords (Improving Position)
| Keyword | Position Change | Current Pos |
|---------|----------------|-------------|
| lighthouse cli | -6.3 positions | 10.8 |
| lighthouse scan | -0.3 positions | 8.6 |
| npx lighthouse | -0.3 positions | 5.3 |

**No declining keywords** - healthy trajectory.

---

## Part 2: Competitive Intelligence

### DebugBear Keyword Analysis

**Top Ranking Keywords (Position 1-2):**
| Keyword | Volume | Traffic | DebugBear URL |
|---------|--------|---------|---------------|
| website speed test free | 590 | 74 | /test/website-speed |
| free website speed test | 590 | 74 | /test/website-speed |
| basic auth | 2,900 | 470 | /basic-auth-header-generator |
| har analyzer | 2,400 | 389 | /har-file-analyzer |
| json size calculator | 260 | 79 | /json-size-analyzer |
| core web vitals checker | 90 | 15 | /test/core-web-vitals |
| pagespeed insights vs lighthouse | 170 | 52 | /blog/why-is-my-lighthouse-score-different-from-pagespeed-insights |

**DebugBear's Strategy Decoded:**
1. **Free tools drive 69% of traffic** - website-speed test alone = 88,725/month
2. **Utility tools for related problems** - basic auth, HAR analyzer, JSON size
3. **Educational content positions product** - "lighthouse vs pagespeed" etc.
4. **Framework comparisons** - "nuxt vs next" ranks #1

### Keywords DebugBear Owns That We Should Target
| Keyword | Volume | Difficulty | DebugBear Position | Opportunity |
|---------|--------|------------|-------------------|-------------|
| core web vitals checker | 90 | 20 | #3 | `/tools/cwv-checker` |
| lighthouse test automation | 30 | 15 | #3 | `/automation/` |
| lcp render delay | 70 | 25 | #1 | `/learn-lighthouse/lcp/render-delay` |
| cdn checker | 140 | 30 | #2 | `/tools/cdn-checker` |
| page size checker | 140 | 25 | #1 | `/tools/page-size` |
| free website grader | 110 | 30 | #2 | `/tools/website-grader` |

### SERP Analysis: Key Target Keywords

**"bulk lighthouse test"** - WE RANK #1!
```text
#1 unlighthouse.dev/guide/recipes/large-sites ✓
#2 pagespeedplus.com
#3 debugbear.com/software/lighthouse-automation
#4 experte.com/pagespeed
```
**Action:** Expand this page, add more internal links, protect ranking.

**"lighthouse cli"** - We rank #11
```text
#1 github.com/GoogleChrome/lighthouse
#2 developer.chrome.com
#3 oxyplug.com (weak competitor)
...
#11 unlighthouse.dev/guide/getting-started/unlighthouse-cli
```
**Action:** Create dedicated `/learn-lighthouse/lighthouse-cli` hub with comparison to Unlighthouse CLI.

**"core web vitals tool"** - We don't rank
```text
#1 pagespeed.web.dev
#2 support.google.com
#3 debugbear.com/test/core-web-vitals ← Target position
#4 speedvitals.com
```
**Action:** Create `/tools/cwv-checker` to compete directly.

---

## Part 3: Keyword Opportunity Analysis

### Tier 1: Low Difficulty, High Intent (Priority)
| Keyword | Volume | Difficulty | Intent | Target URL |
|---------|--------|------------|--------|------------|
| how to fix cumulative layout shift | 30 | **8** | info | `/learn-lighthouse/cls` |
| how to fix largest contentful paint | 30 | **16** | info | `/learn-lighthouse/lcp` |
| what is interaction to next paint | 30 | **20** | info | `/glossary/inp` |
| cumulative layout shift fix | 10 | **27** | transactional | `/learn-lighthouse/cls` |
| is pagespeed insights reliable | 30 | **3** | info | `/compare/pagespeed-insights` |

### Tier 2: Medium Volume, Moderate Difficulty
| Keyword | Volume | Difficulty | Intent | Target URL |
|---------|--------|------------|--------|------------|
| pagespeed insights vs lighthouse | 170 | 23 | info | `/compare/pagespeed-insights` |
| pagespeed insights api | 210 | 24 | info | `/learn-lighthouse/pagespeed-insights-api` |
| core web vitals optimization | 50 | 31 | commercial | `/learn-lighthouse/core-web-vitals` |
| what is largest contentful paint | 140 | 34 | info | `/glossary/lcp` |
| what is cumulative layout shift | 110 | 30 | info | `/glossary/cls` |

### Tier 3: High Volume, Long-term Targets
| Keyword | Volume | Difficulty | Timeline |
|---------|--------|------------|----------|
| render blocking resources | 720 | 35 | 6 months |
| core web vitals | 2,900 | 55 | 12 months |
| largest contentful paint | 1,000 | 45 | 9 months |
| cumulative layout shift | 590 | 44 | 9 months |

---

## Part 4: Traffic Strategy

### The DebugBear Playbook (Adapted)

**Their Model:**
```text
Free Tool (88K visits) → Upsell to Paid Monitoring ($49-$199/mo)
```

**Our Model:**
```text
Free Tool (target: 10K visits) → Unlighthouse CLI (free) → Cloud (pay-per-scan)
```

### Traffic Acquisition Channels

**1. Free Tools (Primary - 60% of traffic goal)**
Target: 60,000 monthly visits by end of 2026

| Tool | Target Keyword | Monthly Volume | Target Position |
|------|---------------|----------------|-----------------|
| `/tools/bulk-pagespeed` | bulk pagespeed test | 50 | #1 |
| `/tools/cwv-checker` | core web vitals test | 90 | #3 |
| `/tools/lcp-finder` | lcp element finder | 20 | #1 |
| `/tools/cls-debugger` | cls debugger | 10 | #1 |
| `/tools/lighthouse-score-calculator` | lighthouse score calculator | 90 | #5 |
| `/tools/page-size-checker` | page size checker | 140 | #5 |

**2. Educational Content (Secondary - 30% of traffic goal)**
Target: 30,000 monthly visits

| Pillar | Pages | Monthly Volume Target |
|--------|-------|----------------------|
| Core Web Vitals | 15+ | 15,000 |
| Framework Guides | 24 | 8,000 |
| Comparison Pages | 5 | 5,000 |
| Glossary | 8 | 2,000 |

**3. Documentation (Tertiary - 10% of traffic goal)**
Target: 10,000 monthly visits

Optimize existing docs for:
- lighthouse cli (245 impressions/mo)
- lighthouse ci (170 volume)
- puppeteer launch options (80 volume)

---

## Part 5: Content Calendar 2026

### Q1 2026 (Jan-Mar): Foundation

**January (Week 1-4):**
| Week | Content | Type | Target Keyword |
|------|---------|------|----------------|
| 1 | `/cloud` + `/cloud/pricing` | Landing | unlighthouse cloud |
| 1 | `/tools/bulk-pagespeed` | Tool | bulk pagespeed test |
| 2 | `/compare/debugbear` | Comparison | debugbear alternative |
| 2 | `/tools/cwv-checker` | Tool | core web vitals test |
| 3 | `/learn-lighthouse/core-web-vitals` | Pillar | core web vitals |
| 3 | `/glossary/lcp` | Glossary | what is lcp |
| 4 | `/glossary/cls` | Glossary | what is cls |
| 4 | `/glossary/inp` | Glossary | what is inp |

**February (Week 5-8):**
| Week | Content | Type | Target Keyword |
|------|---------|------|----------------|
| 5 | `/learn-lighthouse/lcp` | Metric Hub | largest contentful paint |
| 5 | `/tools/lcp-finder` | Tool | lcp element finder |
| 6 | `/learn-lighthouse/cls` | Metric Hub | cumulative layout shift |
| 6 | `/tools/cls-debugger` | Tool | cls debugger |
| 7 | `/learn-lighthouse/inp` | Metric Hub | interaction to next paint |
| 7 | `/tools/inp-analyzer` | Tool | inp analyzer |
| 8 | `/compare/pagespeed-insights` | Comparison | pagespeed vs lighthouse |

**March (Week 9-12):**
| Week | Content | Type | Target Keyword |
|------|---------|------|----------------|
| 9 | `/learn-lighthouse/lcp/render-blocking-resources` | Fix | render blocking resources |
| 9 | `/learn-lighthouse/lcp/large-images` | Fix | optimize lcp images |
| 10 | `/learn-lighthouse/cls/images-without-dimensions` | Fix | images without dimensions |
| 10 | `/learn-lighthouse/cls/dynamic-content-injection` | Fix | dynamic content cls |
| 11 | `/learn-lighthouse/inp/long-running-javascript` | Fix | long running javascript |
| 11 | `/learn-lighthouse/inp/third-party-scripts` | Fix | third party scripts |
| 12 | `/automation/github-actions` | Tutorial | lighthouse ci github actions |
| 12 | `/learn-lighthouse/pagespeed-insights-api` | Guide | pagespeed api |

**Q1 Total: 24 content pieces**

### Q2 2026 (Apr-Jun): Educational Depth & Utility Tools
*Pivot strategy: Abandon "framework breadth" (low impression volume). Double down on `learn-lighthouse` depth and new tool utilities (high impression volume).*

**1. CLI Reference Page (April - Week 13/14) — CRITICAL**
Fix the 5,000+ impression / 0% CTR crisis. Google routes flag queries to educational pages because we lack a dense, structured reference page.
- **Research (validated):** Vite uses `/guide/cli.html` with every flag as `### --flag` anchor. Vercel CLI uses markdown tables (`| Flag | Shorthand | Description |`). Google's parser recognizes these as "dictionary of commands" and prefers them over incidental paragraph mentions.
- **Action:** Create `/guide/getting-started/cli-reference` with:
  - Every flag as `### --[flag]` heading (anchor targets)
  - Markdown tables for flag groups (Global Options, Lighthouse Options, etc.)
  - `SoftwareApplication` schema
- **Fix mismatched pages:** On `/learn-lighthouse/seo`, `/tools/lighthouse-report-viewer`, and other pages with incidental flag mentions, convert bare `--desktop` text into links pointing to the reference page anchors. This tells Google the reference page is the canonical source for flag queries.

**2. Learn-Lighthouse Depth: LoAF & Lighthouse 13 (April/May)**
Target emerging topics, but calibrate effort to actual volume:
- **LoAF reality check (validated):** "long animation frames" = ~150-200/mo. "LoAF" <50/mo (overlaps with bread). The real volume sits at "Interaction to Next Paint" (~5K/mo). **Do NOT build Q2 around LoAF as standalone topic.**
- **Action:** Add LoAF section to existing `/learn-lighthouse/inp` pages. Title pattern: "How to Debug INP Using Long Animation Frames (LoAF)". Devs search "fix INP" and discover LoAF as the solution, not the reverse.
- Optimize `/tools/cls-debugger` title/desc for "lighthouse cls culprits" — we already rank #4, push to #2
- Update existing LH content with Lighthouse 13 "Insights" terminology (CLS Culprits, Image Delivery, etc.)
- **Higher-ROI new content:** Focus on actual high-impression topics from GSC — meta-viewport (1,889 impr), lcp-lazy-loaded (1,315 impr), deprecated APIs (751 impr)

**3. New Free Tools (May/June)**
Avoid generic "SEO checkers". Stick to the CWV/Lighthouse niche:
- `/tools/lighthouse-config-generator` (Visual builder for `unlighthouse.config.ts` - Vol: ~200/mo high intent).
- `/tools/har-analyzer` (Matches DebugBear's successful standalone utility model).

**4. Spanish Market Validation (June)**
Address the LatAm/Spain surge without diluting the domain:
- **Action:** Implement Nuxt i18n *only* for `/es/tools/bulk-pagespeed`, `/es/tools/cls-debugger`, and the top 5 `/es/glossary/*` pages.
- **Targets:** `prueba de velocidad web` (Vol: ~14K, KD: 15) and `auditoria lighthouse` (Vol: ~1.2K, KD: 9). Do not translate the whole site.

**Q2 Total: High-Utility Assets > Volume of Pages**

### Q3 2026 (Jul-Sep): Authority Building

**Focus Areas:**
- Complete remaining framework guides (Svelte, SvelteKit, Angular for CLS/INP)
- Individual fix pages for all causes
- Tool-focused content ("best X tools" listicles)
- Guest posting / backlink acquisition

**Q3 Total: 20 content pieces**

### Q4 2026 (Oct-Dec): Optimization & Expansion

**Focus Areas:**
- Content refresh based on GSC data
- New tool development based on user feedback
- International SEO (if warranted)
- Video content for YouTube/embed

**Q4 Total: 15 content pieces**

---

## Part 6: Technical SEO Priorities

### Immediate Actions (Week 1)

**1. Page Title Optimizations:**
```text
Current: "Unlighthouse CLI - Site-Wide Lighthouse"
Optimized: "Lighthouse CLI Alternative: Scan Entire Sites | Unlighthouse"
```

**2. Meta Description Updates:**
```text
Current: (missing or generic)
Optimized: "Run Lighthouse on your entire website with one command.
Free CLI tool for bulk performance audits. No rate limits, no API keys."
```

**3. Internal Linking Audit:**
- ~~Add "lighthouse scan" anchor text to CLI page~~ ✅
- ~~Link from all guide pages to `/tools/`~~ ✅ (bulk-pagespeed → learn-lighthouse guides)
- ~~Migrate `## Related` → `relatedPages` frontmatter~~ ✅ (81 pages, Feb 27)
- ~~Add glossary/tool cross-links to sub-pages~~ ✅ (LCP→glossary, CLS→debugger, INP→glossary)
- Add breadcrumbs for hierarchy signals

### Schema Markup (Week 2)

**Add to all pages:**
- `WebPage` schema
- `BreadcrumbList` schema
- `FAQPage` schema (for guide pages)
- `SoftwareApplication` schema (for CLI/tools)
- `HowTo` schema (for fix guides)

### Site Speed (Ongoing)

Current PageSpeed score: [measure]
Target: 95+ on all pages

Key actions:
- Preload critical fonts
- Lazy load below-fold images
- Inline critical CSS
- Defer non-critical JS

---

## Part 7: Backlink Strategy

### Current State
- Domain Rank: 31
- DebugBear Domain Rank: 81

### Target Backlink Sources

**1. Developer Resource Pages**
- GitHub awesome lists (awesome-lighthouse, awesome-performance)
- Dev.to resource compilations
- Framework documentation (Nuxt, Next.js mentions)

**2. "Best Tools" Listicles**
Target articles:
- "Best Core Web Vitals tools"
- "Best Lighthouse automation tools"
- "Best website speed testing tools"

**3. Educational Institutions**
- Web development courses
- CS department resources

**4. Comparison Mentions**
When people compare tools, we want to be included:
- "DebugBear vs alternatives"
- "PageSpeed Insights alternatives"
- "Lighthouse CI alternatives"

### Link Building Tactics

**Q1 2026:**
- HARO responses (performance/SEO topics)
- Broken link building on web performance pages
- Guest posts on dev blogs (3-4 posts)

**Q2-Q4 2026:**
- Tool directory submissions
- Podcast appearances (web dev shows)
- Conference speaking (performance topics)

---

## Part 8: Content Specifications

### Pillar Page Template (2,500-4,000 words)

**Structure:**
```markdown
# [Keyword] - Complete Guide [Current Year]

## Quick Answer (Featured Snippet Bait)
[50-100 word direct answer]

## Table of Contents

## What is [Topic]?
[Definition, context, why it matters]

## How to Measure [Topic]
[Tools, methods - mention Unlighthouse naturally]

## Common Problems and Fixes
### Problem 1
### Problem 2
### Problem 3

## [Topic] by Framework
- Next.js considerations
- Nuxt considerations
- React considerations
[Link to framework-specific pages]

## Tools and Resources
[Curated list including Unlighthouse]

## FAQ
[4-6 questions, use schema markup]

## Next Steps
[Soft CTA to Unlighthouse CLI or Cloud]
```

### Tool Page Template

**Structure:**
```markdown
# [Tool Name] - Free [Keyword] Tool

[Tool embed/interface]

## How to Use This Tool
1. Enter your URL
2. Click Analyze
3. Review results

## What This Tool Shows You
[Explain each metric]

## Common Issues and How to Fix Them
[Link to relevant /learn-lighthouse/ content]

## Scan Your Entire Site
[CTA to Unlighthouse CLI/Cloud]
```

### Comparison Page Template

**Structure:**
```markdown
# [Tool A] vs [Tool B]: Which Should You Use?

## Quick Comparison Table
| Feature | Tool A | Tool B | Unlighthouse |
|---------|--------|--------|--------------|

## What is [Tool A]?
## What is [Tool B]?
## Key Differences

## When to Use [Tool A]
## When to Use [Tool B]
## When to Use Unlighthouse

## Pricing Comparison
## Verdict
```

---

## Part 9: Measurement Framework

### Weekly Metrics
- GSC clicks and impressions
- Keyword position changes
- New keywords discovered

### Monthly Metrics
| Metric | Baseline (Jan 2026) | Feb 2026 | Q1 Target | Status |
|--------|---------------------|----------|-----------|--------|
| Organic clicks | 557/28d | **1,320/28d** | 1,000/28d | ✅ **EXCEEDED** (+137%) |
| Impressions | 4,867/28d | **77,062/28d** | — | **+1,484%** |
| Keywords total | ~250 | **897** | — | **+3.6x** |
| Keywords in top 10 | 3 | ~15+ | 10 | ✅ **EXCEEDED** |
| Keywords in top 30 | 15 | ~50+ | 40 | ✅ **EXCEEDED** |
| Avg Position | 29.2 | **8.4** | — | **+20.8 positions** |
| Domain Rank | 31 | [check] | 35 | — |

**Q1 targets already met in February.** Revised Q2 targets needed at March review.

### Quarterly Reviews
- Content performance audit
- Keyword gap analysis refresh
- Competitor monitoring
- Strategy adjustment

---

## Part 10: Implementation Priorities

### Current Priority (March remaining + April 2026)
1. **CRITICAL:** Fix 0% CTR CLI flag crisis. Create `/guide/getting-started/cli-reference` with `### --flag` anchors and markdown tables (Vite/Vercel pattern). Convert incidental flag mentions on mismatched pages into links to the reference page.
2. **Quick CTR wins:** Optimize `/tools/cls-debugger` for "lighthouse cls culprits" (we rank #4). Optimize meta-viewport page (1,889 impressions, only 5 clicks).
3. **AEO Formatting:** Restructure top glossary pages (INP, CLS, LCP) using the "50-Word Rule" — question-based H2 followed by 40-50 word bolded answer. Both "lighthouse cls culprits" and "long animation frames" SERPs show AI Overviews.
4. **LoAF as INP subsection:** Add "Debugging INP with Long Animation Frames (LoAF)" section to existing INP pages. Do NOT create standalone LoAF page (only 150-200/mo volume).
5. **Spanish pilot:** Translate `/tools/cls-debugger` + 3 glossary pages (CLS, LCP, INP) to Spanish. Target `core web vitals que es` (150-300/mo, KD 15-20) and `auditoria lighthouse` (100-250/mo, KD 25).

### Completed (Q1 2026)
1. ~~Create `/tools/bulk-pagespeed`~~ ✅ DONE
2. ~~Update CLI page title/meta for "lighthouse cli"~~ ✅ DONE (rising: pos 11→7.3)
3. ~~Add structured data to key pages~~ ✅ DONE (FAQPage on tool pages)
4. ~~Create `/learn-lighthouse/` content hub~~ ✅ DONE (LCP, CLS, INP, SEO, A11y, Best Practices, Playwright, Lighthouse CI)
5. ~~Create glossary pages~~ ✅ DONE (LCP, CLS, INP, FCP, Speed Index, TBT, TTFB)
6. ~~CTR fixes for 0-click high-impression clusters~~ ✅ DONE (Feb 27 — 16 pages)
7. ~~Internal linking pass — `## Related` → `relatedPages` frontmatter~~ ✅ DONE (Feb 27 — 81 pages + bulk-pagespeed)
8. ~~Individual fix guides~~ ✅ DONE (25+ fix guides across LCP/CLS/INP/A11y/BP/SEO)
9. ~~CI/CD content~~ ✅ DONE (Lighthouse CI hub with 6 pages)
10. ~~PageSpeed API guide~~ ✅ DONE

### Ongoing
1. Weekly GSC monitoring (focus on AI Overviews and Desktop Flag CTR recovery)
2. Mid-month data review: **March 13-17** (measure Feb 27 fix impact)
3. Monthly content audits (next full review: **March 27, 2026**)
4. Quarterly strategy reviews

---

## Appendix A: Full Keyword List

### Brand Keywords
| Keyword | Volume | Position | Trend |
|---------|--------|----------|-------|
| unlighthouse | 390 | 1 | Stable |
| npx unlighthouse | 50 | 2 | Stable |
| unlight house | 40 | 2 | Stable |

### Target Keywords by Priority
| Keyword | Volume | Diff | Priority | Content |
|---------|--------|------|----------|---------|
| render blocking resources | 720 | 35 | High | /learn-lighthouse/lcp/render-blocking-resources |
| pagespeed insights api | 210 | 24 | High | /learn-lighthouse/pagespeed-insights-api |
| pagespeed insights vs lighthouse | 170 | 23 | High | /compare/pagespeed-insights |
| long running javascript | 170 | 25 | High | /learn-lighthouse/inp/long-running-javascript |
| what is largest contentful paint | 140 | 34 | Medium | /glossary/lcp |
| page size checker | 140 | 25 | High | /tools/page-size-checker |
| what is cumulative layout shift | 110 | 30 | Medium | /glossary/cls |
| lighthouse cli | 110 | 40 | Medium | /learn-lighthouse/lighthouse-cli |
| images without dimensions | 90 | 20 | High | /learn-lighthouse/cls/images-without-dimensions |
| core web vitals test | 90 | 25 | High | /tools/cwv-checker |
| core web vitals optimization | 50 | 31 | Medium | /learn-lighthouse/core-web-vitals |
| how to fix largest contentful paint | 30 | 16 | High | /learn-lighthouse/lcp |
| how to fix cumulative layout shift | 30 | 8 | High | /learn-lighthouse/cls |
| is pagespeed insights reliable | 30 | 3 | High | /compare/pagespeed-insights |

---

## Appendix B: Competitor Top Keywords

### DebugBear Keywords We Can Target
| Keyword | Volume | DB Position | Difficulty | Our Opportunity |
|---------|--------|-------------|------------|-----------------|
| basic auth header | 480 | 2 | 30 | Low priority |
| har file analyzer | 1,600 | 2 | 35 | /tools/har-analyzer |
| json size calculator | 260 | 1 | 25 | /tools/json-size |
| core web vitals checker | 90 | 2 | 25 | /tools/cwv-checker |
| page size checker | 140 | 1 | 25 | /tools/page-size |
| cdn checker | 140 | 2 | 30 | /tools/cdn-checker |
| lcp render delay | 70 | 1 | 25 | /learn-lighthouse/lcp/render-delay |
| intrinsic size vs rendered size | 70 | 1 | 20 | /learn-lighthouse/images |
| nuxt vs next | 110 | 1 | 30 | /compare/nuxt-vs-nextjs |

---

## Appendix C: Geographic Data

### Top Countries by Traffic (28 days)
| Country | Clicks | % of Total | Trend |
|---------|--------|------------|-------|
| India | 100 | 18.0% | +26 |
| USA | 55 | 9.9% | +6 |
| Germany | 29 | 5.2% | -3 |
| Spain | 27 | 4.8% | -9 |
| UK | 26 | 4.7% | -5 |
| Canada | 17 | 3.1% | +6 |
| Brazil | 16 | 2.9% | +8 |
| France | 15 | 2.7% | -20 |

**Observation:** India is #1 and growing. Must:
- More developer-focused content
- Pricing consideration for cloud (PPP)
- No localization needed (English works)

### Device Split
| Device | Clicks | % | CTR |
|--------|--------|---|-----|
| Desktop | 520 | 93.4% | 12.3% |
| Mobile | 37 | 6.6% | 7.7% |
| Tablet | 0 | 0% | 0% |

**Observation:** Almost entirely desktop traffic. Developer tool = expected. Mobile optimization still important for SEO but not primary focus.

---

## Appendix D: Existing Content Assets

### Already Ranking Well
| URL | Top Keyword | Position | Action |
|-----|-------------|----------|--------|
| /guide/recipes/large-sites | bulk lighthouse test | #1 | Protect, expand |
| /integrations/ci | lhci | #18 | Optimize for lighthouse ci |
| /guide/getting-started/unlighthouse-cli | lighthouse cli | #11 | Push to top 5 |
| /guide/guides/authentication | chrome lighthouse authentication | #5 | Add more detail |

### New Content Added (Pending Index)
Based on git status, these are staged:
- `/automation/0.index.md`
- `/automation/1.github-actions.md`
- `/cloud/0.index.md`
- `/cloud/1.pricing.md`
- `/compare/0.index.md`
- `/compare/1.debugbear.md`
- `/compare/2.pagespeed-insights.md`
- `/frameworks/0.index.md`
- `/frameworks/1.nextjs/*`
- `/frameworks/2.nuxt/*`

**Priority:** Get these indexed immediately via Search Console URL Inspection.

---

## Success Criteria: 12-Month Targets

| Metric | Jan 2026 | Mar 2026 | 6-Month (Jul) | 12-Month (Jan 2027) |
|--------|----------|----------|---------------|---------------------|
| Monthly organic clicks (28d) | 557 | **1,389** | 5,000 | 25,000 |
| Keywords total | ~250 | **930** | 2,000 | 5,000 |
| Keywords in top 10 | 3 | **~15+** | 50 | 100 |
| Avg Position | 29.2 | **8.0** | 6.0 | 5.0 |
| Domain Rank | 31 | 31 | 45 | 60 |
| Referring domains | ~50 | ~50 | 100 | 200 |
| Tool usage (scans/month) | 0 | [measure] | 5,000 | 20,000 |

---

**Document Version:** 1.4
**Last Updated:** March 4, 2026
**Data Sources:** GSC (28d ending Mar 4), DataForSEO (MCP), Ahrefs/Semrush (via Gemini deep research)
**Next Review:** March 13-17, 2026 (mid-month CTR fix check), March 27 (full monthly review)
