import { defineCollection, defineContentConfig } from '@harlan-zw/comark-content'
import { defineRobotsSchema } from '@nuxtjs/robots/content'
import { defineSitemapSchema } from '@nuxtjs/sitemap/content'
import { defineOgImageSchema } from 'nuxt-og-image/content'
import { defineSchemaOrgSchema } from 'nuxt-schema-org/content'
import { z } from 'zod'

const schema = z.object({
  icon: z.string().optional(),
  publishedAt: z.string().optional(),
  updatedAt: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  readTime: z.string().optional(),
  ogImageComponent: z.string().optional(),
  new: z.boolean().optional(),
  deprecated: z.boolean().optional(),
  ogImage: defineOgImageSchema(),
  schemaOrg: defineSchemaOrgSchema(),
  robots: defineRobotsSchema(),
  sitemap: defineSitemapSchema(),
  relatedPages: z.array(z.object({
    path: z.string(),
    title: z.string(),
  })).optional(),
})

// Branches are explicit. A developer's package checkout must not select the docs version.
function unlighthouseCollection(branch: '0.x' | 'v1', prefix: string) {
  return defineCollection({
    schema,
    type: 'page',
    source: {
      ...(process.env.NODE_ENV !== 'production' && branch === 'v1' && process.env.UNLIGHTHOUSE_BETA_DOCS_DIR
        ? { cwd: process.env.UNLIGHTHOUSE_BETA_DOCS_DIR }
        : { repository: { url: 'https://github.com/harlan-zw/unlighthouse', branch } }),
      include: process.env.NODE_ENV !== 'production' && branch === 'v1' && process.env.UNLIGHTHOUSE_BETA_DOCS_DIR ? '**/*.md' : 'docs/**/*.md',
      exclude: branch === 'v1' ? ['**/glossary/**', '**/3.nuxt.md', '**/4.vite.md', '**/webpack.md', '**/0.unlighthouse-cli.md'] : ['**/glossary/**'],
      prefix,
    },
  })
}

// Local content collections
const glossary = defineCollection({
  schema,
  type: 'page',
  source: {
    include: '**/*.md',
    cwd: 'content/glossary',
    prefix: '/glossary',
  },
})

const learnLighthouse = defineCollection({
  schema,
  type: 'page',
  source: {
    include: '**/*.md',
    cwd: 'content/learn-lighthouse',
    prefix: '/learn-lighthouse',
  },
})

export const content = defineContentConfig({
  collections: {
    root: unlighthouseCollection('0.x', '/'),
    beta: unlighthouseCollection('v1', '/v1'),
    glossary,
    learnLighthouse,
    // blog,
    // cloud,
    // tools,
    // compare,
    // automation,
    // frameworks,
  },
})

export default content
