---
title: "What is Time to Interactive (TTI)?"
description: "TTI measured page interactivity but was deprecated in Lighthouse 10. Learn what replaced it."
keywords:
  - what is time to interactive
  - tti meaning
  - tti deprecated
navigation:
  title: "TTI (Deprecated)"
relatedPages:
  - path: /glossary/tbt
    title: Total Blocking Time (TBT)
  - path: /glossary/inp
    title: Interaction to Next Paint (INP)
  - path: /learn-lighthouse/inp
    title: INP Guide
---

::warning
Time to Interactive (TTI) was **removed from Lighthouse 10** in February 2023. Use [TBT](/glossary/tbt) for lab measurement and [INP](/glossary/inp) for field measurement.
::

Time to Interactive measured when a page became fully interactive - displaying useful content, event handlers registered, and responding within 50ms. It identified a 5-second "quiet window" with no Long Tasks.

## Why TTI Was Deprecated

[Google removed TTI](https://developer.chrome.com/blog/lighthouse-10-0) because:

- **Overly sensitive to outliers** - A single late network request could dramatically inflate TTI
- **Better alternatives exist** - [TBT](/glossary/tbt) measures blocking more robustly
- **Poor correlation with real experience** - Terrible TTI could still feel responsive

## What Replaced TTI

### Lab Testing

[Total Blocking Time (TBT)](/glossary/tbt) - Measures cumulative main thread blocking. Now has 30% Lighthouse weight.

### Field Measurement

[Interaction to Next Paint (INP)](/glossary/inp) - Measures actual interaction responsiveness. Core Web Vital since March 2024.

## Historical Thresholds

| Score | Rating |
|-------|--------|
| ≤ 3.8s | Good |
| 3.8s - 7.3s | Needs Improvement |
| > 7.3s | Poor |

## Migration

| Old | New |
|----|-----|
| TTI in Lighthouse | Use [TBT](/glossary/tbt) |
| TTI in field/RUM | Use [INP](/glossary/inp) |
| TTI CI assertions | Switch to TBT thresholds |
