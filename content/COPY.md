# Article voice

Write for a developer solving one performance problem. Give the answer before the mechanism.
Use one real report or small example, then reveal the next useful detail.

- Keep lab measurements, field distributions, and the Lighthouse Performance score separate.
- Put the device, scope, version, units, and measurement limits beside the result they qualify.
- Teach readers what to inspect next. Avoid winner columns when tools answer different questions.
- Use current report labels. Explain retired audit names only where they help readers find older reports.
- Treat numbers in Vue components, tooltips, tables, FAQs, and metadata as article claims.
- Label conceptual demonstrations. Never use recreated browser UI as evidence of a real result.
- Do not promise milliseconds, ranking gains, full audit coverage, or consistent scores without measured evidence.
- Mention Unlighthouse only when an inspected capability helps the reader's task. No mandatory promotional ending.
- Keep existing publication dates and URLs. Update the review date only after the article itself changes and passes review.

Run factual review before both humanize-writing passes. Remove repetition and stock framing first, then improve the teaching sequence.
Keep useful technical detail. Recheck examples, source qualifications, and visual meaning after humanization.

## Tool result copy

Write for a developer interpreting one result. Keep the source and measurement scope beside the value.
Use the following labels exactly across tool results, metadata, and related links.

| Asset | String | Use |
| --- | --- | --- |
| Performance metric group | Performance metrics | Broad metric lists |
| Lab result group | Lighthouse lab results | Controlled test results |
| Field assessment | Core Web Vitals assessment | Eligible field assessment |
| Unavailable field assessment | Core Web Vitals assessment unavailable | Required field measurements missing |
| Passed audits | Passed audits | Native passed checks |
| Manual checks | Additional items to manually check | Native manual checks |
| Not applicable | Not applicable | Native irrelevant checks |
| Audit information | Informative audits | Native informative results |
| Audit errors | Audit errors | Native errors |
| Category fraction | {passed}/{eligible} | Native fraction category displays |
| Insights | Insights | Modern Lighthouse insight audits |
| Insight estimates | Estimated savings by metric | Provider estimates in each metric's units |
| Field URL scope | URL field data | URL measurements |
| Field origin scope | Origin field data | Origin measurements |
| Raw PSI CLS | Raw PSI CLS value | Undecoded PSI field CLS value |
| Unavailable field result | Field data unavailable | Field request could not supply a result |
| Good field metrics | Good Core Web Vitals metrics | Count shown as {good} of {measured} |
| Calculator | Lighthouse Performance Score Calculator | Performance-only calculator |
| Calculator compact link | Performance Score Calculator | Lighthouse context already present |
| Middle rating | Needs improvement | Documented middle score band |
| Lab fallback action | Inspect lab metrics | Link to lab diagnostics when field data is missing |

Never describe a lab proxy as a field assessment. Never call unmeasured values good, poor, or failed.
Keep native audit titles and fixed provider fields. Keep historical report group names when reading older reports.
