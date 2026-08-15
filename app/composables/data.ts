import { titleCase } from 'scule'
import { markStyleTextAsHydrationSafe, modifyRelativeDocLinksWithFramework } from '~~/utils/content'
import { useAsyncData } from '#imports'

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
    return 'glossary' as const
  if (path.startsWith('/learn-lighthouse'))
    return 'learnLighthouse' as const
  return 'root' as const
}

interface LastCommit {
  author: {
    name?: string
    avatar?: string
    committer?: string
  }
  date?: string
  dateHuman: string
  message: string
  url: string
}

export async function useCurrentDocPage() {
  const route = useRoute()

  const collection = getCollectionForPath(route.path)
  const { data, error } = await useAsyncData(`docs-current:${route.path}`, async () => {
    const [pageData, surroundData] = await Promise.all([
      queryCollection(collection).path(route.path).first(),
      queryCollectionItemSurroundings(collection, route.path, {
        fields: ['title', 'description', 'path'],
      }),
    ])

    if (!pageData?.body?.nodes) {
      throw createError({ statusCode: 404, statusMessage: `Page not found: ${route.path}`, fatal: true })
    }

    const surround = (surroundData || []).filter(Boolean).map((m: any) => {
      const path = m.path.replace(/\/index$/, '') || '/'
      return {
        ...m,
        path,
        _path: path,
      }
    })

    const lastCommitData = await $fetch<LastCommit>(`/api/github/last-file-commit`, {
      query: {
        file: `docs/${pageData.stem}`,
      },
    }).catch((error) => {
      console.warn('[docs] Failed to load optional commit metadata', error)
      return null
    })

    return {
      page: pageData,
      surround,
      lastCommit: lastCommitData,
    }
  })

  if (!data.value) {
    if (error.value)
      throw error.value

    throw createError({ statusCode: 404, statusMessage: `Page not found: ${route.path}`, fatal: true })
  }

  const pageData = structuredClone(toRaw(data.value.page))
  modifyRelativeDocLinksWithFramework(pageData.body.nodes)
  markStyleTextAsHydrationSafe(pageData.body.nodes)

  if (Array.isArray(pageData.relatedPages)) {
    pageData.relatedPages = pageData.relatedPages.map((page: any) => ({
      ...page,
      path: page.path?.replace(/\/index$/, '') || page.path,
    }))
  }

  return {
    page: ref(pageData),
    surround: ref(data.value.surround),
    lastCommit: ref(data.value.lastCommit),
  }
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

export function mapPath(data: any, node = 0) {
  return data.map((item: any) => {
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
export function useIsHydrating() {
  const nuxtApp = useNuxtApp()
  const isHydrating = ref(true)
  nuxtApp.hooks.hook('page:finish', () => {
    isHydrating.value = false
  })
  return isHydrating
}
