<script setup lang="ts">
import type { FieldAssessment, FieldSource } from '~~/shared/field-assessment'

const { assessment, source } = defineProps<{ assessment: FieldAssessment, source?: FieldSource | null }>()
const state = computed(() => assessment._tag === 'Passed' ? 'good' : assessment._tag === 'Failed' ? 'poor' : 'unavailable')
</script>

<template>
  <div class="rounded-xl border p-4 sm:p-6 text-center space-y-3" :class="state === 'good' ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30' : state === 'poor' ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'">
    <h3 class="text-lg font-semibold" :class="state === 'good' ? 'text-green-700 dark:text-green-400' : state === 'poor' ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'">
      {{ assessment._tag === 'Unavailable' ? 'Core Web Vitals assessment unavailable' : 'Core Web Vitals assessment' }}
    </h3>
    <p v-if="assessment._tag !== 'Unavailable'" class="font-semibold">
      {{ assessment._tag === 'Passed' ? 'Passed' : 'Failed' }}
    </p>
    <p v-else class="text-sm text-gray-600 dark:text-gray-400">
      {{ assessment.reason === 'unknown-rating' ? 'A field metric rating is unavailable.' : 'LCP and CLS field measurements are required.' }}
      Lab results do not establish a field assessment.
    </p>
    <p class="text-sm text-gray-600 dark:text-gray-400">
      Good Core Web Vitals metrics: {{ assessment.goodMetricCount }} of {{ assessment.measuredMetricCount }} measured.
    </p>
    <p v-if="assessment.missingMetrics.length" class="text-xs text-gray-500">
      Missing field measurements: {{ assessment.missingMetrics.map(metric => metric.toUpperCase()).join(', ') }}.
    </p>
    <ToolFieldSource v-if="source" :source="source" />
  </div>
</template>
