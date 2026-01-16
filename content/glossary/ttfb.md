---
title: "What is Time to First Byte (TTFB)?"
description: "TTFB measures server response time. Learn what it is, thresholds, and how to optimize it."
keywords:
  - what is time to first byte
  - ttfb meaning
  - ttfb definition
navigation:
  title: "TTFB"
relatedPages:
  - path: /glossary/fcp
    title: First Contentful Paint (FCP)
  - path: /glossary/lcp
    title: Largest Contentful Paint (LCP)
  - path: /learn/lcp
    title: LCP Guide
---

Time to First Byte (TTFB) measures how long until the browser receives the first byte from the server. It's a foundational metric - nothing can render until this completes.

## Thresholds

| Score | Rating |
|-------|--------|
| ≤ 800ms | Good |
| 800ms - 1800ms | Needs Improvement |
| > 1800ms | Poor |

[Google recommends](https://web.dev/articles/ttfb) 800 milliseconds or less.

## What TTFB Includes

- Redirect time
- DNS lookup
- TCP connection
- TLS negotiation
- Server processing time

Sites with poor [LCP](/glossary/lcp) have an [average TTFB of 2,270ms](https://almanac.httparchive.org/en/2024/performance) - nearly consuming the entire 2.5s LCP budget.

## Why It Matters

TTFB is the starting point for all other metrics. High TTFB delays [FCP](/glossary/fcp), [LCP](/glossary/lcp), and everything else. For SPAs, fast TTFB is especially critical since client-side rendering adds more time.

## Common Issues

- Slow server processing / database queries
- No caching (regenerating cacheable responses)
- Geographic distance without CDN
- Too many redirects

## Improve TTFB

- Use a CDN
- Enable caching at all levels
- Optimize backend code
- Use HTTP/2 or HTTP/3
- Minimize redirects

## Measure TTFB

- Chrome DevTools Network panel ("Waiting for server response")
- [PageSpeed Insights](https://pagespeed.web.dev/)
- WebPageTest waterfall

::note
TTFB is not a Core Web Vital, but directly impacts [LCP](/glossary/lcp) which is. Slow TTFB makes good LCP nearly impossible.
::
