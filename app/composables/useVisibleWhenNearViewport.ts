interface VisibleWhenNearViewportOptions {
  rootMargin?: string
  idleTimeout?: number
}

export function useVisibleWhenNearViewport(options: VisibleWhenNearViewportOptions = {}) {
  const target = ref<HTMLElement | null>(null)
  const isVisible = ref(false)
  let observer: IntersectionObserver | undefined
  let cleanupFallback: (() => void) | undefined

  function cleanup() {
    observer?.disconnect()
    observer = undefined
    cleanupFallback?.()
    cleanupFallback = undefined
  }

  function reveal() {
    if (isVisible.value)
      return
    isVisible.value = true
    cleanup()
  }

  onMounted(() => {
    const element = target.value
    if (!element || !('IntersectionObserver' in window)) {
      const timeout = options.idleTimeout ?? 2500
      if (typeof window.requestIdleCallback === 'function') {
        const id = window.requestIdleCallback(() => reveal(), { timeout })
        cleanupFallback = () => window.cancelIdleCallback?.(id)
      }
      else {
        const id = window.setTimeout(reveal, timeout)
        cleanupFallback = () => window.clearTimeout(id)
      }
      return
    }

    observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting))
        reveal()
    }, {
      rootMargin: options.rootMargin ?? '600px 0px',
    })
    observer.observe(element)
  })

  onUnmounted(cleanup)

  return {
    target,
    isVisible,
    reveal,
  }
}
