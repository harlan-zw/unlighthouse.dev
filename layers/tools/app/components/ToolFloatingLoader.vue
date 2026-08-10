<script setup lang="ts">
import type { ToolColor } from '../utils/tool-colors'

const props = withDefaults(defineProps<{
  show: boolean
  message?: string
  color?: ToolColor
  startedAt?: number
}>(), {
  color: 'cyan',
})

const { elapsedLabel } = useToolElapsed(() => props.startedAt)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div v-if="show" class="fixed bottom-4 left-1/2 z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2">
        <div role="status" aria-live="polite" aria-busy="true" class="inline-flex max-w-full items-center gap-3 rounded-full border border-default bg-default px-4 py-2 shadow-lg">
          <UIcon name="i-heroicons-arrow-path" class="size-4 shrink-0 animate-spin motion-reduce:animate-none" :class="toolIconClass(color)" />
          <span class="truncate text-sm text-toned">{{ message || 'Working...' }}</span>
          <span class="shrink-0 text-xs tabular-nums text-muted">{{ elapsedLabel }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
