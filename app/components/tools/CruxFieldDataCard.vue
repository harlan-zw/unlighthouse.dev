<script setup lang="ts">
import type { CruxMetricResponse } from '~~/server/api/crux/metric.post'
import type { MetricKey } from '~/utils/crux'
import { metricDefinitions } from '~/utils/crux'

interface Props {
  metric: MetricKey
  url: string
  formFactor: 'PHONE' | 'DESKTOP'
  labValue?: number
  labDisplayValue?: string
}

const props = defineProps<Props>()

const data = ref<CruxMetricResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const hasAttempted = ref(false)

const metricDef = computed(() => metricDefinitions[props.metric])

const ratingStyles = {
  'good': {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-700/50',
    badge: 'bg-emerald-500',
    glow: 'shadow-emerald-500/10',
  },
  'needs-improvement': {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-700/50',
    badge: 'bg-amber-500',
    glow: 'shadow-amber-500/10',
  },
  'poor': {
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-700/50',
    badge: 'bg-red-500',
    glow: 'shadow-red-500/10',
  },
}

const styles = computed(() => data.value ? ratingStyles[data.value.rating] : null)

// Lab vs field comparison
const comparison = computed(() => {
  if (!data.value || props.labValue === undefined)
    return null

  const fieldP75 = data.value.p75
  const lab = props.labValue

  // For CLS, values are small decimals
  const threshold = props.metric === 'cls' ? 0.02 : lab * 0.15

  if (fieldP75 > lab + threshold) {
    return {
      type: 'worse' as const,
      icon: 'i-heroicons-arrow-trending-up',
      text: 'Field worse than lab',
      color: 'text-amber-500',
    }
  }
  if (fieldP75 < lab - threshold) {
    return {
      type: 'better' as const,
      icon: 'i-heroicons-arrow-trending-down',
      text: 'Field better than lab',
      color: 'text-emerald-500',
    }
  }
  return {
    type: 'similar' as const,
    icon: 'i-heroicons-minus',
    text: 'Field matches lab',
    color: 'text-gray-400',
  }
})

async function fetchData() {
  if (!props.url || loading.value)
    return

  loading.value = true
  error.value = null
  hasAttempted.value = true

  $fetch<CruxMetricResponse>('/api/crux/metric', {
    method: 'POST',
    body: {
      url: props.url,
      metric: props.metric,
      formFactor: props.formFactor,
    },
  })
    .then((response) => {
      data.value = response
    })
    .catch(() => {
      error.value = 'No field data available'
      data.value = null
    })
    .finally(() => {
      loading.value = false
    })
}

// Auto-fetch when URL changes
watch(() => props.url, (newUrl) => {
  if (newUrl) {
    data.value = null
    error.value = null
    hasAttempted.value = false
    fetchData()
  }
}, { immediate: true })

watch(() => props.formFactor, () => {
  if (props.url) {
    fetchData()
  }
})
</script>

<template>
  <div
    class="relative rounded-xl border overflow-hidden transition-all duration-300"
    :class="[
      styles ? [styles.bg, styles.border, styles.glow, 'shadow-lg'] : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
    ]"
  >
    <!-- Header -->
    <div class="flex items-center gap-2.5 px-4 py-3 border-b border-inherit">
      <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40">
        <UIcon name="i-heroicons-users" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-semibold text-gray-900 dark:text-white">
          Real User Data
        </div>
        <div class="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Chrome UX Report
        </div>
      </div>
      <div v-if="data" class="text-[10px] text-gray-400 dark:text-gray-500">
        {{ data.collectionEnd }}
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-6">
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
          <span>Fetching field data...</span>
        </div>
      </div>

      <!-- Error/No data state -->
      <div v-else-if="error || (!data && hasAttempted)" class="py-4 text-center">
        <UIcon name="i-heroicons-chart-bar" class="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
          No field data for this URL
        </p>
        <NuxtLink
          :to="`/tools/cwv-history?url=${encodeURIComponent(url)}`"
          class="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
        >
          Try origin-level data
          <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
        </NuxtLink>
      </div>

      <!-- Data display -->
      <div v-else-if="data" class="space-y-4">
        <!-- Main value -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-baseline gap-2">
              <span
                class="text-3xl font-bold tabular-nums tracking-tight"
                :class="styles?.text"
              >
                {{ data.displayValue }}
              </span>
              <span class="text-xs text-gray-400 dark:text-gray-500 font-medium">P75</span>
            </div>
            <div
              class="mt-1 text-xs font-medium uppercase tracking-wide"
              :class="styles?.text"
            >
              {{ data.rating.replace('-', ' ') }}
            </div>
          </div>

          <!-- Lab comparison badge -->
          <div
            v-if="comparison && labDisplayValue"
            class="flex flex-col items-end gap-1"
          >
            <div class="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              Lab
            </div>
            <div class="text-sm font-semibold text-gray-600 dark:text-gray-300 tabular-nums">
              {{ labDisplayValue }}
            </div>
            <div
              class="flex items-center gap-1 text-[10px]"
              :class="comparison.color"
            >
              <UIcon :name="comparison.icon" class="w-3 h-3" />
              <span>{{ comparison.text }}</span>
            </div>
          </div>
        </div>

        <!-- Histogram bar -->
        <div class="space-y-1.5">
          <div class="h-2.5 rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-700">
            <div
              class="bg-emerald-400 dark:bg-emerald-500 transition-all duration-500"
              :style="{ width: `${data.histogram.good}%` }"
            />
            <div
              class="bg-amber-400 dark:bg-amber-500 transition-all duration-500"
              :style="{ width: `${data.histogram.needsImprovement}%` }"
            />
            <div
              class="bg-red-400 dark:bg-red-500 transition-all duration-500"
              :style="{ width: `${data.histogram.poor}%` }"
            />
          </div>
          <div class="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 tabular-nums">
            <span>{{ data.histogram.good }}% good</span>
            <span>{{ data.histogram.needsImprovement }}% needs work</span>
            <span>{{ data.histogram.poor }}% poor</span>
          </div>
        </div>

        <!-- Threshold info -->
        <div class="pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
          <div class="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
            <span>
              Good: {{ metricDef.good }}{{ metric === 'cls' ? '' : 'ms' }}
              &middot;
              Poor: {{ metricDef.poor }}{{ metric === 'cls' ? '' : 'ms' }}
            </span>
            <NuxtLink
              :to="`/tools/cwv-history?url=${encodeURIComponent(url)}`"
              class="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
            >
              25-week history
              <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Initial state (before any fetch) -->
      <div v-else class="py-6 text-center">
        <UIcon name="i-heroicons-chart-bar" class="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Enter a URL to see field data
        </p>
      </div>
    </div>
  </div>
</template>
