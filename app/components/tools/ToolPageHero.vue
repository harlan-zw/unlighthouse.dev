<script setup lang="ts">
import type { ToolColor } from '~/utils/tool-colors'

defineProps<{
  title: string
  accent: string
  description: string
  color: ToolColor
}>()
</script>

<template>
  <section class="relative pt-10 pb-6 lg:pt-12 lg:pb-8">
    <div class="max-w-4xl mx-auto px-6 text-center">
      <ClientOnly>
        <h1
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.4 }"
          class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.1] text-gray-900 dark:text-white mb-3"
        >
          {{ title }}
          <span :class="toolAccentClass(color)">{{ accent }}</span>
        </h1>
        <p
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.4, delay: 0.1 }"
          class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto"
        >
          {{ description }}
        </p>
        <template #fallback>
          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.1] text-gray-900 dark:text-white mb-3">
            {{ title }}
            <span :class="toolAccentClass(color)">{{ accent }}</span>
          </h1>
          <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            {{ description }}
          </p>
        </template>
      </ClientOnly>
    </div>
  </section>
</template>
