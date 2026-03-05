export function useLoadingMessages(messages: string[], interval = 800) {
  const current = ref(messages[0])
  const progress = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null
  let idx = 0

  function start() {
    idx = 0
    progress.value = 0
    current.value = messages[0]
    timer = setInterval(() => {
      idx = (idx + 1) % messages.length
      current.value = messages[idx]
      // Stagger progress: jump by 5-15% each tick, cap at 92% so it never "finishes"
      const increment = 5 + Math.random() * 10
      progress.value = Math.min(92, progress.value + increment)
    }, interval)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    progress.value = 0
  }

  onUnmounted(stop)

  return { current, progress, start, stop }
}
