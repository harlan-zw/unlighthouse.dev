const PRODUCTION_HOSTNAME = 'unlighthouse.dev'
const HSTS_POLICY = 'max-age=31536000; includeSubDomains'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)

  if (url.hostname !== PRODUCTION_HOSTNAME)
    return

  setResponseHeader(event, 'strict-transport-security', HSTS_POLICY)

  if (url.pathname.endsWith('.md'))
    setResponseHeader(event, 'x-robots-tag', 'noindex, follow')

  if (url.protocol === 'http:') {
    url.protocol = 'https:'
    return sendRedirect(event, url.toString(), 301)
  }
})
