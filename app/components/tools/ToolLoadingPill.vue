<script setup lang="ts">
import type { ToolColor } from '~/utils/tool-colors'

defineProps<{
  message: string
  color: ToolColor
  hint?: string
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
    </div>
    <p v-if="hint" class="mt-4 text-xs text-gray-500">
      {{ hint }}
    </p>
  </div>
</template>
