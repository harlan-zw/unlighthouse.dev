# Glossary

Reviewed vocabulary for articles and product result surfaces.
The eight public glossary articles remain reader content, not approval of every definition they currently contain.

## Map

| Term | Source or surface | Relationship | Customer word |
| --- | --- | --- | --- |
| Unlighthouse | Site branding; package repository | Uses Lighthouse for configured site audits | Unlighthouse |
| Lighthouse | Chrome documentation; report UI | Produces lab audit results and category scores | Lighthouse |
| PageSpeed Insights | Google service; `/learn-lighthouse/pagespeed-insights-vs-lighthouse` | Presents Lighthouse diagnostics and available CrUX data | PageSpeed Insights (PSI) |
| Chrome UX Report | Google CrUX documentation | Aggregates eligible real-user experiences | Chrome UX Report (CrUX) |
| lab data | Learn articles; Lighthouse report | One configured test or recorded flow | lab data |
| Performance metrics | Lighthouse reports and tools | Measurements with source, scope, and units | Performance metrics |
| field data | CrUX; public Web Vitals definitions | Aggregated real-user measurements | field data |
| Passed audits | Lighthouse report | Checks satisfying the native pass predicate | Passed audits |
| Not applicable | Lighthouse report | Checks that do not apply to the page | Not applicable |
| Manual checks | Lighthouse report | Checks requiring human review | Additional items to manually check |
| Good Core Web Vitals metrics | Field comparison | Counts good measured metrics, separate from the assessment | Good Core Web Vitals metrics |
| Field histogram | CrUX field-data tools | Rating-bucket percentages, separate from p75 | field histogram |
| metric value | Report displays and threshold tables | Measured value, with units | metric value |
| metric score | Lighthouse scoring | Normalized score derived from a metric value | metric score |
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

Use Lighthouse's native audit titles, categories, metrics, and report groups.
Use Insights for modern insight audits. Historical Opportunities and Diagnostics groups remain valid for older reports.
Agentic Browsing and flow reports can display passed checks as a native fraction.
Exclude manual, not applicable, informative, and hidden checks from that fraction's denominator.
Unknown explicit audit modes and audit errors never establish a passed check.
Keep scan for Unlighthouse site-wide runs and scan history for saved runs.
Unlighthouse CI exports and its MCP integration keep their own names.

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

Performance metrics are measurements shown with source, device, scope, units, and coverage.
Use Core Web Vitals for LCP, INP, and CLS. Total Blocking Time remains a separate Lighthouse metric.
Use Core Web Vitals assessment only for eligible field measurements.
LCP and CLS are required. Missing INP does not prevent assessment when those measurements are sufficient.
If required field measurements are missing, the assessment is unavailable. Lab results never supply the field verdict.

Use Lighthouse Performance Score Calculator for the existing Performance category calculator.
Needs improvement is the documented middle score band. Keep upstream Average where it belongs.

### Native audit states

**Is:** Lighthouse's result modes, kept separate from scores and category groups.
**Use for:** Passed audits, Not applicable, Additional items to manually check, Informative audits, and Audit errors.
**Never:** passed for an error, manual check, informative result, or not applicable result.
**Casing:** use the listed public labels; preserve native mode identifiers.

### Good Core Web Vitals metrics

**Is:** the count of available field LCP, CLS, and INP metrics rated good.
**Use for:** comparisons showing good and measured counts, with missing metrics identified.
**Never:** CWV Score or pass rate for this count.
**Casing:** Good Core Web Vitals metrics.

### Field histogram

**Is:** percentages of eligible field measurements in good, needs improvement, and poor rating buckets.
**Use for:** field distribution bars and the local histogram response field.
**Never:** percentiles for bucket percentages. Keep provider percentile and p75 identifiers.
**Casing:** field histogram; histogram in identifiers.

### Metric value and metric score

**Is:** a measured value with units, and its normalized Lighthouse score, respectively.
**Use for:** measurement tables and score displays.
**Never:** score for a measured duration in seconds or milliseconds.
**Casing:** metric value; metric score. CLS score remains valid domain language.

### URL and origin

**Is:** a page identifier and its scheme/host/port scope, respectively.
**Use for:** the selected PSI/CrUX aggregation.
**Never:** tested page when the report is showing origin data.
**Casing:** URL; origin.

URL field data measures eligible real-user experiences for the selected URL and period.
Origin field data aggregates eligible real-user experiences across the selected origin and period.
Display scope, source identity, device, and collection period beside each field result.

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
