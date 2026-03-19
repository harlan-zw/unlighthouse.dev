import { watchDebounced } from '@vueuse/core'

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

  onMounted(() => {
    const urlParam = route.query[paramName] as string
    if (extraParams) {
      for (const [queryKey, ref] of Object.entries(extraParams)) {
        const val = route.query[queryKey] as string
        if (val)
          ref.value = val
      }
    }
    if (urlParam) {
      urlInput.value = decodeURIComponent(urlParam)
      onReady?.()
    }
  })

  watchDebounced(
    urlInput,
    (newUrl) => {
      if (newUrl) {
        navigateTo({ query: { ...route.query, [paramName]: encodeURIComponent(newUrl) } }, { replace: true })
      }
      else {
        const { [paramName]: _, ...rest } = route.query
        navigateTo({ query: rest }, { replace: true })
      }
    },
    { debounce },
  )

  /** Sync a single query param reactively */
  function syncParam(paramKey: string, value: Ref<string>, defaultValue?: string) {
    watch(value, (newVal) => {
      if (defaultValue && newVal === defaultValue) {
        const { [paramKey]: _, ...rest } = route.query
        navigateTo({ query: rest }, { replace: true })
      }
      else {
        navigateTo({ query: { ...route.query, [paramKey]: newVal } }, { replace: true })
      }
    })
  }

  return { syncParam }
}
