export interface ContentSearchEntry {
  id: string
  title: string
  titles: string[]
  content: string
  level: number
}

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/\s+/g, ' ').trim()
}

function scoreEntry(entry: ContentSearchEntry, query: string, terms: string[]): number | undefined {
  const title = normalize(entry.title)
  const ancestors = normalize(entry.titles.join(' '))
  const content = normalize(entry.content)
  const path = normalize(entry.id)
  const haystack = `${title} ${ancestors} ${content} ${path}`

  if (!terms.every(term => haystack.includes(term)))
    return

  return (title === query ? 1000 : 0)
    + (title.includes(query) ? 500 : 0)
    + terms.filter(term => title.includes(term)).length * 50
    + terms.filter(term => ancestors.includes(term)).length * 15
    + terms.filter(term => path.includes(term)).length * 5
    + terms.filter(term => content.includes(term)).length
    - entry.level
}

export function searchContentEntries(
  entries: readonly ContentSearchEntry[],
  rawQuery: string,
  limit: number,
): ContentSearchEntry[] {
  const query = normalize(rawQuery)
  const terms = query.split(' ').filter(Boolean)

  if (!terms.length || limit < 1)
    return []

  return entries
    .flatMap((entry) => {
      const score = scoreEntry(entry, query, terms)
      return score === undefined ? [] : [{ entry, score }]
    })
    .sort((a, b) => b.score - a.score || a.entry.level - b.entry.level || a.entry.title.localeCompare(b.entry.title))
    .slice(0, limit)
    .map(result => result.entry)
}
