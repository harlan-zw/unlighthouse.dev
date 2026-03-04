<script setup lang="ts">
defineProps<{
  show: boolean
  message?: string
  color?: string
}>()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="show" class="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-cyan-500 animate-spin" />
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ message || 'Loading...' }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
