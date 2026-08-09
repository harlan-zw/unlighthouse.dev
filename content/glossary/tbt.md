---
title: "What is total blocking time (TBT)?"
description: "TBT measures main thread blocking during load. Learn what it is, thresholds, and how to reduce blocking time."
keywords:
  - what is total blocking time
  - tbt meaning
  - tbt definition
navigation:
  title: "TBT"
updatedAt: "2026-08-09"
relatedPages:
  - path: /glossary/inp
    title: Interaction to Next Paint (INP)
  - path: /glossary/fcp
    title: First Contentful Paint (FCP)
  - path: /learn-lighthouse/inp
    title: INP Guide
---

Total Blocking Time (TBT) is a Lighthouse lab metric. It adds up the blocking portions of long main-thread tasks between [First Contentful Paint](/glossary/fcp) and Time to Interactive. TBT contributes **30%** of the Lighthouse Performance score.

## Thresholds

| Score | Rating |
|-------|--------|
| ≤ 200ms | Good |
| 200ms - 600ms | Needs Improvement |
| > 600ms | Poor |

## How Lighthouse calculates TBT

Any main-thread task longer than 50 milliseconds is a long task. Only the time beyond the first 50 milliseconds counts toward TBT:

- 70ms task → 20ms blocking time
- 250ms task → 200ms blocking time
- 30ms task → 0ms (under threshold)

For example, three tasks lasting 70ms, 250ms, and 30ms contribute 20ms + 200ms + 0ms, for a TBT of 220ms. The browser cannot promptly handle input while a long task occupies the main thread.

## TBT vs INP

| Metric | When | Type |
|--------|------|------|
| TBT | Startup, between FCP and TTI | Synthetic lab metric |
| [INP](/glossary/inp) | User interactions throughout a visit | Field metric |

TBT is useful when a slow startup is likely to hurt responsiveness. It cannot measure INP because a Lighthouse run does not reproduce real interactions across a full visit. A page can have low TBT and poor INP when a menu, editor, or checkout action starts heavy work later.

## Why it matters

TBT has the largest weight in the Lighthouse Performance score. High TBT also points to startup work that can delay input, rendering, and hydration. Fixing it often improves several metrics, but the Lighthouse score is still a lab result from one controlled run.

## What causes high TBT

- Large JavaScript bundles
- Unoptimized third-party scripts
- Heavy framework hydration
- Repeated synchronous layout and style calculations
- Large JSON parsing or client-side rendering work

## How to diagnose TBT

Open the Chrome DevTools Performance panel and record a reload. Long tasks appear with red markers in the main-thread track. Expand the busiest task, then follow its call tree back to your code or a third-party script.

Lighthouse also groups related work into diagnostics. Start with JavaScript execution time, main-thread work, third parties, and unused JavaScript. The top-level TBT number tells you the size of the problem; the trace tells you what to change.

## How to reduce TBT

1. Remove code that does not need to run during startup.
2. Load route-specific and below-the-fold features later.
3. Split necessary work into smaller tasks so the browser can handle input and paint between chunks.
4. Move CPU-heavy pure computation to a Web Worker when it does not need DOM access.
5. Delay or remove third-party scripts, then measure their cost again.

Do not split work blindly. More scheduling overhead can make total completion slower. Fix the largest trace entries first and rerun the same test several times.

## Measure TBT

- Lighthouse in Chrome DevTools
- [PageSpeed Insights](https://pagespeed.web.dev/) (lab data section)
- WebPageTest

Use the same device, throttling, Chrome version, and URL when comparing builds. CPU speed has a large effect on TBT, so scores from a laptop and a shared CI runner are not directly comparable.

::warning
TBT is a lab metric. Verify responsiveness with [INP](/glossary/inp) from CrUX or your own real-user monitoring.
::
