---
title: "What is time to first byte (TTFB)?"
description: "Learn what time to first byte measures, the 800ms field guideline, and how to find delays in connections, redirects, and server work."
keywords:
  - what is time to first byte
  - ttfb meaning
  - ttfb definition
navigation:
  title: "TTFB"
relatedPages:
  - path: /tools/ttfb-checker
    title: TTFB Checker
  - path: /glossary/fcp
    title: First Contentful Paint (FCP)
  - path: /glossary/lcp
    title: Largest Contentful Paint (LCP)
  - path: /learn-lighthouse/lcp
    title: LCP Guide
---

Time to First Byte (TTFB) measures the delay from navigation start to the first response byte. It includes connection setup and server work. A slow document response can delay [FCP](/glossary/fcp) and [LCP](/glossary/lcp).

TTFB is a diagnostic metric. It is not one of the [Core Web Vitals](/learn-lighthouse/core-web-vitals).

## Thresholds

| Field TTFB | Rating |
| --- | --- |
| ≤ 800ms | Good |
| > 800ms and ≤ 1800ms | Needs improvement |
| > 1800ms | Poor |

Use these [Google guidelines](https://web.dev/articles/ttfb) at the 75th percentile of field measurements. They guide diagnosis, rather than decide the Core Web Vitals assessment.

Lighthouse's [Document request latency insight](https://developer.chrome.com/docs/performance/insights/document-latency) flags server responses above **600ms**. It also checks redirects and compression. That server response measurement excludes DNS and redirects, so it covers only part of navigation TTFB. TTFB does not directly contribute to the [Lighthouse Performance score](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring).

## What TTFB includes

- Redirect time
- Service worker startup, when applicable
- DNS lookup
- TCP connection
- TLS negotiation
- Server processing time

TTFB does not include downloading the full response body. With 103 Early Hints, the first response byte can arrive before the final document response.

## Measure TTFB

Use the [TTFB Checker](/tools/ttfb-checker) to compare available CrUX field data with a lab server-response measurement. The lab measurement excludes connection setup and redirects. Select the URL or origin scope and device. Missing URL data does not establish fast response times.

For one browser request, open DevTools **Network**, select the document, then open **Timing**. [Waiting (TTFB)](https://developer.chrome.com/docs/devtools/network/reference/#timing-explanation) includes a network round trip and server processing. Inspect DNS, connection setup and redirects separately.

For a repeatable command-line request:

```sh
curl --silent --show-error --output /dev/null \
  --write-out 'first byte: %{time_starttransfer}s\ntotal: %{time_total}s\n' \
  https://example.com/
```

[`time_starttransfer`](https://curl.se/docs/manpage.html#-w) reports seconds until the first response byte. This command measures one request from your machine. It does not follow redirects or measure a field percentile.

## Improve the slow phase

| If you find | Check next |
| --- | --- |
| Redirect delays | Link directly to the final URL |
| Slow connection setup | DNS, connection reuse, and distance to the server |
| Long server processing | Database queries, rendering work, and cold starts |
| Slow uncached responses | Cache eligibility and cache misses |

Google's [TTFB optimization guide](https://web.dev/articles/optimize-ttfb) explains these checks. Compare the same URL and test conditions after a change. If TTFB improves but LCP stays slow, inspect [resource loading and render delay](/learn-lighthouse/lcp).
