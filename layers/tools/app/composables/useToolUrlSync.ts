import { useUrlSearchParams, watchDebounced } from '@vueuse/core'

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
  const params = useUrlSearchParams<Record<string, string | undefined>>('history')

  onMounted(() => {
    const urlParam = params[paramName]
    if (extraParams) {
      for (const [queryKey, ref] of Object.entries(extraParams)) {
        const val = params[queryKey]
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
      params[paramName] = newUrl || undefined
    },
    { debounce },
  )

  /** Sync a single query param reactively */
  function syncParam(paramKey: string, value: Ref<string>, defaultValue?: string) {
    watch(value, (newVal) => {
      params[paramKey] = defaultValue && newVal === defaultValue ? undefined : newVal
    })
  }

  return { syncParam }
}
