<script setup lang="ts">
import type { CategoryScoreDisplay, LighthouseCategory } from '../types/lighthouse'

interface CategoryDisplay {
  id: string
  label: string
  icon: string
  category: LighthouseCategory | null
  display: CategoryScoreDisplay
}

defineProps<{
  categories: CategoryDisplay[]
}>()

const categoryIcons: Record<string, string> = {
  'performance': 'i-heroicons-bolt',
  'accessibility': 'i-heroicons-eye',
  'best-practices': 'i-heroicons-check-badge',
  'seo': 'i-heroicons-magnifying-glass',
  'agentic-browsing': 'i-heroicons-cpu-chip',
  'pwa': 'i-heroicons-device-phone-mobile',
}

function getRatingLabel(score: number | null): string {
  const rating = getScoreRating(score)
  switch (rating) {
    case 'pass':
      return 'Good'
    case 'average':
      return 'Needs improvement'
    case 'fail':
      return 'Poor'
    default:
      return 'N/A'
  }
}
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
    <div
      v-for="cat in categories"
      :key="cat.id"
      class="relative p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center"
    >
      <!-- Score Circle -->
      <div
        class="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white text-base sm:text-xl font-bold mb-2 shadow-lg"
        :class="getScoreBgClass(cat.display.score)"
      >
        {{ cat.display._tag === 'Fraction' ? `${cat.display.numPassed}/${cat.display.numPassableAudits}` : cat.display.score !== null ? Math.round(cat.display.score * 100) : '—' }}
      </div>

      <!-- Category Name -->
      <div class="flex items-center gap-1.5 mb-1">
        <UIcon :name="categoryIcons[cat.id] || 'i-heroicons-document'" class="w-3.5 h-3.5 text-gray-500" />
        <span class="text-xs font-medium text-gray-900 dark:text-white">{{ cat.label }}</span>
      </div>

      <!-- Rating Label -->
      <span
        class="text-[10px] font-medium"
        :class="{
          'text-green-600 dark:text-green-400': getScoreRating(cat.display.score) === 'pass',
          'text-orange-600 dark:text-orange-400': getScoreRating(cat.display.score) === 'average',
          'text-red-600 dark:text-red-400': getScoreRating(cat.display.score) === 'fail',
          'text-gray-500': getScoreRating(cat.display.score) === 'unknown',
        }"
      >
        {{ getRatingLabel(cat.display.score) }}
      </span>
    </div>
  </div>
</template>
