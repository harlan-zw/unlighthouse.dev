<script setup lang="ts">
import type { CWVHistoryResponse } from '~~/server/api/tools/cwv-history.post'
import type { CruxRating, MetricKey } from '~/utils/crux'
import { watchDebounced } from '@vueuse/core'
import {
  allMetrics,
  cwvMetrics,
  formatCruxMetricValue,
  getCruxRatingIcon,
  getMetricRating,
  getPassesAllCWV,
  metricDefinitions,
} from '~/utils/crux'

definePageMeta({
  breadcrumb: {
    icon: 'i-heroicons-chart-bar',
    ariaLabel: 'Core Web Vitals History',
  },
})

const faqs = [
  {
    question: 'What is Core Web Vitals history data?',
    answer: 'CrUX (Chrome User Experience Report) stores 25 weeks of real user performance data for sites with sufficient traffic. This historical data shows how your Core Web Vitals (LCP, CLS, INP) have changed over time, helping you track improvement or detect regressions.',
  },
  {
    question: 'Where does this historical performance data come from?',
    answer: 'Historical data comes from CrUX, Google\'s dataset of real Chrome user experiences. Google collects anonymized performance metrics from Chrome users who have opted in. The data represents the 75th percentile (p75) of real user experiences over 28-day rolling periods.',
  },
  {
    question: 'Why don\'t I see historical data for my site?',
    answer: 'CrUX only includes sites with sufficient traffic from Chrome users. New sites, low-traffic pages, or sites visited primarily by non-Chrome browsers may not have data. Origin-level data aggregates all pages and requires less traffic than URL-specific data.',
  },
  {
    question: 'What can I learn from Core Web Vitals trends?',
    answer: 'Trends help you: correlate performance changes with deployments, detect gradual degradation before users notice, measure the impact of optimizations over time, compare mobile vs desktop performance, and identify seasonal patterns affecting user experience.',
  },
  {
    question: 'How often is CrUX historical data updated?',
    answer: 'CrUX data is updated weekly with a new 28-day rolling window. Each data point represents the 75th percentile of user experiences during that collection period. This means changes you make today will start showing in the data within 1-4 weeks.',
  },
]

useToolSeo({
  title: 'Core Web Vitals History - Track Performance Over Time',
  description: 'Free CrUX history viewer. Track 25 weeks of LCP, CLS, and INP trends from real Chrome users. Monitor Core Web Vitals changes over time.',
  faqs,
})

type FormFactor = 'PHONE' | 'DESKTOP'
type Mode = 'origin' | 'url'

interface HistoryItem {
  date: string
  collectionStart: string
  collectionEnd: string
  cls75?: number
  lcp75?: number
  inp75?: number
  fcp75?: number
  ttfb75?: number
  lcpGood?: number
  lcpNeedsImprovement?: number
  lcpPoor?: number
  clsGood?: number
  clsNeedsImprovement?: number
  clsPoor?: number
  inpGood?: number
  inpNeedsImprovement?: number
  inpPoor?: number
  fcpGood?: number
  fcpNeedsImprovement?: number
  fcpPoor?: number
  ttfbGood?: number
  ttfbNeedsImprovement?: number
  ttfbPoor?: number
}

const route = useRoute()
const router = useRouter()

const urlInput = ref('')
const mode = ref<Mode>('origin')
const formFactor = ref<FormFactor>('PHONE')
const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<CWVHistoryResponse | null>(null)
const selectedMetric = ref<MetricKey>('lcp')

onMounted(() => {
  const urlParam = route.query.url as string
  const modeParam = route.query.mode as Mode
  const deviceParam = route.query.device as string
  if (modeParam === 'url')
    mode.value = 'url'
  if (deviceParam === 'desktop')
    formFactor.value = 'DESKTOP'
  if (urlParam) {
    urlInput.value = decodeURIComponent(urlParam)
    lookup()
  }
})

watchDebounced(
  urlInput,
  (newUrl) => {
    if (newUrl) {
      router.replace({ query: { ...route.query, url: encodeURIComponent(newUrl) } })
    }
    else {
      const { url: _, ...rest } = route.query
      router.replace({ query: rest })
    }
  },
  { debounce: 500 },
)

watch(mode, (newMode) => {
  router.replace({ query: { ...route.query, mode: newMode === 'url' ? 'url' : undefined } })
})

watch(formFactor, (newFactor) => {
  router.replace({ query: { ...route.query, device: newFactor === 'DESKTOP' ? 'desktop' : undefined } })
})

function lookup() {
  if (!urlInput.value.trim())
    return

  loading.value = true
  error.value = null
  result.value = null

  $fetch<CWVHistoryResponse>('/api/tools/cwv-history', {
    method: 'POST',
    body: {
      url: urlInput.value,
      mode: mode.value,
      formFactor: formFactor.value,
    },
  })
    .then((data) => {
      result.value = data
    })
    .catch((err) => {
      error.value = err.data?.message || err.message || 'Failed to fetch CrUX data'
    })
    .finally(() => {
      loading.value = false
    })
}

const latestData = computed<HistoryItem | null>(() => {
  if (!result.value?.history?.length)
    return null
  return result.value.history[result.value.history.length - 1]
})

const passesCWV = computed(() => {
  if (!latestData.value)
    return false
  return getPassesAllCWV({
    lcp: latestData.value.lcp75,
    cls: latestData.value.cls75,
    inp: latestData.value.inp75,
  })
})

const currentMetrics = computed(() => {
  if (!latestData.value)
    return []
  return cwvMetrics.map((key) => {
    const p75Key = `${key}75` as keyof HistoryItem
    const value = latestData.value![p75Key] as number | undefined
    const rating = value !== undefined ? getMetricRating(key, value) : null
    const def = metricDefinitions[key]
    return {
      key,
      abbr: def.abbr,
      name: def.name,
      value,
      displayValue: formatCruxMetricValue(key, value),
      rating,
      good: def.good,
      poor: def.poor,
      learnMoreUrl: def.learnMoreUrl,
      toolUrl: def.toolUrl,
    }
  })
})

const supportingMetrics = computed(() => {
  if (!latestData.value)
    return []
  return (['fcp', 'ttfb'] as MetricKey[]).map((key) => {
    const p75Key = `${key}75` as keyof HistoryItem
    const value = latestData.value![p75Key] as number | undefined
    const rating = value !== undefined ? getMetricRating(key, value) : null
    const def = metricDefinitions[key]
    return {
      key,
      abbr: def.abbr,
      name: def.name,
      value,
      displayValue: formatCruxMetricValue(key, value),
      rating,
    }
  })
})

function getHistogram(metric: MetricKey): { good: number, needsImprovement: number, poor: number } | null {
  if (!latestData.value)
    return null
  const goodKey = `${metric}Good` as keyof HistoryItem
  const niKey = `${metric}NeedsImprovement` as keyof HistoryItem
  const poorKey = `${metric}Poor` as keyof HistoryItem
  const good = latestData.value[goodKey] as number | undefined
  const needsImprovement = latestData.value[niKey] as number | undefined
  const poor = latestData.value[poorKey] as number | undefined
  if (good === undefined)
    return null
  return {
    good: Math.round((good || 0) * 100),
    needsImprovement: Math.round((needsImprovement || 0) * 100),
    poor: Math.round((poor || 0) * 100),
  }
}

// Chart data
const chartData = computed(() => {
  if (!result.value?.history?.length)
    return null

  const history = result.value.history
  const metric = selectedMetric.value
  const def = metricDefinitions[metric]
  const p75Key = `${metric}75` as keyof HistoryItem

  const values = history.map(h => (h[p75Key] as number) || 0).filter(v => v > 0)
  if (!values.length)
    return null

  const maxValue = Math.max(...values, def.poor * 1.2)
  const minValue = 0

  const points = history.map((h, i) => {
    const val = (h[p75Key] as number) || 0
    const x = (i / (history.length - 1)) * 100
    const y = val > 0 ? 100 - ((val - minValue) / (maxValue - minValue)) * 100 : null
    return { x, y, value: val, date: h.date, collectionEnd: h.collectionEnd }
  })

  const goodY = 100 - ((def.good - minValue) / (maxValue - minValue)) * 100
  const poorY = 100 - ((def.poor - minValue) / (maxValue - minValue)) * 100

  return {
    points,
    goodY,
    poorY,
    maxValue,
    minValue,
    metric,
    def,
  }
})

const chartPath = computed(() => {
  if (!chartData.value)
    return ''
  const validPoints = chartData.value.points.filter(p => p.y !== null)
  if (validPoints.length < 2)
    return ''
  return validPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
})

const chartAreaPath = computed(() => {
  if (!chartData.value)
    return ''
  const validPoints = chartData.value.points.filter(p => p.y !== null)
  if (validPoints.length < 2)
    return ''
  const linePath = validPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const lastX = validPoints[validPoints.length - 1].x
  const firstX = validPoints[0].x
  return `${linePath} L ${lastX} 100 L ${firstX} 100 Z`
})

const ratingColors: Record<CruxRating | 'null', { bg: string, border: string, text: string, badge: string }> = {
  'good': {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-500',
  },
  'needs-improvement': {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500',
  },
  'poor': {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-500',
  },
  'null': {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-500 dark:text-gray-400',
    badge: 'bg-gray-500',
  },
}

function formatChartDate(date: string) {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="min-h-screen">
    <!-- Hero -->
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
            Core Web Vitals
            <span class="text-indigo-600 dark:text-indigo-400">History</span>
          </h1>
          <p
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4, delay: 0.1 }"
            class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto"
          >
            Track real user performance over 25 weeks with Chrome UX Report data.
          </p>
          <template #fallback>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.1] text-gray-900 dark:text-white mb-3">
              Core Web Vitals
              <span class="text-indigo-600 dark:text-indigo-400">History</span>
            </h1>
            <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Track real user performance over 25 weeks with Chrome UX Report data.
            </p>
          </template>
        </ClientOnly>
      </div>
    </section>

    <!-- Tool Section -->
    <section class="px-3 sm:px-6 lg:px-8 pb-12">
      <div class="max-w-4xl mx-auto">
        <div class="relative">
          <!-- Glow effect -->
          <div class="absolute -inset-4 bg-gradient-to-b from-indigo-500/10 via-violet-500/5 to-transparent rounded-3xl blur-3xl pointer-events-none" />

          <div class="relative bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
            <!-- Header -->
            <div class="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800">
              <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-indigo-500" />
              <span class="text-sm font-semibold">CrUX Historical Data</span>
              <span class="ml-auto text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Field data from real Chrome users</span>
            </div>

            <!-- Input -->
            <div class="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
              <form class="space-y-4" @submit.prevent="lookup">
                <UInput
                  v-model="urlInput"
                  placeholder="Enter domain (e.g., example.com)"
                  size="lg"
                  class="flex-1"
                  icon="i-heroicons-globe-alt"
                  :disabled="loading"
                />

                <div class="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center sm:justify-between">
                  <!-- Mode toggle -->
                  <div class="flex items-center gap-2 w-full sm:w-auto">
                    <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Scope:</span>
                    <div class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-100 dark:bg-gray-800">
                      <button
                        type="button"
                        class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                        :class="[mode === 'origin' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']"
                        :disabled="loading"
                        @click="mode = 'origin'"
                      >
                        Origin
                      </button>
                      <button
                        type="button"
                        class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                        :class="[mode === 'url' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']"
                        :disabled="loading"
                        @click="mode = 'url'"
                      >
                        URL
                      </button>
                    </div>
                  </div>

                  <!-- Device toggle -->
                  <div class="flex items-center gap-2 w-full sm:w-auto">
                    <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Device:</span>
                    <div class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-100 dark:bg-gray-800">
                      <button
                        type="button"
                        class="px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                        :class="[formFactor === 'PHONE' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']"
                        :disabled="loading"
                        @click="formFactor = 'PHONE'"
                      >
                        <UIcon name="i-heroicons-device-phone-mobile" class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        class="px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                        :class="[formFactor === 'DESKTOP' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']"
                        :disabled="loading"
                        @click="formFactor = 'DESKTOP'"
                      >
                        <UIcon name="i-heroicons-computer-desktop" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <UButton
                    type="submit"
                    size="lg"
                    :disabled="!urlInput.trim() || loading"
                    :loading="loading"
                    class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                  >
                    Look Up History
                  </UButton>
                </div>
              </form>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="p-8 text-center">
              <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-indigo-500 animate-spin" />
                <span class="text-sm text-indigo-700 dark:text-indigo-300">Fetching CrUX history data...</span>
              </div>
            </div>

            <!-- Error -->
            <UAlert
              v-if="error"
              color="error"
              variant="subtle"
              icon="i-heroicons-exclamation-circle"
              class="mx-4 sm:mx-6 my-4"
            >
              <template #title>
                {{ error }}
              </template>
            </UAlert>

            <!-- No Data State -->
            <div v-if="result && !result.hasData" class="p-6 sm:p-8">
              <div class="text-center max-w-md mx-auto">
                <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-amber-500" />
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No CrUX Data Available
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  This {{ mode === 'origin' ? 'site' : 'page' }} doesn't have enough Chrome traffic to appear in the CrUX dataset.
                </p>
                <div class="text-left bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
                  <p class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Common reasons:
                  </p>
                  <ul class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li class="flex items-start gap-2">
                      <UIcon name="i-heroicons-minus" class="w-3 h-3 mt-0.5 shrink-0" />
                      New website (less than 28 days old)
                    </li>
                    <li class="flex items-start gap-2">
                      <UIcon name="i-heroicons-minus" class="w-3 h-3 mt-0.5 shrink-0" />
                      Low traffic volume
                    </li>
                    <li class="flex items-start gap-2">
                      <UIcon name="i-heroicons-minus" class="w-3 h-3 mt-0.5 shrink-0" />
                      Site blocks Chrome data collection
                    </li>
                  </ul>
                </div>
                <div class="space-y-3">
                  <p class="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Get LAB data instead:
                  </p>
                  <div class="p-3 rounded-lg bg-gray-900 dark:bg-black font-mono text-xs text-emerald-400">
                    npx unlighthouse --site {{ urlInput || 'example.com' }}
                  </div>
                  <div class="flex gap-2 justify-center">
                    <UButton
                      to="/tools/cwv-checker"
                      variant="outline"
                      size="sm"
                    >
                      Check CWV (Lab)
                    </UButton>
                    <UButton
                      to="/guide/getting-started/installation"
                      color="primary"
                      size="sm"
                    >
                      Scan Full Site
                    </UButton>
                  </div>
                </div>
              </div>
            </div>

            <!-- Results -->
            <div v-if="result?.hasData && latestData" class="p-4 sm:p-6 space-y-8">
              <!-- Pass/Fail Banner -->
              <div
                class="p-4 sm:p-6 rounded-xl text-center"
                :class="passesCWV
                  ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800'"
              >
                <div class="flex items-center justify-center gap-3 mb-2">
                  <UIcon
                    :name="passesCWV ? 'i-heroicons-check-badge-solid' : 'i-heroicons-x-circle-solid'"
                    class="w-8 h-8"
                    :class="passesCWV ? 'text-emerald-500' : 'text-red-500'"
                  />
                  <span
                    class="text-xl sm:text-2xl font-bold"
                    :class="passesCWV ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'"
                  >
                    {{ passesCWV ? 'Passes Core Web Vitals' : 'Fails Core Web Vitals' }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Based on {{ formFactor === 'PHONE' ? 'mobile' : 'desktop' }} field data • Collection period: {{ formatChartDate(latestData.collectionStart) }} - {{ formatChartDate(latestData.collectionEnd) }}
                </p>
              </div>

              <!-- CWV Metric Cards -->
              <div>
                <div class="flex items-center gap-2 mb-4">
                  <UIcon name="i-heroicons-bolt" class="w-5 h-5 text-indigo-500" />
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Core Web Vitals (P75)
                  </h3>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div
                    v-for="(metric, idx) in currentMetrics"
                    :key="metric.key"
                    v-motion
                    :initial="{ opacity: 0, y: 20 }"
                    :animate="{ opacity: 1, y: 0 }"
                    :transition="{ duration: 0.3, delay: idx * 0.1 }"
                    class="relative p-5 rounded-xl border-2 text-center cursor-pointer transition-all"
                    :class="[
                      ratingColors[metric.rating || 'null'].bg,
                      ratingColors[metric.rating || 'null'].border,
                      selectedMetric === metric.key ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900' : '',
                    ]"
                    @click="selectedMetric = metric.key"
                  >
                    <div class="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                      {{ metric.abbr }}
                    </div>
                    <div class="text-3xl font-bold mb-2" :class="ratingColors[metric.rating || 'null'].text">
                      {{ metric.displayValue }}
                    </div>
                    <UIcon
                      v-if="metric.rating"
                      :name="getCruxRatingIcon(metric.rating)"
                      class="w-6 h-6 mx-auto mb-1"
                      :class="ratingColors[metric.rating].text"
                    />
                    <div class="text-xs font-medium uppercase" :class="ratingColors[metric.rating || 'null'].text">
                      {{ metric.rating?.replace('-', ' ') || 'N/A' }}
                    </div>

                    <!-- Distribution bar -->
                    <div v-if="getHistogram(metric.key)" class="mt-3 h-2 rounded-full overflow-hidden flex">
                      <div
                        class="bg-emerald-400"
                        :style="{ width: `${getHistogram(metric.key)!.good}%` }"
                      />
                      <div
                        class="bg-amber-400"
                        :style="{ width: `${getHistogram(metric.key)!.needsImprovement}%` }"
                      />
                      <div
                        class="bg-red-400"
                        :style="{ width: `${getHistogram(metric.key)!.poor}%` }"
                      />
                    </div>
                    <div v-if="getHistogram(metric.key)" class="mt-1 flex justify-between text-[9px] text-gray-500">
                      <span>{{ getHistogram(metric.key)!.good }}% good</span>
                      <span>{{ getHistogram(metric.key)!.poor }}% poor</span>
                    </div>

                    <!-- Threshold info -->
                    <div class="text-[10px] text-gray-500 mt-2">
                      Good: ≤{{ metric.good }}{{ metric.key === 'cls' ? '' : 'ms' }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Trend Chart -->
              <div v-if="chartData">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-violet-500" />
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                      {{ result.history!.length }}-Week Trend
                    </h3>
                  </div>
                  <div class="flex gap-1 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1">
                    <button
                      v-for="m in allMetrics"
                      :key="m"
                      class="px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap"
                      :class="selectedMetric === m
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
                      @click="selectedMetric = m"
                    >
                      {{ metricDefinitions[m].abbr }}
                    </button>
                  </div>
                </div>

                <div class="relative bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                  <!-- Y-axis labels -->
                  <div class="absolute left-1 sm:left-2 top-3 sm:top-4 bottom-10 sm:bottom-12 flex flex-col justify-between text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                    <span>{{ selectedMetric === 'cls' ? chartData.maxValue.toFixed(2) : Math.round(chartData.maxValue) }}</span>
                    <span>{{ selectedMetric === 'cls' ? chartData.def.poor.toFixed(2) : chartData.def.poor }}</span>
                    <span>{{ selectedMetric === 'cls' ? chartData.def.good.toFixed(2) : chartData.def.good }}</span>
                    <span>0</span>
                  </div>

                  <!-- Chart -->
                  <div class="ml-8 sm:ml-10 mr-1 sm:mr-2">
                    <svg class="w-full h-48" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <!-- Good threshold zone -->
                      <rect x="0" :y="chartData.goodY" width="100" :height="100 - chartData.goodY" fill="rgb(16 185 129 / 0.1)" />

                      <!-- Needs improvement zone -->
                      <rect x="0" :y="chartData.poorY" width="100" :height="chartData.goodY - chartData.poorY" fill="rgb(245 158 11 / 0.1)" />

                      <!-- Poor zone -->
                      <rect x="0" y="0" width="100" :height="chartData.poorY" fill="rgb(239 68 68 / 0.05)" />

                      <!-- Good threshold line -->
                      <line x1="0" :y1="chartData.goodY" x2="100" :y2="chartData.goodY" stroke="rgb(16 185 129)" stroke-width="0.3" stroke-dasharray="2,2" />

                      <!-- Poor threshold line -->
                      <line x1="0" :y1="chartData.poorY" x2="100" :y2="chartData.poorY" stroke="rgb(239 68 68)" stroke-width="0.3" stroke-dasharray="2,2" />

                      <!-- Area fill -->
                      <path
                        :d="chartAreaPath"
                        fill="url(#chartGradient)"
                        opacity="0.3"
                      />

                      <!-- Main line -->
                      <path
                        :d="chartPath"
                        fill="none"
                        stroke="rgb(99 102 241)"
                        stroke-width="0.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />

                      <!-- Data points -->
                      <g v-for="(point, i) in chartData.points.filter(p => p.y !== null)" :key="i">
                        <circle
                          :cx="point.x"
                          :cy="point.y!"
                          r="1"
                          fill="rgb(99 102 241)"
                        />
                      </g>

                      <!-- Gradient definition -->
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stop-color="rgb(99 102 241)" stop-opacity="0.4" />
                          <stop offset="100%" stop-color="rgb(99 102 241)" stop-opacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <!-- X-axis labels -->
                    <div class="flex justify-between mt-2 text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                      <span v-if="result.history!.length">{{ formatChartDate(result.history![0].date) }}</span>
                      <span v-if="result.history!.length > 10">{{ formatChartDate(result.history![Math.floor(result.history!.length / 2)].date) }}</span>
                      <span v-if="result.history!.length">{{ formatChartDate(result.history![result.history!.length - 1].date) }}</span>
                    </div>
                  </div>

                  <!-- Legend -->
                  <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 text-xs">
                    <div class="flex items-center gap-1">
                      <div class="w-3 h-0.5 bg-emerald-500" />
                      <span class="text-gray-500 dark:text-gray-400">Good threshold</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="w-3 h-0.5 bg-red-500" />
                      <span class="text-gray-500 dark:text-gray-400">Poor threshold</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="w-3 h-0.5 bg-indigo-500" />
                      <span class="text-gray-500 dark:text-gray-400">P75 value</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Supporting Metrics -->
              <div v-if="supportingMetrics.some(m => m.value !== undefined)">
                <div class="flex items-center gap-2 mb-4">
                  <UIcon name="i-heroicons-beaker" class="w-5 h-5 text-gray-500" />
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Supporting Metrics
                  </h3>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div
                    v-for="metric in supportingMetrics"
                    :key="metric.key"
                    class="p-4 rounded-xl border cursor-pointer transition-all"
                    :class="[
                      ratingColors[metric.rating || 'null'].bg,
                      ratingColors[metric.rating || 'null'].border,
                      selectedMetric === metric.key ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900' : '',
                    ]"
                    @click="selectedMetric = metric.key"
                  >
                    <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      {{ metric.abbr }}
                    </div>
                    <div class="text-xl font-bold" :class="ratingColors[metric.rating || 'null'].text">
                      {{ metric.displayValue }}
                    </div>
                    <div class="text-[10px] text-gray-500 mt-1">
                      {{ metric.name }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Explainer -->
              <div class="p-4 sm:p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="font-semibold text-gray-900 dark:text-white mb-3">
                  Understanding Your Results
                </h3>
                <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    This is <strong class="text-gray-900 dark:text-white">field data</strong> from real Chrome users via the Chrome User Experience Report (CrUX).
                    It differs from lab data (Lighthouse) because:
                  </p>
                  <ul class="list-disc list-inside space-y-1 ml-2">
                    <li>Reflects actual user devices & networks</li>
                    <li>Based on 28-day rolling average</li>
                    <li>Requires minimum traffic threshold</li>
                  </ul>
                  <p>
                    <NuxtLink to="/learn-lighthouse/core-web-vitals" class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                      Learn more about Lab vs Field data →
                    </NuxtLink>
                  </p>
                </div>
              </div>

              <!-- Lab Data CTA -->
              <div class="p-4 sm:p-6 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800">
                <div class="flex items-start gap-4">
                  <div class="shrink-0 w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                    <UIcon name="i-heroicons-beaker" class="w-6 h-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div class="flex-1">
                    <h3 class="font-semibold text-gray-900 dark:text-white">
                      Get Lab Data Too
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      CrUX shows real users. Lighthouse shows controlled lab tests. Use both for the complete picture.
                    </p>
                    <div class="mt-3 p-3 rounded-lg bg-gray-900 dark:bg-black font-mono text-sm text-emerald-400">
                      npx unlighthouse --site {{ result.url.replace(/^https?:\/\//, '').split('/')[0] }}
                    </div>
                    <div class="flex gap-2 mt-4">
                      <UButton
                        :to="`/tools/cwv-checker?url=${encodeURIComponent(result.url)}`"
                        variant="outline"
                        size="sm"
                      >
                        Run Lab Test
                      </UButton>
                      <UButton
                        to="/guide/getting-started/installation"
                        color="primary"
                        size="sm"
                      >
                        Scan Entire Site
                      </UButton>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Feedback -->
              <ToolFeedback tool-id="cwv-history" :context="{ url: urlInput, mode, formFactor }" />
            </div>

            <!-- Empty state -->
            <div v-if="!result && !loading && !error" class="p-8 text-center text-gray-500">
              <UIcon name="i-heroicons-chart-bar" class="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Enter a domain to view CrUX history</p>
              <p class="text-xs mt-2">
                Tracks real Chrome user data over 25 weeks
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="px-3 sm:px-6 lg:px-8 pb-16">
      <div class="max-w-4xl mx-auto">
        <ToolFaq :faqs="faqs" color="violet" />
      </div>
    </section>
  </div>
</template>
