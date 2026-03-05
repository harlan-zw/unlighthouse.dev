<script setup lang="ts">
import type { ToolColor } from '../utils/tool-colors'

defineProps<{
  message: string
  color: ToolColor
  hint?: string
  progress?: number
}>()
</script>

<template>
  <div class="p-8 text-center">
    <div
      class="inline-flex items-center gap-3 px-4 py-2 rounded-full border"
      :class="[toolLoadingPillClasses(color).bg, toolLoadingPillClasses(color).border]"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-4 h-4 animate-spin"
        :class="toolLoadingPillClasses(color).icon"
      />
      <span class="text-sm" :class="toolLoadingPillClasses(color).text">{{ message }}</span>
      <span v-if="progress" class="text-xs tabular-nums opacity-70" :class="toolLoadingPillClasses(color).text">{{ Math.round(progress) }}%</span>
    </div>
    <div v-if="progress" class="mt-3 mx-auto max-w-xs h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-700 ease-out"
        :class="toolLoadingPillClasses(color).progressBar"
        :style="{ width: `${progress}%` }"
      />
    </div>
    <p v-if="hint" class="mt-4 text-xs text-gray-500">
      {{ hint }}
    </p>
  </div>
</template>
