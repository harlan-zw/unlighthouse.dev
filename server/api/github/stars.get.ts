import { defineCachedHandler } from 'nitro/cache'
import { initOctokitRequestHandler } from '~~/server/utils/github'

export default defineCachedHandler(async (e) => {
  const { octokit, repo, owner } = initOctokitRequestHandler(e)
  const { data: res } = await octokit.request('GET /repos/{owner}/{repo}', {
    repo,
    owner,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  return {
    stars: res.stargazers_count,
    updated_at: res.updated_at,
  }
}, {
  swr: true,
  maxAge: 60 * 60,
})
