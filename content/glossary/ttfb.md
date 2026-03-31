---
title: "What is time to first byte (TTFB)?"
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
  - path: /learn-lighthouse/lcp
    title: LCP Guide
---

Time to First Byte (TTFB) measures how long until the browser receives the first byte from the server. It's a foundational metric - nothing can render until this completes.

## Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **Core Web Vitals** | ≤ 800ms | 800ms - 1800ms | > 1800ms |
| **Lighthouse Audit** | < 600ms | 600ms - 1200ms | > 1200ms |

Aim for a field score of 800 milliseconds or less at the 75th percentile to pass the [Google threshold](https://web.dev/articles/ttfb). However, the Lighthouse audit requires a server response time under **600ms** to pass the lab check.

## What TTFB includes

- Redirect time
- DNS lookup
- TCP connection
- TLS negotiation
- Server processing time

Sites with poor [LCP](/glossary/lcp) have an [average TTFB of 2,270ms](https://almanac.httparchive.org/en/2024/performance) - nearly consuming the entire 2.5s LCP budget.

## Why it matters

TTFB is the starting point for all other metrics. High TTFB delays [FCP](/glossary/fcp), [LCP](/glossary/lcp), and everything else. For SPAs, fast TTFB is especially critical since client-side rendering adds more time.

## Common issues

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
TTFB directly impacts [LCP](/glossary/lcp), a Core Web Vital. Slow TTFB makes good LCP nearly impossible.
::
