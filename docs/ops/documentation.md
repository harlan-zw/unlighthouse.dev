# Documentation versions

Stable documentation uses the package repository's `0.x` branch.
Existing `/guide`, `/integrations`, and `/api-doc` URLs remain stable.
Beta documentation uses the `v1` branch at `/v1`.
The version switch preserves matching pages and otherwise opens installation.

Merge package PR #422 before merging the beta website change.
The package branch owns the documentation content.
The website owns rendering, navigation, search, and page actions.

## Local beta preview

Set an explicit source directory for development:

```sh
UNLIGHTHOUSE_BETA_DOCS_DIR=~/pkg/unlighthouse.fix-v1-cli-api-migration/docs pnpm dev
```

Production builds ignore this directory and load both GitHub branches.
A local package checkout does not change the stable source.

Beta navigation omits the removed Nuxt, Vite, and Webpack integrations.
Edit links and commit metadata use the selected branch.
Search labels beta results with `v1 beta`.
