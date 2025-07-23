function customSortSemver(a, b) {
  const aParts = String(a).split('.')
  const bParts = String(b).split('.')
  for (let i = 0; i < aParts.length; i++) {
    if (aParts[i] === bParts[i]) {
      continue
    }
    return Number.parseInt(bParts[i]) - Number.parseInt(aParts[i])
  }
  return 0
}

export default defineCachedEventHandler(async (e) => {
  const [stars, commitCount, issuesClosed, releases, downloads, contributors] = await Promise.all([
    e.$fetch(`/api/github/stars`),
    e.$fetch(`/api/github/commit-count`),
    e.$fetch(`/api/github/issues-closed`),
    e.$fetch(`/api/github/releases`),
    e.$fetch(`/api/npm/downloads`),
    e.$fetch(`/api/github/contributors`),
  ])
  // get all major versions from releases, need to map into major version groups then get first child
  const versionGroups = (releases?.releases || []).map(r => r.name).reduce((group, v) => {
    const [major] = v.split('.').slice(0, 1)
    group[major] = group[major] || []
    group[major].push(v)
    return group
  }, [])
  // first of each group make an object, sort so we get the oldest version
  const versions = Object.values(versionGroups).sort(customSortSemver).map(v => v[0]).map(v => v.startsWith('v') ? v : `v${v}`).sort((a, b) => b.localeCompare(a))
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
