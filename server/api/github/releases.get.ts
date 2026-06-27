import { initOctokitRequestHandler } from '~~/server/utils/github'

export default defineCachedEventHandler(async (e) => {
  const query = getQuery(e)
  const includeBody = query.body !== 'false'
  const limit = Math.max(1, Math.min(100, Number.parseInt(String(query.limit || '30'), 10) || 30))
  const { octokit, repo, owner } = initOctokitRequestHandler(e)
  const { data: res } = await octokit.request('GET /repos/{owner}/{repo}/releases', {
    repo,
    owner,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  return {
    fetchedAt: new Date().toISOString(),
    releases: res.slice(0, limit).map((release) => {
      const item: { name: string, publishedAt: string | null, body?: string | null } = {
        name: release.tag_name,
        publishedAt: release.published_at,
      }
      if (includeBody)
        item.body = release.body
      return item
    }),
  }
}, {
  // last for 1 hour
  maxAge: 60 * 60,
})
