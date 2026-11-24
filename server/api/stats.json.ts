import { defineCachedHandler } from 'nitro/cache'
import { serverFetch } from 'nuxt/server'
import { readRouteJson } from '../utils/route-json'

function customSortSemver(a: string, b: string) {
  const aParts = String(a).split('.')
  const bParts = String(b).split('.')
  for (let i = 0; i < aParts.length; i++) {
    if (aParts[i] === bParts[i]) {
      continue
    }
    return Number.parseInt(bParts[i]!) - Number.parseInt(aParts[i]!)
  }
  return 0
}

export default defineCachedHandler(async (event) => {
  const request = { req: new Request(event.req.url, { headers: event.req.headers }), context: event.context }
  const [stars, commitCount, issuesClosed, releases, downloads, contributors] = await Promise.all([
    readRouteJson(serverFetch(request, '/api/github/stars')),
    readRouteJson(serverFetch(request, '/api/github/commit-count')),
    readRouteJson(serverFetch(request, '/api/github/issues-closed')),
    readRouteJson(serverFetch(request, '/api/github/releases?body=false&limit=100')),
    readRouteJson(serverFetch(request, '/api/npm/downloads')),
    readRouteJson(serverFetch(request, '/api/github/contributors')),
  ])
  // get all major versions from releases, need to map into major version groups then get first child
  const versionGroups = (releases?.releases || []).map(r => r.name).reduce((group: Record<string, string[]>, v) => {
    const major = v.split('.')[0]!
    group[major] = group[major] || []
    group[major]!.push(v)
    return group
  }, {})
  // first of each group make an object, sort so we get the oldest version
  const versions = Object.values(versionGroups).sort((a, b) => customSortSemver(a[0]!, b[0]!)).map(v => v[0]!).map(v => v.startsWith('v') ? v : `v${v}`).sort((a, b) => b.localeCompare(a))
  return {
    fetchedAt: Date.now(),
    versions,
    stars,
    commitCount,
    issuesClosed,
    downloads,
    releases,
    contributors,
  }
}, {
  // last for 1 day
  maxAge: 60 * 60 * 24,
  swr: true,
})
