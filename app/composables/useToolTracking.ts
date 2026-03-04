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
    }).catch(() => {})
  }

  function trackUse() {
    if (hasTrackedUse.value)
      return
    hasTrackedUse.value = true
    $fetch('/api/tools/track', {
      method: 'POST',
      body: { tool: toolId, action: 'use' },
    }).catch(() => {})
  }

  function resetUseTracking() {
    hasTrackedUse.value = false
  }

  onMounted(trackView)

  return { trackView, trackUse, resetUseTracking }
}
