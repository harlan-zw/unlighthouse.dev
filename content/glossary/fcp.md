---
title: "What is First Contentful Paint (FCP)?"
description: "FCP measures when the first content renders. Learn what it is, thresholds, and how to improve it."
keywords:
  - what is first contentful paint
  - fcp meaning
  - fcp definition
navigation:
  title: "FCP"
relatedPages:
  - path: /glossary/lcp
    title: Largest Contentful Paint (LCP)
  - path: /glossary/ttfb
    title: Time to First Byte (TTFB)
---

First Contentful Paint (FCP) measures when the browser renders the first piece of content - text, image, SVG, or canvas element. It answers "is anything happening?" and contributes 10% to your Lighthouse score.

## Thresholds

| Score | Rating |
|-------|--------|
| ≤ 1.8s | Good |
| 1.8s - 3.0s | Needs Improvement |
| > 3.0s | Poor |

[Google recommends](https://web.dev/articles/fcp) 1.8 seconds or less for at least 75% of page visits.

## FCP vs LCP

| Metric | Measures | Question It Answers |
|--------|----------|---------------------|
| FCP | First content appears | "Is anything happening?" |
| [LCP](/glossary/lcp) | Largest content appears | "Is the main content loaded?" |

A page can have fast FCP (spinner appears) but slow LCP (actual content takes longer). Both matter for UX.

## Why It Matters

FCP marks when users perceive the page is loading. Before FCP, they see only a blank screen. Fast FCP reassures users something is happening, reducing early abandonment.

## Common Issues

- Slow server response ([TTFB](/glossary/ttfb))
- Render-blocking CSS/JavaScript
- Large CSS files blocking first paint
- Web fonts with `font-display: block`

## Measure FCP

- Chrome DevTools Performance panel
- Lighthouse audit
- [PageSpeed Insights](https://pagespeed.web.dev/)

::note
FCP is a Lighthouse metric, not a Core Web Vital. Improving FCP typically improves [LCP](/glossary/lcp), which is a Core Web Vital and ranking factor.
::
