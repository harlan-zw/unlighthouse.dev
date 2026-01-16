---
title: "What is Cumulative Layout Shift (CLS)?"
description: "CLS measures visual stability. Learn what it is, thresholds, and how to prevent layout shifts."
keywords:
  - what is cumulative layout shift
  - cls meaning
  - cls definition
navigation:
  title: "CLS"
relatedPages:
  - path: /learn/cls
    title: CLS Guide
  - path: /glossary/lcp
    title: Largest Contentful Paint (LCP)
  - path: /glossary/inp
    title: Interaction to Next Paint (INP)
---

::interactive-cls-playground
::

Cumulative Layout Shift (CLS) measures visual stability - how much content unexpectedly moves during loading. It's one of Google's three [Core Web Vitals](/glossary/) and affects both UX and search rankings.

## Thresholds

| Score | Rating |
|-------|--------|
| ≤ 0.1 | Good |
| 0.1 - 0.25 | Needs Improvement |
| > 0.25 | Poor |

[Google recommends](https://web.dev/articles/cls) a score of 0.1 or less for at least 75% of page visits.

## How CLS Is Calculated

CLS quantifies unexpected shifts by multiplying impact fraction (viewport affected) by distance fraction (how far elements moved). User-initiated shifts within 500ms of interaction don't count.

## Why It Matters

Layout shifts cause accidental clicks and lost reading position. [79% of mobile sites pass CLS](https://almanac.httparchive.org/en/2024/performance) - it's the best-performing Core Web Vital. [Redbus reduced CLS to 0 and saw 80-100% higher conversions](https://web.dev/case-studies/vitals-business-impact).

## Common Issues

- Images without width/height dimensions
- Ads and embeds without reserved space
- Web fonts causing text reflow
- Dynamically injected content

## Measure CLS

- Chrome DevTools Performance panel
- Lighthouse audit
- [PageSpeed Insights](https://pagespeed.web.dev/) (field data)
- Web Vitals Chrome extension

→ [Complete CLS Guide](/learn/cls)
