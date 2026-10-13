# Markdown negotiation

Agents that send `Accept: text/markdown` get a page's Markdown from two [Cloudflare](https://cloudflare.com) zone rules, not from the Worker.
The prerender writes a static `.md` asset beside each page, and the rules serve it.

| Rule | Ruleset | Phase | Effect |
| --- | --- | --- | --- |
| Rewrite | `683cf06a48c342d0af1e9b580717f6f0` | `http_request_transform` | If the request accepts `text/markdown`, rewrite the page path to its `.md` asset. |
| Vary (`markdown-vary`) | `f87333442e6b40da8870dcf98a51ee3c` | `http_response_headers_transform` | Set `Vary: Accept` on the same pages, for HTML and Markdown. |

The rewrite phase runs before the cache.
The Vary rule sets the header, so each response sends one `Vary: Accept`.
A `_headers` rule per page does not fit: Cloudflare allows 100 `_headers` rules, and the site prerenders more pages than that.

Both rules match these paths:

- `/`
- `/learn-lighthouse`, `/glossary`, `/tools`, `/integrations`, `/guide`, and `/v1`, plus every path under them
- `/releases` and `/integration-deprecations`

Both rules skip any path that ends in `/` or contains a `.`.
A new page under an existing prefix needs no rule change.
A new top-level page or prefix needs adding to both rules in the zone.

Check a page after a deploy or a rule change:

```bash
curl -sI -H 'Accept: text/markdown' https://unlighthouse.dev/glossary/lcp | rg -i 'content-type|vary'
curl -sI https://unlighthouse.dev/glossary/lcp | rg -i 'content-type|vary'
```

The first command prints `text/markdown`, the second prints `text/html`.
Each prints one `vary: Accept`.
