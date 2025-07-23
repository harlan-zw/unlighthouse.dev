import { defineConfig } from '@nuxtjs/mdc/config'
import { transformerColorHighlight } from 'shiki-transformer-color-highlight'
import dir from './mdc/dir'
import robotsTxt from './mdc/robots-txt'

export default defineConfig({
  shiki: {
    async setup(highlighter) {
      await highlighter.loadLanguage(robotsTxt, dir)
    },
    transformers: [
      transformerColorHighlight(),
    ],
  },
})
