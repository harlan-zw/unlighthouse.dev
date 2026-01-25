---
title: "What is Interaction to Next Paint (INP)?"
description: "INP measures responsiveness. Learn what it is, thresholds, and how to improve interaction speed."
keywords:
  - what is interaction to next paint
  - inp meaning
  - inp definition
navigation:
  title: "INP"
relatedPages:
  - path: /learn-lighthouse/inp
    title: INP Guide
  - path: /tools/cwv-checker
    title: Core Web Vitals Checker
  - path: /glossary/lcp
    title: Largest Contentful Paint (LCP)
  - path: /glossary/cls
    title: Cumulative Layout Shift (CLS)
---

::interactive-inp-lab
::

Interaction to Next Paint (INP) measures how quickly your page responds to user interactions. It [replaced FID as a Core Web Vital](https://web.dev/blog/inp-cwv-march-12) in March 2024 and is now a Google ranking factor.

## Thresholds

| Score | Rating |
|-------|--------|
| ≤ 200ms | Good |
| 200ms - 500ms | Needs Improvement |
| > 500ms | Poor |

[Google recommends](https://web.dev/articles/inp) 200 milliseconds or less for at least 75% of page visits.

## INP vs FID

FID only measured the first interaction's input delay. INP measures all interactions throughout the page lifecycle, including processing time and rendering. Since [90% of user time is spent after page load](https://web.dev/articles/inp), INP better reflects actual experience.

## Why It Matters

While [93% of sites had good FID](https://web.dev/blog/inp-cwv), only [74% have good INP](https://almanac.httparchive.org/en/2024/performance). Users expect instant feedback - slow interactions make sites feel broken.

## Common Issues

- Long-running JavaScript blocking main thread
- Heavy event handlers
- Third-party scripts (analytics, ads)
- Hydration delays in SPAs

## Measure INP

- [Core Web Vitals Checker](/tools/cwv-checker) - test any page
- [PageSpeed Insights](https://pagespeed.web.dev/) (field data)
- Search Console Core Web Vitals report
- Web Vitals Chrome extension
- [TBT](/glossary/tbt) as lab proxy

→ [Complete INP Guide](/learn-lighthouse/inp)
