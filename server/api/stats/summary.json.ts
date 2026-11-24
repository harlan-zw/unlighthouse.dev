import { defineCachedHandler } from 'nitro/cache'
import { serverFetch } from 'nuxt/server'
import { readRouteJson } from '../../utils/route-json'

export default defineCachedHandler(async (event) => {
  const request = { req: new Request(event.req.url, { headers: event.req.headers }), context: event.context }
  const [stars, downloads] = await Promise.all([
    readRouteJson(serverFetch(request, '/api/github/stars')),
    readRouteJson(serverFetch(request, '/api/npm/downloads')),
  ])

  return {
    fetchedAt: Date.now(),
    stars,
    downloads: {
      totalDownloads30: downloads.totalDownloads30,
      totalDownloads90: downloads.totalDownloads90,
      averageDownloads30: downloads.averageDownloads30,
      averageDownloads90: downloads.averageDownloads90,
      percentageChange: downloads.percentageChange,
    },
  }
}, {
  maxAge: 60 * 60 * 24,
  swr: true,
})
