import type { MaybeRefOrGetter } from 'vue'

export function formatToolElapsed(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
}

export function useToolElapsed(startedAt?: MaybeRefOrGetter<number | null | undefined>) {
  const mountedAt = Date.now()
  const now = useNow({ interval: 1000 })
  const elapsedMs = computed(() => Math.max(0, now.value.getTime() - (toValue(startedAt) ?? mountedAt)))
  const elapsedLabel = computed(() => formatToolElapsed(elapsedMs.value))

  return { elapsedMs, elapsedLabel }
}
