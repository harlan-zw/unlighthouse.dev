---
title: "What is Largest Contentful Paint (LCP)?"
description: "LCP measures loading performance. Learn what it is, thresholds, and how to improve your score."
keywords:
  - what is largest contentful paint
  - lcp meaning
  - lcp definition
navigation:
  title: "LCP"
relatedPages:
  - path: /learn/lcp
    title: LCP Guide
  - path: /glossary/cls
    title: Cumulative Layout Shift (CLS)
  - path: /glossary/inp
    title: Interaction to Next Paint (INP)
---

::interactive-lcp-timeline
::

Largest Contentful Paint (LCP) measures how long it takes for the largest visible element to render. It's one of Google's three [Core Web Vitals](/glossary/) and directly impacts search rankings.

## Thresholds

| Score | Rating |
|-------|--------|
| ≤ 2.5s | Good |
| 2.5s - 4.0s | Needs Improvement |
| > 4.0s | Poor |

[Google recommends](https://web.dev/articles/lcp) achieving 2.5 seconds or less for at least 75% of page visits.

## What Triggers LCP

LCP tracks when the largest image, video poster, or text block renders. [73% of mobile pages have an image as their LCP element](https://almanac.httparchive.org/en/2024/performance).

## Why It Matters

LCP is the [hardest Core Web Vital to pass](https://www.debugbear.com/blog/hardest-core-web-vitals-metric) - only 59% of mobile pages achieve good scores. [Vodafone improved LCP by 31% and saw 8% more sales](https://web.dev/case-studies/vitals-business-impact).

## Common Issues

- Slow server response ([TTFB](/glossary/ttfb))
- Render-blocking CSS/JavaScript
- Large unoptimized images
- Client-side rendering delays

## Measure LCP

- Chrome DevTools Performance panel
- Lighthouse audit
- [PageSpeed Insights](https://pagespeed.web.dev/) (field data)
- Search Console Core Web Vitals report

→ [Complete LCP Guide](/learn/lcp)
