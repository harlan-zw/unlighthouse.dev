export function useToolTracking(toolId: string) {
  const hasTrackedView = ref(false)
  const hasTrackedUse = ref(false)

  function trackView() {
    if (hasTrackedView.value)
      return
    hasTrackedView.value = true
    $fetch('/api/tools/track', {
      method: 'POST',
      body: { tool: toolId, action: 'view' },
    }).catch((error) => {
      if (import.meta.dev)
        console.warn('[tool-tracking] Failed to track view', error)
    })
  }

  function trackUse() {
    if (hasTrackedUse.value)
      return
    hasTrackedUse.value = true
    $fetch('/api/tools/track', {
      method: 'POST',
      body: { tool: toolId, action: 'use' },
    }).catch((error) => {
      if (import.meta.dev)
        console.warn('[tool-tracking] Failed to track use', error)
    })
  }

  function resetUseTracking() {
    hasTrackedUse.value = false
  }

  onMounted(trackView)

  return { trackView, trackUse, resetUseTracking }
}
