import rangi from '@comark/nuxt/plugins/rangi'
import { contentRangiTheme } from './rangi'

// Comark plugin set for `<Markdown>` outside a content collection (release
// notes). Matches the highlighting `@harlan-zw/comark-content` applies to docs.
export const markdownPlugins = [rangi({
  classPrefix: 'rangi',
  lineNumbers: true,
  preStyles: false,
  theme: contentRangiTheme,
})]
