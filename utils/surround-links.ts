import { joinURL } from 'ufo'

export interface SurroundEntry {
  path: string
}

export interface SurroundLink {
  rel: 'prev' | 'next'
  href: string
}

export function buildSurroundLinks(
  entries: readonly (SurroundEntry | null | undefined)[],
  siteUrl: string,
): SurroundLink[] {
  return entries.flatMap((entry, index) => entry
    ? [{
        rel: index === 0 ? 'prev' as const : 'next' as const,
        href: joinURL(siteUrl, entry.path),
      }]
    : [])
}
