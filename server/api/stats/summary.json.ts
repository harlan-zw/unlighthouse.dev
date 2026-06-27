export default defineCachedEventHandler(async (e) => {
  const [stars, downloads] = await Promise.all([
    e.$fetch('/api/github/stars'),
    e.$fetch('/api/npm/downloads'),
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
