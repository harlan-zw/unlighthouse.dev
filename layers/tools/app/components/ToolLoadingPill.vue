<script setup lang="ts">
import type { ToolColor } from '../utils/tool-colors'

const props = defineProps<{
  message?: string
  color: ToolColor
  hint?: string
  progress?: number
  startedAt?: number
  expected?: string
  background?: boolean
}>()

const hasProgress = computed(() => props.progress !== undefined)
const progressValue = computed(() => Math.min(100, Math.max(0, props.progress ?? 0)))
const { elapsedLabel } = useToolElapsed(() => props.startedAt)
</script>

<template>
  <div role="status" aria-live="polite" aria-busy="true" class="p-8 text-center">
    <div
      class="inline-flex max-w-full items-center gap-3 rounded-full border px-4 py-2"
      :class="[toolLoadingPillClasses(color).bg, toolLoadingPillClasses(color).border]"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="size-4 shrink-0 animate-spin motion-reduce:animate-none"
        :class="toolLoadingPillClasses(color).icon"
      />
      <span class="min-w-0 text-sm" :class="toolLoadingPillClasses(color).text">{{ message || 'Working...' }}</span>
      <span v-if="hasProgress" class="shrink-0 text-xs tabular-nums opacity-70" :class="toolLoadingPillClasses(color).text">
        {{ Math.round(progressValue) }}%
      </span>
      <span class="shrink-0 text-xs tabular-nums opacity-70" :class="toolLoadingPillClasses(color).text">{{ elapsedLabel }}</span>
    </div>
    <div
      v-if="hasProgress"
      role="progressbar"
      aria-label="Progress"
      :aria-valuenow="Math.round(progressValue)"
      aria-valuemin="0"
      aria-valuemax="100"
      class="mx-auto mt-3 h-1 max-w-xs overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
    >
      <div
        class="h-full rounded-full transition-all duration-700 ease-out"
        :class="toolLoadingPillClasses(color).progressBar"
        :style="{ width: `${progressValue}%` }"
      />
    </div>
    <p v-if="expected || background || hint" class="mx-auto mt-4 max-w-lg text-sm text-muted">
      <span v-if="expected">{{ expected }}</span>
      <span v-if="expected && (background || hint)">&nbsp;</span>
      <span v-if="background">You can keep browsing; we'll notify you when the report is ready.</span>
      <span v-if="background && hint">&nbsp;</span>
      <span v-if="hint">{{ hint }}</span>
    </p>
  </div>
</template>
