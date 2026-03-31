---
title: "What is speed index?"
description: "Speed Index measures how fast visible content fills the viewport. Good score: ≤3.4s mobile, ≤1.3s desktop. 10% of Lighthouse performance score. Thresholds, tools, and fixes."
keywords:
  - what is speed index
  - what is speed index in lighthouse
  - what is speed index in pagespeed insights
  - speed index meaning
  - speed index definition
  - speed index lighthouse
  - speed index pagespeed insights
  - speed index good score
  - speed index threshold
  - speed index vs lcp
  - speed index test
  - speed index score
  - improve speed index
  - lighthouse speed index
navigation:
  title: "Speed Index"
relatedPages:
  - path: /glossary/fcp
    title: First Contentful Paint (FCP)
  - path: /glossary/lcp
    title: Largest Contentful Paint (LCP)
  - path: /tools/lighthouse-score-calculator
    title: Lighthouse Score Calculator
  - path: /learn-lighthouse/lcp/render-blocking-resources
    title: Fix Render-Blocking Resources
---

Speed Index measures how quickly visible content populates the viewport during load. It captures overall visual loading experience rather than a single moment, contributing 10% to your Lighthouse score.

## Thresholds

### Mobile

| Score | Rating |
|-------|--------|
| ≤ 3.4s | Good |
| 3.4s - 5.8s | Needs Improvement |
| > 5.8s | Poor |

### Desktop

| Score | Rating |
|-------|--------|
| ≤ 1.3s | Good |
| 1.3s - 2.3s | Needs Improvement |
| > 2.3s | Poor |

## How it works

Lighthouse captures video frames during load and calculates how quickly the viewport fills with content. A page showing 80% content instantly scores better than one loading evenly over time.

## Speed Index vs other metrics

| Metric | Measures |
|--------|----------|
| [FCP](/glossary/fcp) | First content appears |
| [LCP](/glossary/lcp) | Largest content appears |
| Speed Index | Overall visual progress |

Speed Index complements FCP and LCP by measuring the experience between these points.

## Common issues

- Render-blocking CSS/JavaScript
- Large above-the-fold images
- Web font loading delays
- Client-side rendering

## Measure speed index

- Lighthouse in Chrome DevTools
- [PageSpeed Insights](https://pagespeed.web.dev/) - Speed Index appears in the "Diagnostics" section
- WebPageTest (the original source of the metric)
- [Unlighthouse Bulk PageSpeed Test](/tools/bulk-pagespeed) - test Speed Index across your entire site

::note
Speed Index is a lab metric, not a Core Web Vital. Focus on [LCP](/glossary/lcp), [CLS](/glossary/cls), and [INP](/glossary/inp) for search ranking impact. Use the [Lighthouse Score Calculator](/tools/lighthouse-score-calculator) to see how Speed Index (10% weight) affects your overall score.
::
