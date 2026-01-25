---
title: "What is Total Blocking Time (TBT)?"
description: "TBT measures main thread blocking during load. Learn what it is, thresholds, and how to reduce blocking time."
keywords:
  - what is total blocking time
  - tbt meaning
  - tbt definition
navigation:
  title: "TBT"
relatedPages:
  - path: /glossary/inp
    title: Interaction to Next Paint (INP)
  - path: /glossary/fcp
    title: First Contentful Paint (FCP)
  - path: /learn-lighthouse/inp
    title: INP Guide
---

Total Blocking Time (TBT) measures main thread blocking between [FCP](/glossary/fcp) and page interactive. It's the highest-weighted Lighthouse metric at **30%** and a strong proxy for [INP](/glossary/inp).

## Thresholds

| Score | Rating |
|-------|--------|
| ≤ 200ms | Good |
| 200ms - 600ms | Needs Improvement |
| > 600ms | Poor |

## How TBT Works

TBT counts the "blocking" portion of Long Tasks (JavaScript tasks >50ms). Only time beyond 50ms counts:

- 70ms task → 20ms blocking time
- 250ms task → 200ms blocking time
- 30ms task → 0ms (under threshold)

While the main thread is blocked, the browser can't respond to user input.

## TBT vs INP

| Metric | When | Type |
|--------|------|------|
| TBT | During load | Lab metric |
| [INP](/glossary/inp) | Throughout session | Field metric |

TBT is a lab proxy for interactivity. Low TBT often correlates with good INP, but not always.

## Why It Matters

TBT has the largest impact on Lighthouse Performance score. High TBT means clicks and taps are delayed during page load.

## Common Issues

- Large JavaScript bundles
- Unoptimized third-party scripts
- Heavy framework hydration
- Synchronous operations and layout thrashing

## Measure TBT

- Lighthouse in Chrome DevTools
- [PageSpeed Insights](https://pagespeed.web.dev/) (lab data section)
- WebPageTest

::warning
TBT is a lab metric. Real-world interactivity is measured by [INP](/glossary/inp), which is a Core Web Vital and ranking factor.
::
