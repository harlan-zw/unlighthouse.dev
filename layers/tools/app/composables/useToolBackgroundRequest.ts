export interface ToolBackgroundState<T = any> {
  status: 'loading' | 'success' | 'error'
  result: T | null
  error: string | null
  url: string
  title: string
  path: string
  startedAt: number
}

export function useToolBackgroundRequests() {
  return useState<Record<string, ToolBackgroundState>>('tool-bg-requests', () => ({}))
}

export function useToolBackgroundRequest<T = any>(toolId: string, opts: {
  title: string
  path: string
}) {
  const store = useToolBackgroundRequests()

  const state = computed(() => store.value[toolId] as ToolBackgroundState<T> | undefined)
  const loading = computed(() => state.value?.status === 'loading')
  const error = computed(() => state.value?.error ?? null)
  const result = computed(() => (state.value?.result as T) ?? null)
  const startedAt = computed(() => state.value?.startedAt)

  function run(fetchFn: () => Promise<T>, url: string, onSuccess?: () => void) {
    store.value[toolId] = {
      status: 'loading',
      result: null,
      error: null,
      url,
      title: opts.title,
      path: opts.path,
      startedAt: Date.now(),
    }

    fetchFn()
      .then((data) => {
        // Bail if request was cleared or superseded
        if (!store.value[toolId] || store.value[toolId].status !== 'loading')
          return

        store.value[toolId].result = data
        store.value[toolId].status = 'success'
        onSuccess?.()
      })
      .catch((err) => {
        if (!store.value[toolId] || store.value[toolId].status !== 'loading')
          return

        const message = err.data?.message || err.message || 'Request failed'
        store.value[toolId].error = message
        store.value[toolId].status = 'error'
      })
  }

  function clear() {
    delete store.value[toolId]
  }

  return { loading, error, result, startedAt, run, clear, state }
}
