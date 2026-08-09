<script setup lang="ts">
defineProps<{
  disabled?: boolean
  showLabels?: boolean
}>()

const model = defineModel<'mobile' | 'desktop'>({ default: 'mobile' })
</script>

<template>
  <div role="group" aria-label="Audit device" class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-100 dark:bg-gray-800">
    <button
      type="button"
      aria-label="Mobile audit"
      :aria-pressed="model === 'mobile'"
      class="min-h-11 min-w-11 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
      :class="[model === 'mobile' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']"
      :disabled="disabled"
      @click="model = 'mobile'"
    >
      <UIcon name="i-heroicons-device-phone-mobile" class="w-5 h-5" />
      <span v-if="showLabels">Mobile</span>
    </button>
    <button
      type="button"
      aria-label="Desktop audit"
      :aria-pressed="model === 'desktop'"
      class="min-h-11 min-w-11 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
      :class="[model === 'desktop' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']"
      :disabled="disabled"
      @click="model = 'desktop'"
    >
      <UIcon name="i-heroicons-computer-desktop" class="w-5 h-5" />
      <span v-if="showLabels">Desktop</span>
    </button>
  </div>
</template>
