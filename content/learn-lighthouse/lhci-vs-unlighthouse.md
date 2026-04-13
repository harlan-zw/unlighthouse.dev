---
title: "LHCI vs Unlighthouse: Which Lighthouse CI Tool Should You Use?"
description: "Honest side-by-side comparison of @lhci/cli and Unlighthouse. Setup, URL discovery, budgets, reporting, and when each tool fits your workflow."
navigation:
  title: LHCI vs Unlighthouse
icon: i-heroicons-scale
publishedAt: "2026-04-13"
updatedAt: "2026-04-13"
readTime: "8 min"
keywords:
  - lhci vs unlighthouse
  - lighthouse ci vs unlighthouse
  - "@lhci/cli alternative"
  - lhci alternative
  - bulk lighthouse ci alternative
  - lighthouse ci comparison
  - unlighthouse vs @lhci/cli
  - lhci autorun alternative
tags:
  - lighthouse-ci
  - lhci
  - comparison
  - ci-cd
relatedPages:
  - path: /learn-lighthouse/lighthouse-ci
    title: Lighthouse CI Guide
  - path: /integrations/ci
    title: Unlighthouse CI Integration
  - path: /learn-lighthouse/bulk-lighthouse-testing
    title: Bulk Lighthouse Testing
  - path: /tools/bulk-pagespeed
    title: Bulk PageSpeed Test
---

`@lhci/cli` (from Google) is best for tracking a known list of critical URLs over time with performance budgets and historical dashboards. Unlighthouse is best for auditing every page of a site at once via auto-discovery. The two tools solve different problems.

## The two tools

::TabComparison
  ::div{label="@lhci/cli" icon="i-heroicons-command-line"}
  Google's official Lighthouse CI. You provide a list of URLs, it runs Lighthouse N times per URL, asserts against budgets, and uploads results to temporary storage, the filesystem, or an LHCI server. Around [2.3M monthly npm downloads](https://www.npmjs.com/package/@lhci/cli) in 2026 (following the Feb 2026 registry bot-filtering event).

  ```bash
  npm install -g @lhci/cli
  lhci autorun
  ```
  ::

  ::div{label="Unlighthouse" icon="i-simple-icons-lighthouse"}
  Open-source CLI that crawls your sitemap and internal links, then runs Lighthouse on every discovered route. Produces a navigable HTML client, JSON exports, and CI assertions. No URL manifest needed. Around [100k monthly downloads](https://www.npmjs.com/package/unlighthouse).

  ```bash
  npx unlighthouse --site https://example.com
  ```
  ::
::

## Side-by-side comparison

| | @lhci/cli | Unlighthouse |
|---|---|---|
| **Made by** | Google Chrome team | Harlan Wilton (OSS) |
| **Setup time** | 10-30 min (config file + budgets) | Under 1 min (zero config) |
| **URL discovery** | Manual list in `lighthouserc.js` | Auto-crawl via sitemap, robots.txt, links |
| **Default URLs tested** | Only what you specify | Every internal route found |
| **Performance budgets** | Yes, per URL, rich assertions | Yes, global score thresholds |
| **Architecture** | Sequential/Isolated for precision | **Smart Sampling** for site-wide speed |
| **Historical tracking** | Yes via @lhci/server | No built-in dashboard |
| **Local HTML UI** | Static report per URL | Interactive client, sortable, filterable |
| **CI integration** | First-party GitHub App, status checks | `unlighthouse-ci` command, JSON output |
| **PR comments** | Via GitHub App | Via third-party actions |
| **Variance reduction** | Runs N times, uses median | Configurable, defaults to 1 run |
| **Server/DB required** | Optional (LHCI server) | No |
| **npm downloads (monthly)** | ~2.3M | ~100k |
| **Best for** | Regression tracking on key URLs | Site-wide audits, catching outliers |

## When to use @lhci/cli

Pick LHCI when:

- You have a handful of critical URLs (homepage, checkout, product page) and want to track them over weeks or months.
- You need [hard performance budgets enforced on every PR](https://web.dev/articles/lighthouse-ci#budgets), with builds failing when thresholds break.
- You want to use **Lighthouse 13** diagnostics (requires LHCI v0.15+ and [Node.js 22+](https://nodejs.org/en/blog/release/v22.0.0)).
- You want a historical dashboard showing score trends, and you're willing to [host @lhci/server](/learn-lighthouse/lighthouse-ci/server) or use temporary public storage.
- You're already invested in the Google Chrome tooling ecosystem and want [first-party GitHub App integration](https://github.com/apps/lighthouse-ci).

LHCI's strength is depth on a narrow set of pages. It was designed for the workflow where a team picks 5 to 10 representative URLs, sets budgets, and watches for regressions commit by commit. In 2026, the roadmap focuses on [SHA-pinning security](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#using-third-party-actions) for all CI actions to prevent supply chain attacks.

## When to use Unlighthouse

Pick Unlighthouse when:

- You want to audit the entire site, not just a predefined list.
- You don't know which pages are slowest, and you want to find out.
- You need to audit 1,000+ pages; Unlighthouse's **Smart Sampling** identifies route patterns and only audits representative samples, making it [10x faster than sequential testing](/guide/guides/dynamic-sampling).
- Setup speed matters; you want to go from install to results in under a minute.
- You need to spot patterns across routes, for example a shared layout causing [CLS](/learn-lighthouse/cls) on 200 blog posts.
- You want an interactive UI for browsing per-page results, not static HTML reports.

Unlighthouse's strength is breadth. It finds problems you didn't know to look for. The homepage might score 95, while `/pricing/enterprise` scores 62 because a marketing tag manager ships 400KB of JavaScript that never hit the homepage.

## Running both in parallel

The tools complement each other. A common setup:

- **Every PR**: `@lhci/cli` runs on 5-10 critical URLs with strict budgets. Fast feedback, historical tracking via LHCI server.
- **Weekly scheduled job**: Unlighthouse scans the full site, posts a summary to Slack, flags any page scoring below 70.

:::code-group
```yaml [PR Pipeline (LHCI)]
name: Lighthouse CI
on: [pull_request]
jobs:
  lhci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx @lhci/cli@latest autorun
```

```yaml [Weekly Audit (Unlighthouse)]
name: Weekly Health Check
on:
  schedule:
    - cron: '0 6 * * 1' # Monday 6am
jobs:
  unlighthouse:
    runs-on: ubuntu-latest
    steps:
      - run: npx unlighthouse-ci --site https://example.com --build-static
      - uses: actions/upload-artifact@v4
        with:
          name: unlighthouse-report
          path: .unlighthouse
```
:::

## Summary

Pick `@lhci/cli` for deep regression tracking on a curated URL list with historical dashboards. Pick Unlighthouse for fast, site-wide audits that surface problems across every route. Run both if you want per-PR gates plus scheduled full-site coverage.

:UButton{to="/" size="lg" label="Try Unlighthouse" icon="i-heroicons-rocket-launch"}
