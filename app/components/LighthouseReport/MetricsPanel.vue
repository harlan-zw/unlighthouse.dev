<script setup lang="ts">
import type { PerformanceMetric } from '~/types/lighthouse'
import { getScoreBgClass, getScoreColorClass } from '~/composables/useLighthouseReport'

defineProps<{
  metrics: PerformanceMetric[]
}>()

// Threshold data for visualization
const thresholds: Record<string, { good: number, poor: number, unit: string }> = {
  'first-contentful-paint': { good: 1800, poor: 3000, unit: 'ms' },
  'speed-index': { good: 3400, poor: 5800, unit: 'ms' },
  'largest-contentful-paint': { good: 2500, poor: 4000, unit: 'ms' },
  'total-blocking-time': { good: 200, poor: 600, unit: 'ms' },
  'cumulative-layout-shift': { good: 0.1, poor: 0.25, unit: '' },
  'interactive': { good: 3800, poor: 7300, unit: 'ms' },
}

function getThresholdPosition(metric: PerformanceMetric): number {
  const threshold = thresholds[metric.id]
  if (!threshold)
    return 50

  const value = metric.value
  const { good, poor } = threshold

  if (value <= good) {
    return (value / good) * 40
  }
  else if (value <= poor) {
    return 40 + ((value - good) / (poor - good)) * 25
  }
  else {
    const max = poor * 2
    const capped = Math.min(value, max)
    return 65 + ((capped - poor) / (max - poor)) * 35
  }
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="metric in metrics"
      :key="metric.id"
      class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
    >
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{{ metric.name }}</span>
          <span
            v-if="metric.isCoreWebVital"
            class="px-1.5 py-0.5 text-[9px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full"
          >
            CWV
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span :class="getScoreColorClass(metric.score)" class="text-xs sm:text-sm font-bold tabular-nums">
            {{ metric.displayValue }}
          </span>
          <div
            class="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white text-[9px] sm:text-[10px] font-bold"
            :class="getScoreBgClass(metric.score)"
          >
            {{ metric.score !== null ? Math.round(metric.score * 100) : '—' }}
          </div>
        </div>
      </div>

      <!-- Threshold Bar -->
      <div class="relative">
        <div class="flex h-2 rounded-full overflow-hidden shadow-inner">
          <div class="flex-[4] bg-gradient-to-r from-green-400 to-green-500" />
          <div class="flex-[2.5] bg-gradient-to-r from-orange-400 to-orange-500" />
          <div class="flex-[3.5] bg-gradient-to-r from-red-400 to-red-500" />
        </div>
        <!-- Position indicator -->
        <div
          class="absolute top-0 -translate-x-1/2 transition-all duration-500"
          :style="{ left: `${Math.min(getThresholdPosition(metric), 100)}%` }"
        >
          <div class="flex flex-col items-center">
            <div
              class="w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 shadow-md"
              :class="getScoreBgClass(metric.score)"
            />
          </div>
        </div>
      </div>

      <!-- Threshold labels -->
      <div v-if="thresholds[metric.id]" class="flex justify-between mt-1 text-[9px] text-gray-500">
        <span>0</span>
        <span class="text-green-600">≤{{ thresholds[metric.id]!.good }}{{ thresholds[metric.id]!.unit }}</span>
        <span class="text-orange-500">{{ thresholds[metric.id]!.poor }}{{ thresholds[metric.id]!.unit }}</span>
        <span class="text-red-500">Poor</span>
      </div>
    </div>
  </div>
</template>
