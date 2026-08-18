import type { ShjToken } from 'rangi'
import { contentRangiLanguages, contentRangiTheme } from '@harlan-zw/comark-content'
import { tokenize } from 'rangi'

// Highlights code outside a content collection (navigation titles, release
// notes). `@harlan-zw/comark-content` ships the theme and the extra languages it
// uses for markdown code fences, so both paths render the same colours.

export interface HighlightedCode {
  className: string
  html: string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function tokenStyle(token: ShjToken): string {
  const light = contentRangiTheme.light.tokens[token]
  const dark = contentRangiTheme.dark.tokens[token]
  const color = light && dark && light !== dark ? `light-dark(${light},${dark})` : light ?? dark
  return [color ? `color:${color}` : '', token === 'cmnt' ? 'font-style:italic' : ''].filter(Boolean).join(';')
}

export function highlightCode(code: string, lang: string): HighlightedCode {
  const language = lang.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'plain'
  const html = tokenize(code, { lang: language, languages: contentRangiLanguages }).map((token) => {
    const value = escapeHtml(token.text)
    if (!token.type)
      return value
    const style = tokenStyle(token.type)
    return style ? `<span style="${style}">${value}</span>` : value
  }).join('')

  return {
    html,
    className: `rangi shj-lang-${language}`,
  }
}

export function inlineHighlightedCode(code: string, lang: string): string {
  const highlighted = highlightCode(code, lang)
  return `<code class="${highlighted.className}">${highlighted.html}</code>`
}
