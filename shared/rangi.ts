import type { ShjThemePair, ShjToken } from 'rangi'
import { tokenize } from 'rangi'
import { githubDark, githubLight } from 'rangi/themes'

// Single source of truth for code highlighting. `@harlan-zw/comark-content`
// highlights markdown code fences with the same rangi theme; this module covers
// the places that highlight code outside a content collection (navigation
// titles, release notes).
export const contentRangiTheme: ShjThemePair = {
  light: {
    ...githubLight,
    name: 'unlighthouse-github-light-aa',
    // Default github-light comment grey fails AA on white.
    tokens: { ...githubLight.tokens, cmnt: '#57606a' },
  },
  dark: githubDark,
}

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
  const requestedLanguage = lang.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'plain'
  const language = requestedLanguage === 'dotenv' || requestedLanguage === 'env' ? 'ini' : requestedLanguage
  const html = tokenize(code, { lang: language }).map((token) => {
    const value = escapeHtml(token.text)
    if (!token.type)
      return value
    const style = tokenStyle(token.type)
    return style ? `<span style="${style}">${value}</span>` : value
  }).join('')

  return {
    html,
    className: `rangi shj-lang-${requestedLanguage}`,
  }
}

export function inlineHighlightedCode(code: string, lang: string): string {
  const highlighted = highlightCode(code, lang)
  return `<code class="${highlighted.className}">${highlighted.html}</code>`
}
