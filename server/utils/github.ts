import type { H3Event } from 'h3'
import { Octokit } from 'octokit'

export function initOctokitRequestHandler(e: H3Event) {
  const { githubAccessToken } = useRuntimeConfig(e)
  if (!githubAccessToken) {
    throw new Error('Missing githubAccessToken')
  }
  const repo = 'harlan-zw/unlighthouse'
  const octokit = new Octokit({
    auth: githubAccessToken,
  })
  return {
    repo: repo.split('/')[1],
    owner: repo.split('/')[0],
    octokit,
  }
}

export const cachedFetchGitHubRaw = defineCachedFunction(async (e: H3Event, fullPath: string) => {
  const { githubAccessToken } = useRuntimeConfig(e)
  if (!githubAccessToken) {
    throw new Error('Missing githubAccessToken')
  }
  fullPath = fullPath.replace('@', '/')
  if (!fullPath?.startsWith('harlan-zw/')) {
    throw new Error(`Invalid repo ${fullPath}`)
  }
  const repo = fullPath.split('/')[1]
  const owner = fullPath.split('/')[0]
  const path = fullPath.split('/').slice(2).join('/')
  const octokit = new Octokit({
    auth: githubAccessToken,
  })
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner,
    repo,
    path,
  }).catch((err) => {
    console.error(err)
    throw new Error(`Failed to fetch file content from GitHub for ${fullPath}`)
  })

  // Decode the Base64 content
  return Buffer.from(data.content, 'base64').toString('utf-8')
}, {
  maxAge: 60 * 60, // 1 hour
  name: 'ghRaw',
  getKey: (event: H3Event, fullPath: string) => fullPath,
})
