# Glossary

Reviewed recovered vocabulary for the article refresh. This preserves existing names and does not rename product interfaces.
The eight public glossary articles remain reader content, not approval of every definition they currently contain.

## Map

| Term | Source or surface | Relationship | Customer word |
| --- | --- | --- | --- |
| Unlighthouse | Site branding; package repository | Uses Lighthouse for configured site audits | Unlighthouse |
| Lighthouse | Chrome documentation; report UI | Produces lab audit results and category scores | Lighthouse |
| PageSpeed Insights | Google service; `/learn-lighthouse/pagespeed-insights-vs-lighthouse` | Presents Lighthouse diagnostics and available CrUX data | PageSpeed Insights (PSI) |
| Chrome UX Report | Google CrUX documentation | Aggregates eligible real-user experiences | Chrome UX Report (CrUX) |
| lab data | Learn articles; Lighthouse report | One configured test or recorded flow | lab data |
| field data | CrUX; public Web Vitals definitions | Aggregated real-user measurements | field data |
| Lighthouse Performance score | Lighthouse report category | Weighted metric scores, separate from field assessment | Lighthouse Performance score |
| Core Web Vitals | Google Web Vitals definitions | LCP, INP, and CLS; distinct from the lab score | Core Web Vitals |
| URL and origin | PSI/CrUX selector | A specific page versus an origin aggregation | URL; origin |

Collisions: a high Lighthouse Performance score does not mean the Core Web Vitals assessment passes.
A URL result and an origin result do not describe the same population.

## Terms

### Unlighthouse

**Is:** the existing product and package brand.
**Use for:** this project's tools and documented package behavior.
**Never:** Lighthouse as a substitute for the product brand.
**Casing:** Unlighthouse.

### Lighthouse and PageSpeed Insights

**Is:** an auditing tool and a service that uses it, respectively.
**Use for:** the named tool or interface; introduce PageSpeed Insights (PSI) before shortening it.
**Never:** interchangeable names for the entire report.
**Casing:** Lighthouse; PageSpeed Insights; PSI.

### Chrome UX Report

**Is:** Google's dataset of eligible real-user experiences.
**Use for:** CrUX field data, scoped to the relevant interface and population.
**Never:** all visitors as a synonym for eligible Chrome users.
**Casing:** Chrome UX Report (CrUX). Google's expanded Chrome User Experience Report spelling remains valid in source titles.

### Lab data and field data

**Is:** test measurements and real-user measurements, respectively.
**Use for:** the evidence source, with scope and period beside results.
**Never:** a synthetic demonstration as measured field data.
**Casing:** lowercase in prose.

### Lighthouse Performance score and Core Web Vitals

**Is:** a lab category score and the named set of user-experience metrics, respectively.
**Use for:** the exact result being discussed.
**Never:** Core Web Vitals score as a synonym for Lighthouse Performance score.
**Casing:** Lighthouse Performance score; Core Web Vitals; LCP; INP; CLS.

### URL and origin

**Is:** a page identifier and its scheme/host/port scope, respectively.
**Use for:** the selected PSI/CrUX aggregation.
**Never:** tested page when the report is showing origin data.
**Casing:** URL; origin.

## Banned

| Never | Use instead | Why |
| --- | --- | --- |
| real-user score for a Lighthouse score | Lighthouse Performance score | Lab scores and field assessments are separate. |
| guaranteed improvement for an unmeasured change | describe the mechanism and verification | Outcome needs evidence. |

These rules govern prose meaning, not existing route segments, API keys, or source titles.

## Open questions

1. The package and site use audit, scan, report, and route on different surfaces. This draft does not collapse them.
   Review pinned package behavior before proposing a broader product glossary. Retaining existing labels avoids an unsupported naming redesign.
2. Root accepted this bounded vocabulary on 15 September 2026. A broader product glossary remains outside this pilot.
