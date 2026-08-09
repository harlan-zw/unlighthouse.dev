---
title: "Lighthouse Speed Index: What It Means, Good Scores & How to Fix"
description: "Speed Index (SI) measures how fast visible content fills the viewport. Good: ≤3.4s mobile, ≤1.3s desktop. 10% of Lighthouse performance score. Thresholds, tools, fixes."
keywords:
  - lighthouse speed index
  - speed index
  - speed index lighthouse
  - pagespeed insights speed index
  - pagespeed speed index
  - page speed index
  - index speed
  - what is speed index
  - what is speed index in lighthouse
  - what is speed index in pagespeed insights
  - speed index meaning
  - speed index definition
  - speed index good score
  - speed index threshold
  - speed index vs lcp
  - speed index test
  - speed index score
  - improve speed index
  - speed index web performance metric
navigation:
  title: "Speed Index"
updatedAt: "2026-08-09"
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

Speed Index measures how quickly visible content appears in the viewport during a Lighthouse run. Unlike FCP or LCP, which mark individual moments, Speed Index scores the visual progress across the loading sequence. It contributes 10% to the Lighthouse Performance score.

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

Lighthouse records video frames during the page load, estimates visual completeness for each frame, then calculates the area above the visual progress curve. A page that paints most of its above-the-fold content early scores better than one that reveals the same content gradually.

Speed Index depends on the emulated viewport and test environment. Mobile and desktop use different scoring curves, which is why their good thresholds differ. Compare runs only when viewport, Chrome version, throttling, and page state match.

## Speed Index vs other metrics

| Metric | What it answers |
|--------|-----------------|
| [FCP](/glossary/fcp) | When did the first content appear? |
| [LCP](/glossary/lcp) | When did the main content element appear? |
| Speed Index | How quickly did the visible viewport fill in? |

Two pages can share the same LCP while having different Speed Index values. A useful header and article text painted before a late hero can improve visual progress. A blank screen that reveals everything at once may have the same LCP but a worse Speed Index.

## What makes Speed Index slow

- Render-blocking CSS/JavaScript
- Large above-the-fold images
- Web font loading delays
- Client-side rendering
- Blank loading screens that hide ready content
- Main-thread tasks that delay style, layout, or paint

## How to improve Speed Index

1. Make critical content available in the initial HTML.
2. Inline or prioritize the small amount of CSS needed above the fold.
3. Preload only the confirmed LCP image or critical font, then check the network waterfall for competition.
4. Give images explicit dimensions and responsive sources.
5. Remove startup JavaScript or defer work that does not affect the first viewport.

Start with the Lighthouse diagnostics attached to the slow run. A Speed Index value alone cannot tell you whether CSS, images, fonts, or JavaScript caused the delay.

## Limits of Speed Index

Speed Index is based on pixels, not meaning. A large background color can look visually complete while useful text remains missing. Carousels and loading animations can also change many pixels without helping the user.

It is a synthetic metric for the initial viewport, not a Core Web Vital and not a measure of interaction responsiveness. Use it to explain visual loading in lab tests, then check [LCP](/glossary/lcp), [CLS](/glossary/cls), and [INP](/glossary/inp) in field data.

## Measure speed index

- Lighthouse in Chrome DevTools
- [PageSpeed Insights](https://pagespeed.web.dev/) lab metrics
- WebPageTest, which introduced the metric
- [Unlighthouse Bulk PageSpeed Test](/tools/bulk-pagespeed) for comparing routes across a site

::note
Use the [Lighthouse Score Calculator](/tools/lighthouse-score-calculator) to see how the 10% Speed Index weight affects the Performance score. Optimize the page, not the calculator: a lower Speed Index should come from content appearing sooner for users.
::
