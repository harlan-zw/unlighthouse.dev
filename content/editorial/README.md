# Content refresh ledger

State: foundations reviewed. Owner: request_content_lead. Root and sources_reviewer accepted the seven files on 15 September 2026.
Original site Git revision: `8a8b40c004f22e27e12c5ec632bd54c58fae568b`. Checked 15 September 2026.

## Scope and authority

Inventory: 90 local learning articles and 8 public glossary entries. Preserve existing URLs and publication dates.
Current authorization covers foundations and the PSI versus Lighthouse pilot. Broader topic batches await pilot acceptance and coordinator planning.
Imported package documentation, unrelated tools, and site-wide product redesign are outside this rewrite.
Factual Vue components used by an article are part of that article's review, including their tooltips and hidden labels.

## Imported source boundary

`content.config.ts` selects these sources in order. No selector change is proposed.

| Source | Observed Git revision | Non-glossary Markdown files | Meaning |
| --- | --- | --- | --- |
| `~/pkg/unlighthouse-alt/docs` | `71afaa9afa0e3210e5b2bda890224aa924e0da54` | 29 | Selected in this environment |
| `~/pkg/unlighthouse/docs` | `b90c3b407e930f5a0eeb66e290845fb50dfb85ca` | 34 | Second local candidate |
| GitHub `harlan-zw/unlighthouse` main | `9c69fb998e6a5253251793a2da6456e0a46d8ce9` | Not counted | Remote HEAD observed with git ls-remote; fallback is not pinned by current config |

Record the resolved source again for each build. This is not proof of the production deployment's imported revision.
Do not mutate either package checkout or rewrite imported docs here. Verify product examples against a deliberately selected released package.

## Publication boundary

The `learnLighthouse` collection reads only `content/learn-lighthouse/**/*.md`.
The `glossary` collection reads only `content/glossary/**/*.md`.
The `root` collection imports package docs outside this repository's `content/`.
The four top-level policy files and `content/editorial/` sit outside all three roots.
Navigation and `/api/search.json` query those named collections; the sitemap content integration uses the collections too.
Generated index, search, and navigation artifacts contain 90 learning pages, 8 glossary entries, and 29 imported pages, with no editorial records.
All 98 local paths below match generated collection paths. HTTP routes and sitemap remain unverified: local Nitro startup fails inside bundled Sharp before rendering.

## Search evidence

Read `.claude/plans/seo-q1-execution.md` and `seo-strategy-2026.md` as historical leads only.
Published NuxtSEO CLI 0.2.0 `whoami --json` failed `contract_violation account.token` on 15 September 2026.
Request ID: `5d44efe4-9208-4bc5-8297-580062abe5b9`. No Site or locale resolved. No paid research ran.
No current measured demand is claimed. Continue primary-source work without platform repair.

## Pilot and review

Pilot: [PSI versus Lighthouse brief](briefs/pagespeed-insights-vs-lighthouse.md). State: article reviewed. Brief reviewed by sources_reviewer and root on 15 September 2026; factual draft submitted by product_writer.
The root coordinator owns all live browser captures. Root assigns the writer and independent article reviewer separately.
Three real report captures and local execution evidence now exist in the pilot brief. Independent factual review passed; both writing passes completed. Independent final prose review passed at the brief’s recorded file digest. Root accepted the production Worker rendering, links and final media on 15 September 2026. Production publication is unverified.

## Inventory

Routes below match generated collection paths on 15 September 2026. HTTP route checks remain outstanding.
The state `sources needed` is inventory, not authorization to mass rewrite. Unassigned rows have no brief or accepted claims yet.

| File | Generated route | Reader topic | State |
| --- | --- | --- | --- |
| content/learn-lighthouse/1.core-web-vitals.md | /learn-lighthouse/core-web-vitals | Core web vitals guide | sources needed |
| content/learn-lighthouse/2.bulk-lighthouse-testing.md | /learn-lighthouse/bulk-lighthouse-testing | Bulk lighthouse testing & --maxRoutes config | sources needed |
| content/learn-lighthouse/3.pagespeed-insights-vs-lighthouse.md | /learn-lighthouse/pagespeed-insights-vs-lighthouse | PageSpeed Insights vs Lighthouse: What's the difference? | article reviewed |
| content/learn-lighthouse/accessibility/0.index.md | /learn-lighthouse/accessibility | Lighthouse Accessibility Audit Guide | sources needed |
| content/learn-lighthouse/accessibility/1.aria-hidden-focus.md | /learn-lighthouse/accessibility/aria-hidden-focus | Fix Focusable Elements Inside aria-hidden | sources needed |
| content/learn-lighthouse/accessibility/10.html-has-lang.md | /learn-lighthouse/accessibility/html-has-lang | Fix Missing HTML Lang Attribute for Better Accessibility | sources needed |
| content/learn-lighthouse/accessibility/11.image-alt.md | /learn-lighthouse/accessibility/image-alt | Fix Missing Image Alt Text for Better Accessibility | sources needed |
| content/learn-lighthouse/accessibility/12.label.md | /learn-lighthouse/accessibility/label | Fix Form Labels for Better Accessibility | sources needed |
| content/learn-lighthouse/accessibility/13.link-name.md | /learn-lighthouse/accessibility/link-name | Fix links without discernible names for better accessibility | sources needed |
| content/learn-lighthouse/accessibility/14.meta-viewport.md | /learn-lighthouse/accessibility/meta-viewport | Fix zooming and scaling disabled | sources needed |
| content/learn-lighthouse/accessibility/15.tabindex.md | /learn-lighthouse/accessibility/tabindex | Fix tabindex values greater than zero for better accessibility | sources needed |
| content/learn-lighthouse/accessibility/16.target-size.md | /learn-lighthouse/accessibility/target-size | Fix touch target size for better accessibility | sources needed |
| content/learn-lighthouse/accessibility/2.aria-required-attr.md | /learn-lighthouse/accessibility/aria-required-attr | Fix Missing Required ARIA Attributes | sources needed |
| content/learn-lighthouse/accessibility/3.aria-valid-attr.md | /learn-lighthouse/accessibility/aria-valid-attr | Fix Invalid or Misspelled ARIA Attributes | sources needed |
| content/learn-lighthouse/accessibility/4.button-name.md | /learn-lighthouse/accessibility/button-name | Fix Buttons Without Accessible Names | sources needed |
| content/learn-lighthouse/accessibility/5.bypass.md | /learn-lighthouse/accessibility/bypass | Fix missing bypass blocks for keyboard navigation | sources needed |
| content/learn-lighthouse/accessibility/6.color-contrast.md | /learn-lighthouse/accessibility/color-contrast | Fix Color Contrast for Better Accessibility | sources needed |
| content/learn-lighthouse/accessibility/7.document-title.md | /learn-lighthouse/accessibility/document-title | Fix Missing Document Title | sources needed |
| content/learn-lighthouse/accessibility/8.frame-title.md | /learn-lighthouse/accessibility/frame-title | Fix Frame Title for Better Accessibility | sources needed |
| content/learn-lighthouse/accessibility/9.heading-order.md | /learn-lighthouse/accessibility/heading-order | Fix heading order for better accessibility | sources needed |
| content/learn-lighthouse/best-practices/0.index.md | /learn-lighthouse/best-practices | Lighthouse Best Practices Guide | sources needed |
| content/learn-lighthouse/best-practices/1.bf-cache.md | /learn-lighthouse/best-practices/bf-cache | Fix back/forward cache issues | sources needed |
| content/learn-lighthouse/best-practices/10.is-on-https.md | /learn-lighthouse/best-practices/is-on-https | Fix HTTPS Issues for Better Best Practices Score | sources needed |
| content/learn-lighthouse/best-practices/11.notification-on-start.md | /learn-lighthouse/best-practices/notification-on-start | Fix Notification Request on Page Load | sources needed |
| content/learn-lighthouse/best-practices/12.paste-preventing-inputs.md | /learn-lighthouse/best-practices/paste-preventing-inputs | Fix Inputs That Block Pasting | sources needed |
| content/learn-lighthouse/best-practices/13.redirects-http.md | /learn-lighthouse/best-practices/redirects-http | Fix HTTP to HTTPS Redirect for Better Best Practices Score | sources needed |
| content/learn-lighthouse/best-practices/2.charset.md | /learn-lighthouse/best-practices/charset | Fix charset declaration | sources needed |
| content/learn-lighthouse/best-practices/3.deprecations.md | /learn-lighthouse/best-practices/deprecations | Fix deprecated browser APIs | sources needed |
| content/learn-lighthouse/best-practices/4.doctype.md | /learn-lighthouse/best-practices/doctype | Fix Missing HTML Doctype for Better Best Practices Score | sources needed |
| content/learn-lighthouse/best-practices/5.errors-in-console.md | /learn-lighthouse/best-practices/errors-in-console | Fix Console Errors for Better Best Practices Score | sources needed |
| content/learn-lighthouse/best-practices/6.geolocation-on-start.md | /learn-lighthouse/best-practices/geolocation-on-start | Fix Geolocation Request on Page Load | sources needed |
| content/learn-lighthouse/best-practices/7.image-aspect-ratio.md | /learn-lighthouse/best-practices/image-aspect-ratio | Fix Incorrect Image Aspect Ratio for Better Best Practices Score | sources needed |
| content/learn-lighthouse/best-practices/8.image-size-responsive.md | /learn-lighthouse/best-practices/image-size-responsive | Fix Low Resolution Images for Better Best Practices Score | sources needed |
| content/learn-lighthouse/best-practices/9.inspector-issues.md | /learn-lighthouse/best-practices/inspector-issues | Fix Chrome DevTools Issues for Better Best Practices Score | sources needed |
| content/learn-lighthouse/cls/0.index.md | /learn-lighthouse/cls | Cumulative Layout Shift (CLS): What Is a Good Score & How to Fix | sources needed |
| content/learn-lighthouse/cls/1.unsized-images.md | /learn-lighthouse/cls/unsized-images | Fix Images Without Dimensions for Better CLS | sources needed |
| content/learn-lighthouse/cls/2.layout-shifts.md | /learn-lighthouse/cls/layout-shifts | Fix Layout Shifts: CSS Reflow, Font-Size & CLS Causes | sources needed |
| content/learn-lighthouse/cls/3.web-fonts-causing-foit.md | /learn-lighthouse/cls/web-fonts-causing-foit | Fix Web Fonts Causing Layout Shifts (FOIT/FOUT) | sources needed |
| content/learn-lighthouse/cls/4.dynamic-content-injection.md | /learn-lighthouse/cls/dynamic-content-injection | Fix Dynamic Content Injection for Better CLS | sources needed |
| content/learn-lighthouse/cls/5.ads-embeds-iframes.md | /learn-lighthouse/cls/ads-embeds-iframes | Fix Ads, Embeds & iframes for Better CLS | sources needed |
| content/learn-lighthouse/cls/6.animations-transitions.md | /learn-lighthouse/cls/animations-transitions | Fix Animations & Transitions for Better CLS | sources needed |
| content/learn-lighthouse/inp/0.index.md | /learn-lighthouse/inp | Interaction to Next Paint (INP) Guide | sources needed |
| content/learn-lighthouse/inp/1.long-running-javascript.md | /learn-lighthouse/inp/long-running-javascript | Fix Long-Running JavaScript for Better INP | sources needed |
| content/learn-lighthouse/inp/2.total-blocking-time.md | /learn-lighthouse/inp/total-blocking-time | Fix Total Blocking Time for Better INP | sources needed |
| content/learn-lighthouse/inp/3.heavy-dom-operations.md | /learn-lighthouse/inp/heavy-dom-operations | Fix Heavy Main Thread Work for Better INP | sources needed |
| content/learn-lighthouse/inp/4.dom-size.md | /learn-lighthouse/inp/dom-size | Fix Excessive DOM Size for Better INP | sources needed |
| content/learn-lighthouse/inp/5.third-party-scripts.md | /learn-lighthouse/inp/third-party-scripts | Fix Third-Party Script Impact on INP | sources needed |
| content/learn-lighthouse/inp/6.event-handler-delays.md | /learn-lighthouse/inp/event-handler-delays | Fix Event Handler Delays for Better INP | sources needed |
| content/learn-lighthouse/inp/7.hydration-issues.md | /learn-lighthouse/inp/hydration-issues | Fix Hydration Issues for Better INP | sources needed |
| content/learn-lighthouse/lcp/0.index.md | /learn-lighthouse/lcp | Largest Contentful Paint (LCP): Good Scores, Fixes & Guide | sources needed |
| content/learn-lighthouse/lcp/1.slow-server-response.md | /learn-lighthouse/lcp/slow-server-response | Fix Slow Server Response (TTFB) for Better LCP | sources needed |
| content/learn-lighthouse/lcp/10.total-byte-weight.md | /learn-lighthouse/lcp/total-byte-weight | Fix Enormous Network Payloads for Better LCP | sources needed |
| content/learn-lighthouse/lcp/11.unminified-javascript.md | /learn-lighthouse/lcp/unminified-javascript | Fix Unminified JavaScript for Better LCP | sources needed |
| content/learn-lighthouse/lcp/12.unused-javascript.md | /learn-lighthouse/lcp/unused-javascript | Fix Unused JavaScript for Better LCP | sources needed |
| content/learn-lighthouse/lcp/13.best-practices-2026.md | /learn-lighthouse/lcp/best-practices-2026 | LCP Optimization Best Practices 2026: The Complete Guide | sources needed |
| content/learn-lighthouse/lcp/2.render-blocking-resources.md | /learn-lighthouse/lcp/render-blocking-resources | Eliminate Render-Blocking Resources: Lighthouse Audit Fix | sources needed |
| content/learn-lighthouse/lcp/3.prioritize-lcp-image.md | /learn-lighthouse/lcp/prioritize-lcp-image | Preload & Prioritize Your LCP Image | sources needed |
| content/learn-lighthouse/lcp/4.resource-load-delay.md | /learn-lighthouse/lcp/resource-load-delay | Fix Resource Load Delay for Better LCP | sources needed |
| content/learn-lighthouse/lcp/5.client-side-rendering.md | /learn-lighthouse/lcp/client-side-rendering | Fix Client-Side Rendering for Better LCP | sources needed |
| content/learn-lighthouse/lcp/6.lcp-lazy-loaded.md | /learn-lighthouse/lcp/lcp-lazy-loaded | Don't Lazy-Load Your LCP Image | sources needed |
| content/learn-lighthouse/lcp/7.large-images.md | /learn-lighthouse/lcp/large-images | Fix Large Images for Better LCP | sources needed |
| content/learn-lighthouse/lcp/8.lazy-loading-above-fold.md | /learn-lighthouse/lcp/lazy-loading-above-fold | Fix Lazy-Loading Above the Fold for Better LCP | sources needed |
| content/learn-lighthouse/lcp/9.redirects.md | /learn-lighthouse/lcp/redirects | Fix Page Redirects for Better LCP | sources needed |
| content/learn-lighthouse/lhci-vs-unlighthouse.md | /learn-lighthouse/lhci-vs-unlighthouse | LHCI vs Unlighthouse: Which Lighthouse CI Tool Should You Use? | sources needed |
| content/learn-lighthouse/lighthouse-ci/0.index.md | /learn-lighthouse/lighthouse-ci | Lighthouse CI (LHCI): Complete Guide to @lhci/cli in 2026 | sources needed |
| content/learn-lighthouse/lighthouse-ci/1.github-actions.md | /learn-lighthouse/lighthouse-ci/github-actions | Lighthouse CI GitHub Actions: Setup Guide & Documentation | sources needed |
| content/learn-lighthouse/lighthouse-ci/2.gitlab-ci.md | /learn-lighthouse/lighthouse-ci/gitlab-ci | Lighthouse CI with GitLab CI/CD: Setup Guide | sources needed |
| content/learn-lighthouse/lighthouse-ci/3.configuration.md | /learn-lighthouse/lighthouse-ci/configuration | Lighthouse CI Configuration Reference | sources needed |
| content/learn-lighthouse/lighthouse-ci/4.budgets.md | /learn-lighthouse/lighthouse-ci/budgets | Performance Budgets with Lighthouse CI: Assertions & budget.json | sources needed |
| content/learn-lighthouse/lighthouse-ci/5.server.md | /learn-lighthouse/lighthouse-ci/server | LHCI Server: Self-Host Lighthouse CI Dashboard | sources needed |
| content/learn-lighthouse/lighthouse-ci/6.troubleshooting.md | /learn-lighthouse/lighthouse-ci/troubleshooting | Lighthouse CI Troubleshooting Guide | sources needed |
| content/learn-lighthouse/pagespeed-insights-api/0.index.md | /learn-lighthouse/pagespeed-insights-api | PageSpeed Insights API Guide | sources needed |
| content/learn-lighthouse/pagespeed-insights-api/1.get-api-key.md | /learn-lighthouse/pagespeed-insights-api/get-api-key | Get a PageSpeed Insights API Key | sources needed |
| content/learn-lighthouse/pagespeed-insights-api/2.node-example.md | /learn-lighthouse/pagespeed-insights-api/node-example | PageSpeed Insights API Node.js Example (googleapis.com/pagespeedonline) | sources needed |
| content/learn-lighthouse/pagespeed-insights-api/3.python-example.md | /learn-lighthouse/pagespeed-insights-api/python-example | PageSpeed Insights API Python Example (googleapis.com/pagespeedonline) | sources needed |
| content/learn-lighthouse/pagespeed-insights-api/4.bulk-testing.md | /learn-lighthouse/pagespeed-insights-api/bulk-testing | Bulk Testing with PageSpeed Insights API | sources needed |
| content/learn-lighthouse/pagespeed-insights-api/5.rate-limits.md | /learn-lighthouse/pagespeed-insights-api/rate-limits | PageSpeed Insights API Rate Limits | sources needed |
| content/learn-lighthouse/playwright/0.index.md | /learn-lighthouse/playwright | Lighthouse with Playwright: Performance Testing Guide | sources needed |
| content/learn-lighthouse/playwright/1.authentication.md | /learn-lighthouse/playwright/authentication | Lighthouse on Authenticated Pages with Playwright | sources needed |
| content/learn-lighthouse/playwright/2.ci-cd.md | /learn-lighthouse/playwright/ci-cd | Playwright Lighthouse in GitHub Actions | sources needed |
| content/learn-lighthouse/playwright/3.troubleshooting.md | /learn-lighthouse/playwright/troubleshooting | Troubleshooting Playwright Lighthouse Integration | sources needed |
| content/learn-lighthouse/seo/0.index.md | /learn-lighthouse/seo | Lighthouse SEO Audit: All 8 Checks Explained & How to Fix | sources needed |
| content/learn-lighthouse/seo/1.canonical.md | /learn-lighthouse/seo/canonical | Fix Invalid Canonical URL for Better SEO | sources needed |
| content/learn-lighthouse/seo/2.crawlable-anchors.md | /learn-lighthouse/seo/crawlable-anchors | Fix Uncrawlable Links for Better SEO | sources needed |
| content/learn-lighthouse/seo/3.hreflang.md | /learn-lighthouse/seo/hreflang | Fix Invalid hreflang Tags for Better International SEO | sources needed |
| content/learn-lighthouse/seo/4.http-status-code.md | /learn-lighthouse/seo/http-status-code | Fix Unsuccessful HTTP Status Code for Better SEO | sources needed |
| content/learn-lighthouse/seo/5.is-crawlable.md | /learn-lighthouse/seo/is-crawlable | Fix Page Blocked from Indexing for Better SEO | sources needed |
| content/learn-lighthouse/seo/6.link-text.md | /learn-lighthouse/seo/link-text | Fix Non-Descriptive Link Text for Better SEO | sources needed |
| content/learn-lighthouse/seo/7.meta-description.md | /learn-lighthouse/seo/meta-description | Fix Missing Meta Description for Better SEO | sources needed |
| content/learn-lighthouse/seo/8.robots-txt.md | /learn-lighthouse/seo/robots-txt | Fix Invalid robots.txt for Better SEO | sources needed |
| content/glossary/cls.md | /glossary/cls | What is cumulative layout shift (CLS)? | sources needed |
| content/glossary/fcp.md | /glossary/fcp | What is first contentful paint (FCP)? | sources needed |
| content/glossary/inp.md | /glossary/inp | What is interaction to next paint (INP)? | sources needed |
| content/glossary/lcp.md | /glossary/lcp | What is largest contentful paint (LCP)? | sources needed |
| content/glossary/speed-index.md | /glossary/speed-index | Lighthouse Speed Index: What It Means, Good Scores & How to Fix | sources needed |
| content/glossary/tbt.md | /glossary/tbt | What is total blocking time (TBT)? | sources needed |
| content/glossary/ttfb.md | /glossary/ttfb | What is time to first byte (TTFB)? | sources needed |
| content/glossary/tti.md | /glossary/tti | What is time to interactive (TTI)? | sources needed |

## Pilot writer handoff, 15 September 2026

Writer branch: `docs/psi-lighthouse-visual-pilot`, based on Git revision `660319a43570ff21ae57452b716971f3c77246c7`.
Foundation [PR #110](https://github.com/harlan-zw/unlighthouse.dev/pull/110); article PR not opened yet.
See the [pilot brief](briefs/pagespeed-insights-vs-lighthouse.md#current-factual-handoff-15-september-2026) for the factual file digest, real reports, replay command and image evidence.
Factual review passed before both humanize passes. Root owns final browser checks. Root accepted the final pilot. Live publication remains unverified.

Final pilot article SHA256 file digest: `1bd179cd1307e74816cfd3ef9060726911a613132aae5467075c18296497a1ce`.
Full lint, typecheck, 203 existing tests and authenticated production build passed. All three image keyboard links and three internal client links passed root review.
Local Worker unknown paths return self-redirect 301, so local private 404 checks are not claimed. Generated collections, search and sitemap exclude editorial records.
Root final media and bounded evidence are recorded in the pilot brief. Remaining work: article PR, remote CI and authorized publication.
