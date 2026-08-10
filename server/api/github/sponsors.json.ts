import { fetchGitHubSponsors } from 'sponsorkit'
import { appStorage } from '~~/server/storage'
import { preparePublicSponsors } from '~~/server/utils/sponsors'

export default defineCachedEventHandler(async (e) => {
  const storedToken = await appStorage().get<string>('github:token').catch((error) => {
    console.error('[sponsors] Failed to read the stored GitHub token, using runtime config.', error)
    return null
  })
  const token = storedToken || useRuntimeConfig(e).githubAuthToken
  if (!token) {
    return {
      others: [],
      $25: [],
      $50: [],
    }
  }
  const _sponsors = await fetchGitHubSponsors(token, 'harlan-zw', 'user', {
    force: true, // use nitro cache
  }).catch((e) => {
    console.error(e)
    return []
  })

  return preparePublicSponsors(_sponsors)
}, {
  // last for 1 day
  getKey() {
    return 'github:sponsors:harlan-zw'
  },
  maxAge: 60 * 60 * 24,
  swr: true,
})
