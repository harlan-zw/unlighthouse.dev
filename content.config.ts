import { existsSync } from 'node:fs'
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { asSeoCollection } from '@nuxtjs/seo/content'
import { relative, resolve } from 'pathe'
import { z } from 'zod'
import { logger } from './logger'

const schema = z.object({
  icon: z.string().optional(),
  publishedAt: z.string().optional(),
  updatedAt: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  readTime: z.string(),
  ogImageComponent: z.string().optional(),
  new: z.boolean().optional(),
  deprecated: z.boolean().optional(),
})

function resolvableUnlighthouseCollection() {
  const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd()
  const localDirPaths = new Set([
    resolve(homeDir, 'pkg', 'unlighthouse-alt', 'docs'),
    resolve(homeDir, 'pkg', 'unlighthouse', 'docs'),
  ])
  for (const localDirPath of localDirPaths) {
    if (existsSync(localDirPath)) {
      logger.info(`🔗 Docs source using local fs: ${relative(process.cwd(), localDirPath)}`)
      return defineCollection({
        schema,
        type: 'page',
        source: {
          include: '**/*.md',
          cwd: localDirPath,
          prefix: `/`,
        },
      })
    }
  }
  logger.info(`🔗 Docs source using GitHub`)
  return defineCollection(asSeoCollection({
    schema,
    type: 'page',
    source: {
      repository: `https://github.com/harlan-zw/unlighthouse`,
      include: 'docs/**/*.md',
      prefix: `/`,
    },
  }))
}

// Local content collections
const glossary = defineCollection(asSeoCollection({
  schema,
  type: 'page',
  source: {
    include: '**/*.md',
    cwd: 'content/glossary',
    prefix: '/glossary',
  },
}))

const learnLighthouse = defineCollection(asSeoCollection({
  schema,
  type: 'page',
  source: {
    include: '**/*.md',
    cwd: 'content/learn-lighthouse',
    prefix: '/learn-lighthouse',
  },
}))

export const content = defineContentConfig({
  collections: {
    root: resolvableUnlighthouseCollection(),
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
