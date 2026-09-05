const LINK_LAST_RE = /^<([^>]+)>;\s*rel="?last"?$/

/**
 * Read the last page number from a GitHub `Link` response header.
 *
 * GitHub points at the final page of a paginated list with an entry shaped like
 * `<https://api.github.com/.../commits?sha=main&per_page=1&page=783>; rel="last"`. The query
 * parameter order is not stable, so the page is read through `URL.searchParams` rather than a
 * positional regex. A missing header means a single-page result, so 1 is the safe fallback, and a
 * malformed last entry cannot reveal the count, so it falls back the same way.
 */
export function parseGitHubLastPage(link: string | null | undefined): number {
  if (!link) {
    return 1
  }
  const lastEntry = link.split(',').find(entry => LINK_LAST_RE.test(entry.trim()))
  if (!lastEntry) {
    return 1
  }
  const url = lastEntry.trim().match(LINK_LAST_RE)![1]!
  try {
    const page = Number.parseInt(new URL(url).searchParams.get('page') ?? '', 10)
    return Number.isNaN(page) ? 1 : page
  }
  catch {
    return 1
  }
}
