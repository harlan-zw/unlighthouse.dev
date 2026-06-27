import { queryCollectionSearchSections } from '@nuxt/content/server'

export default defineCachedEventHandler(async (event) => {
  const [root, glossary] = await Promise.all([
    queryCollectionSearchSections(event, 'root'),
    queryCollectionSearchSections(event, 'glossary'),
  ])

  return [...root, ...glossary]
}, {
  maxAge: 60 * 60 * 24,
  swr: true,
})
