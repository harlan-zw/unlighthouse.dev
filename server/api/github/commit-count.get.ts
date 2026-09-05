import { initOctokitRequestHandler } from '~~/server/utils/github'
import { parseGitHubLastPage } from '~~/shared/github'

export default defineCachedEventHandler(async (e) => {
  const { octokit, repo, owner } = initOctokitRequestHandler(e)
  const { headers } = await octokit.request('GET /repos/{owner}/{repo}/commits', {
    repo,
    owner,
    state: 'closed',
    per_page: 1,
    page: 1,
    sha: 'main',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  return parseGitHubLastPage(headers.link)
}, {
  // last for 1 week
  name: 'commit-count-v2',
  maxAge: 60 * 60 * 24 * 7,
})
