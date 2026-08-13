import { watchDebounced } from '@vueuse/core'
import { readToolQueryValue, replaceToolQuery } from '../utils/tool-url'

interface ToolUrlSyncOptions {
  /** Query param name for the URL input (default: 'url') */
  paramName?: string
  /** Additional query params to sync from route on mount */
  extraParams?: Record<string, Ref<string>>
  /** Auto-run callback when URL is present on mount */
  onReady?: () => void
  /** Debounce delay in ms (default: 500) */
  debounce?: number
}

export function useToolUrlSync(urlInput: Ref<string>, options: ToolUrlSyncOptions = {}) {
  const { paramName = 'url', extraParams, onReady, debounce = 500 } = options
  const route = useRoute()
  const router = useRouter()

  function syncQueryParam(paramKey: string, value: string, defaultValue?: string) {
    void replaceToolQuery(router, paramKey, value, defaultValue).catch((error) => {
      console.error('[tool-url] Failed to sync query parameter', error)
    })
  }

  onMounted(() => {
    const urlParam = readToolQueryValue(route.query[paramName])
    if (extraParams) {
      for (const [queryKey, ref] of Object.entries(extraParams)) {
        const val = readToolQueryValue(route.query[queryKey])
        if (val)
          ref.value = val
      }
    }
    if (urlParam) {
      urlInput.value = urlParam
      onReady?.()
    }
  })

  watchDebounced(
    urlInput,
    (newUrl) => {
      syncQueryParam(paramName, newUrl)
    },
    { debounce },
  )

  /** Sync a single query param reactively */
  function syncParam(paramKey: string, value: Ref<string>, defaultValue?: string) {
    watch(value, (newVal) => {
      syncQueryParam(paramKey, newVal, defaultValue)
    })
  }

  return { syncParam }
}
