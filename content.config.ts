import { existsSync } from 'node:fs'
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { asSeoCollection } from '@nuxtjs/seo/content'
import { relative, resolve } from 'pathe'
import z from 'zod'
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
  // use github source
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

export const content = defineContentConfig({
  collections: {
    root: resolvableUnlighthouseCollection(),
  },
})

export default content
