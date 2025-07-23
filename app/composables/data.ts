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

export async function useCurrentDocPage() {
  const nuxtApp = useNuxtApp()
  const route = useRouter().currentRoute.value
  if (nuxtApp.static.data.docsCurrent?.path === route.path) {
    return await nuxtApp.static.data.docsCurrent.promise
  }
  // eslint-disable-next-line no-async-promise-executor
  const p = new Promise(async (resolve) => {
    const [{ data: page }, { data: surround }] = await Promise.all([
      useAsyncData(`docs-${route.path}`, () => queryCollection('root').path(route.path).first(), {
        transform(item) {
          modifyRelativeDocLinksWithFramework(item.body.value)
          return item
        },
      }),
      useAsyncData(`docs-${route.path}-surround`, () => queryCollectionItemSurroundings('root', route.path, {
        fields: ['title', 'description', 'path'],
      }), {
        transform(items) {
          return items.map((m) => {
            return {
              ...m,
              _path: m.path,
            }
          })
        },
      }),
    ])
    await nuxtApp.runWithContext(async () => {
      const { data: lastCommit } = await useAsyncData(`docs-${route.path}-last-commit`, () => {
        return $fetch(`/api/github/last-file-commit`, {
          query: {
            file: `docs/${page.value?.stem}`,
          },
        })
      })
      resolve({
        page,
        surround,
        lastCommit,
      })
    })
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
