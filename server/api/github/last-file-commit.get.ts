import type { H3Event } from 'h3'
import { getQuery } from 'h3'
import { logger } from '~~/logger'
import { initOctokitRequestHandler } from '~~/server/utils/github'

export default defineCachedEventHandler(async (e) => {
  setHeader(e, 'Content-Type', 'application/json')
  const { octokit, repo, owner } = initOctokitRequestHandler(e)
  let path = String(getQuery(e)?.file) // something is strippign the .md
  if (!path.endsWith('.md')) {
    path = `${path}.md`
  }
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/commits', {
    owner,
    repo,
    path,
    per_page: 1,
  })

  if (!data?.[0]) {
    // make sure we return as json
    return createError({
      statusCode: 404,
      statusMessage: 'No commits found for the specified file',
    })
  }

  const lastCommit = data[0]

  // Get committer info, handling web-flow case (PRs)
  let committerName = lastCommit.commit.author.name
  let committerLogin = lastCommit.committer?.login
  let committerAvatar = lastCommit.committer?.avatar_url
  let commitUrl = lastCommit.html_url

  // If committer is web-flow, try to get the actual PR author
  if (committerLogin === 'web-flow') {
    try {
      // Extract PR number from squashed commit message (#166)
      const prMatch = lastCommit.commit.message.match(/#(\d+)/)
      if (prMatch && prMatch[1]) {
        const prNumber = prMatch[1]
        const { data: prData } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
          owner,
          repo,
          pull_number: Number.parseInt(prNumber),
        })

        // Use PR author instead of web-flow
        committerLogin = prData.user.login
        committerAvatar = prData.user.avatar_url
        committerName = prData.user.name || committerLogin
        commitUrl = prData.html_url
      }
    }
    catch (error) {
      logger.warn(`Failed to fetch PR info for commit ${lastCommit.sha}: ${error}`)
    }
  }

  // date is in the format  "2024-10-21T14:19:05Z" - we need to convert it to Oct 22, 2024
  const date = lastCommit.commit.author.date
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  return {
    author: {
      name: committerName.toLowerCase().startsWith('harlan') ? 'Harlan Wilton' : committerName,
      committer: committerLogin,
      avatar: committerAvatar,
    },
    dateHuman: formattedDate,
    date: lastCommit.commit.author.date,
    url: commitUrl,
    message: lastCommit.commit.message,
  }
}, {
  name: 'github-last-commit',
  maxAge: 60 * 60 * 24, // 1 day
  getKey: (e: H3Event) => getQuery(e)?.file,
})
