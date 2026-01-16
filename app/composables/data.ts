import { useAsyncData } from '#imports'
import { titleCase } from 'scule'
import { modifyRelativeDocLinksWithFramework } from '~~/utils/content'

export async function useStats() {
  const nuxtApp = useNuxtApp()
  if (nuxtApp.static.data._nuxtSeoStats) {
    return nuxtApp.static.data._nuxtSeoStats
  }
  const asyncData = useAsyncData('stats', () => $fetch('/api/stats.json'))
  nuxtApp.static.data._nuxtSeoStats = asyncData
  return asyncData
}

function getCollectionForPath(path: string) {
  if (path.startsWith('/glossary'))
    return 'glossary'
  if (path.startsWith('/learn'))
    return 'learn'
  if (path.startsWith('/blog'))
    return 'blog'
  if (path.startsWith('/cloud'))
    return 'cloud'
  if (path.startsWith('/tools'))
    return 'tools'
  if (path.startsWith('/compare'))
    return 'compare'
  if (path.startsWith('/automation'))
    return 'automation'
  if (path.startsWith('/frameworks'))
    return 'frameworks'
  return 'root'
}

export async function useCurrentDocPage() {
  const nuxtApp = useNuxtApp()
  const route = useRouter().currentRoute.value
  if (nuxtApp.static.data.docsCurrent?.path === route.path) {
    return await nuxtApp.static.data.docsCurrent.promise
  }

  const collection = getCollectionForPath(route.path)
  const p = Promise.all([
    queryCollection(collection).path(route.path).first(),
    queryCollectionItemSurroundings(collection, route.path, {
      fields: ['title', 'description', 'path'],
    }),
  ])
    .then(async ([pageData, surroundData]) => {
      if (!pageData?.body?.value) {
        throw createError({ statusCode: 404, statusMessage: `Page not found: ${route.path}`, fatal: true })
      }

      modifyRelativeDocLinksWithFramework(pageData.body.value)

      const page = ref(pageData)
      const surround = ref((surroundData || []).filter(Boolean).map(m => ({
        ...m,
        _path: m.path,
      })))

      const lastCommitData = await $fetch(`/api/github/last-file-commit`, {
        query: {
          file: `docs/${pageData.stem}`,
        },
      }).catch(() => null)
      const lastCommit = ref(lastCommitData)

      return {
        page,
        surround,
        lastCommit,
      }
    })

  nuxtApp.static.data.docsCurrent = { promise: p, path: toRaw(route.path) }
  return p
}

export function movingAverage(data: number[], windowSize: number) {
  const result = []
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1) // Determine the start of the window
    const windowData = data.slice(start, i + 1) // Get the data for the window
    const sum = windowData.reduce((sum, point) => sum + point, 0) // Sum the downloads in the window
    const avg = sum / windowData.length // Calculate the average
    result.push(avg) // Add the moving average to the result
  }
  return result
}

export function mapPath(data, node = 0) {
  return data.map((item) => {
    if (item.children?.length && !item.page) {
      item.title = titleCase(item.title)
      item.children = mapPath(item.children, node + 1)
    }
    return {
      ...item,
      _path: item.path,
    }
  })
}
export function isHydratingRef() {
  const nuxtApp = useNuxtApp()
  const isHydrating = ref(true)
  nuxtApp.hooks.hook('page:finish', () => {
    isHydrating.value = false
  })
  return isHydrating
}
