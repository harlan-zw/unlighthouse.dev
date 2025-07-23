# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm dev` - Start development server on http://localhost:3000
- `pnpm build` - Build for production (runs `nuxi prepare` and `nuxi build`)
- `pnpm deploy` - Deploy to Netlify with NITRO_PRESET=netlify
- `pnpm lint:docs` - Lint documentation files
- `pnpm lint:docs:fix` - Fix linting issues in documentation
- `pnpm lint` - Run ESLint on the codebase
- `pnpm twoslash:verify` - Verify TypeScript code snippets in documentation

### Dependencies
- `pnpm add <package>` - Add a new dependency
- `pnpm remove <package>` - Remove a dependency
- `pnpm update` - Update dependencies

## Architecture

### Framework Stack
- **Nuxt**: v3.16.2 with compatibility version 4
- **Content**: @nuxt/content v3 (latest PR build) with D1 database
- **UI**: @nuxt/ui-pro v3.0.2 with Tailwind CSS v4
- **TypeScript**: Full type safety throughout
- **SEO**: @nuxtjs/seo module (the main focus of this documentation site)

### Content Organization
The site documents multiple SEO-related modules. Content is organized by:
- `/docs/[module]/[section]/[page]` - Module documentation
- `/learn/` - Educational content about SEO concepts
- `/recipes/` - Implementation guides
- `/snippets/` - Code examples

### Key Modules Documented
- `nuxt-seo` - Main SEO module
- `robots` - Robots.txt management
- `sitemap` - Sitemap generation
- `og-image` - Open Graph image generation
- `schema-org` - Schema.org structured data
- `link-checker` - Link validation
- `seo-utils` - SEO utilities
- `site-config` - Site configuration

### Deployment
- Primary: Netlify deployment with Cloudflare Pages compatibility
- Database: Cloudflare D1 for content storage
- Analytics: Fathom Analytics (production only)
- OG Images: Zero runtime with custom fonts (Hubot Sans)

### API Integrations
- GitHub API: Stars, sponsors, commit data
- npm API: Download statistics
- Twitter/X API: Tweet embeds
- LLMs: nuxt-llms for AI features

### Styling

Use the following CSS variables within tailwind classes to ensure consistency across the application.

Text classes:

- `text-[var(--ui-text)]`: Default text color
- `text-[var(--ui-text-muted)]`: Muted text color
- `text-[var(--ui-text-dimmed)]`: Dimmed text color
- `text-[var(--ui-text-highlighted)]`: Highlighted text color
- `text-[var(--ui-text-accented)]`: Accented text color
- `text-[var(--ui-text-inverted)]`: Inverted text color
- `text-[var(--ui-text-success)]`: Success text color
- `text-[var(--ui-text-error)]`: Error text color
- `text-[var(--ui-text-warning)]`: Warning text color
- `text-[var(--ui-text-info)]`: Info text color
- `text-[var(--ui-text-primary)]`: Primary text color
- `text-[var(--ui-text-secondary)]`: Secondary text color
- `text-[var(--ui-text-gray)]`: Gray text color

Background classes:

- `bg-[var(--ui-bg)]`: Default background color
- `bg-[var(--ui-bg-muted)]`: Muted background color
- `bg-[var(--ui-bg-elevated)]`: Elevated background color
- `bg-[var(--ui-bg-accented)]`: Accented background color
- `bg-[var(--ui-bg-inverted)]`: Inverted background color

Border classes:

- `border-[var(--ui-border)]`: Default border color
- `border-[var(--ui-border-muted)]`: Muted border color
- `border-[var(--ui-border-accented)]`: Accented border color
- `border-[var(--ui-border-inverted)]`: Inverted border color
