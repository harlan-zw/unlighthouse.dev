import type { ShikiTransformer } from 'shiki'
import { defineConfig } from '@nuxtjs/mdc/config'
import { transformerColorHighlight } from 'shiki-transformer-color-highlight'
import dir from './mdc/dir'
import robotsTxt from './mdc/robots-txt'

// The color transformer still ships Shiki 3 types, but its runtime hook shape is
// compatible with the Shiki 4 transformer contract used by Nuxt Content.
const colorHighlightTransformer = transformerColorHighlight() as unknown as ShikiTransformer

export default defineConfig({
  shiki: {
    async setup(highlighter) {
      await highlighter.loadLanguage(robotsTxt, dir)
    },
    transformers: [
      colorHighlightTransformer,
    ],
  },
})
