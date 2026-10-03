import { queryCollectionSearchSections } from '@harlan-zw/comark-content/server'
import { toolCatalog } from '~~/shared/tool-catalog'

const toolSearchSections = [
  {
    id: '/tools',
    title: 'Free Lighthouse and Core Web Vitals Tools',
    titles: [],
    level: 1,
    content: 'Free performance tools for Lighthouse, Core Web Vitals, PageSpeed Insights, HAR files, JSON payloads, and page size.',
  },
  ...toolCatalog.map(tool => ({
    id: tool.to,
    title: tool.title,
    titles: ['Performance Tools'],
    level: 1,
    content: `${tool.description} ${tool.metrics.join(', ')}.`,
  })),
]

export default defineCachedEventHandler(async (event) => {
  const [root, beta, glossary, learnLighthouse] = await Promise.all([
    queryCollectionSearchSections(event, 'root'),
    queryCollectionSearchSections(event, 'beta'),
    queryCollectionSearchSections(event, 'glossary'),
    queryCollectionSearchSections(event, 'learnLighthouse'),
  ])

  return [...root, ...beta.map(entry => ({ ...entry, title: `${entry.title} (v1 beta)` })), ...glossary, ...learnLighthouse, ...toolSearchSections]
}, {
  maxAge: 60 * 60 * 24,
  swr: true,
})
