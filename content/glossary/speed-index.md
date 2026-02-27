---
title: "Speed Index: What It Is, Good Scores & How to Improve"
description: "Speed Index measures how fast visible content fills the viewport. Good score: ≤3.4s mobile, ≤1.3s desktop. 10% of Lighthouse performance score. Learn thresholds and fixes."
keywords:
  - what is speed index
  - speed index meaning
  - speed index definition
  - speed index lighthouse
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

## How It Works

Lighthouse captures video frames during load and calculates how quickly the viewport fills with content. A page showing 80% content instantly scores better than one loading evenly over time.

## Speed Index vs Other Metrics

| Metric | Measures |
|--------|----------|
| [FCP](/glossary/fcp) | First content appears |
| [LCP](/glossary/lcp) | Largest content appears |
| Speed Index | Overall visual progress |

Speed Index complements FCP and LCP by measuring the experience between these points.

## Common Issues

- Render-blocking CSS/JavaScript
- Large above-the-fold images
- Web font loading delays
- Client-side rendering

## Measure Speed Index

- Lighthouse in Chrome DevTools
- [PageSpeed Insights](https://pagespeed.web.dev/)
- WebPageTest (original source of the metric)

::note
Speed Index is a lab metric, not a Core Web Vital. Focus on [LCP](/glossary/lcp), [CLS](/glossary/cls), and [INP](/glossary/inp) for search ranking impact.
::
