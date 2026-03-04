<script setup lang="ts">
import type { ToolColor } from '~/utils/tool-colors'

withDefaults(defineProps<{
  icon: string
  title: string
  subtitle?: string
  color: ToolColor
  maxWidth?: string
}>(), {
  maxWidth: 'max-w-4xl',
})
</script>

<template>
  <section class="px-3 sm:px-6 lg:px-8 pb-12">
    <div class="mx-auto" :class="[maxWidth]">
      <div class="relative">
        <div
          class="absolute -inset-4 bg-gradient-to-b rounded-3xl blur-3xl pointer-events-none"
          :class="toolGlowClass(color)"
        />

        <div class="relative bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <div class="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800">
            <UIcon :name="icon" class="w-4 h-4" :class="toolIconClass(color)" />
            <span class="text-sm font-semibold">{{ title }}</span>
            <span v-if="subtitle" class="ml-auto text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">{{ subtitle }}</span>
          </div>

          <slot />
        </div>
      </div>
    </div>
  </section>
</template>
