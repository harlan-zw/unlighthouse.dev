<script setup lang="ts">
import type { CWVCompareResponse, SiteComparison } from '~~/server/api/tools/cwv-compare.post'
import type { CruxRating, MetricKey } from '~/utils/crux'
import { watchDebounced } from '@vueuse/core'
import {
  allMetrics,
  formatCruxMetricValue,
  getMetricRating,
  metricDefinitions,
} from '~/utils/crux'

definePageMeta({
  breadcrumb: {
    icon: 'i-heroicons-scale',
    ariaLabel: 'Core Web Vitals Comparison',
  },
})

useSeoMeta({
  title: 'Core Web Vitals Comparison - Benchmark Against Competitors',
  description: 'Compare Core Web Vitals across multiple websites. See how your LCP, CLS, and INP stack up against competitors with real Chrome user data.',
})

defineOgImage('NuxtSeo', {
  title: 'Core Web Vitals Comparison',
  description: 'Benchmark your site against competitors',
  theme: '#f97316',
})

useSchemaOrg([
  {
    '@type': 'WebApplication',
    'name': 'Core Web Vitals Comparison Tool',
    'description': 'Compare Core Web Vitals performance across multiple websites using real Chrome user data',
    'url': 'https://unlighthouse.dev/tools/cwv-compare',
    'applicationCategory': 'DeveloperApplication',
    'operatingSystem': 'Web',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
    'featureList': [
      'Compare 2-4 websites side-by-side',
      'Real user field data (CrUX)',
      'Core Web Vitals metrics comparison',
      'Trend overlay visualization',
      'Automatic winner detection',
    ],
  },
])

type FormFactor = 'PHONE' | 'DESKTOP'

const route = useRoute()
const router = useRouter()

const urls = ref<string[]>(['', ''])
const formFactor = ref<FormFactor>('PHONE')
const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<CWVCompareResponse | null>(null)
const selectedTrendMetric = ref<MetricKey>('lcp')

onMounted(() => {
  const sitesParam = route.query.sites as string
  const deviceParam = route.query.device as string

  if (deviceParam === 'desktop')
    formFactor.value = 'DESKTOP'

  if (sitesParam) {
    const parsed = sitesParam.split(',').map(s => decodeURIComponent(s.trim())).filter(Boolean)
    if (parsed.length >= 2) {
      urls.value = parsed.slice(0, 4)
      while (urls.value.length < 2)
        urls.value.push('')
      compare()
    }
  }
})

watchDebounced(
  urls,
  (newUrls) => {
    const validUrls = newUrls.filter(u => u.trim())
    if (validUrls.length >= 2) {
      router.replace({ query: { ...route.query, sites: validUrls.map(u => encodeURIComponent(u)).join(',') } })
    }
    else {
      const { sites: _, ...rest } = route.query
      router.replace({ query: rest })
    }
  },
  { debounce: 500, deep: true },
)

watch(formFactor, (newFactor) => {
  router.replace({ query: { ...route.query, device: newFactor === 'DESKTOP' ? 'desktop' : undefined } })
})

function addUrl() {
  if (urls.value.length < 4)
    urls.value.push('')
}

function removeUrl(index: number) {
  if (urls.value.length > 2)
    urls.value.splice(index, 1)
}

function compare() {
  const validUrls = urls.value.filter(u => u.trim())
  if (validUrls.length < 2) {
    error.value = 'Enter at least 2 domains to compare'
    return
  }

  loading.value = true
  error.value = null
  result.value = null

  $fetch<CWVCompareResponse>('/api/tools/cwv-compare', {
    method: 'POST',
    body: {
      urls: validUrls,
      formFactor: formFactor.value,
      includeHistory: true,
    },
  })
    .then((data) => {
      result.value = data
    })
    .catch((err) => {
      error.value = err.data?.message || err.message || 'Failed to fetch comparison data'
    })
    .finally(() => {
      loading.value = false
    })
}

function getMetricValue(comp: SiteComparison, metric: MetricKey): number | undefined {
  return comp.current?.[metric]?.p75
}

function getMetricHistogram(comp: SiteComparison, metric: MetricKey) {
  const data = comp.current?.[metric]
  if (!data)
    return null
  return {
    good: Math.round(data.good * 100),
    needsImprovement: Math.round(data.needsImprovement * 100),
    poor: Math.round(data.poor * 100),
  }
}

function isWinner(comp: SiteComparison, metric: MetricKey): boolean {
  return result.value?.winners[metric] === comp.url
}

function isOverallWinner(comp: SiteComparison): boolean {
  return result.value?.winners.overall === comp.url
}

// Chart data for trend comparison
const trendChartData = computed(() => {
  if (!result.value)
    return null

  const metric = selectedTrendMetric.value
  const def = metricDefinitions[metric]
  const p75Key = `${metric}75` as const

  // Collect all dates and values
  const sitesWithHistory = result.value.comparisons.filter(c => c.history?.length)
  if (!sitesWithHistory.length)
    return null

  // Find common date range
  const allDates = new Set<string>()
  sitesWithHistory.forEach((site) => {
    site.history?.forEach(h => allDates.add(h.date))
  })
  const sortedDates = [...allDates].sort()

  if (sortedDates.length < 2)
    return null

  // Get max value across all sites
  let maxValue = def.poor * 1.2
  sitesWithHistory.forEach((site) => {
    site.history?.forEach((h) => {
      const val = h[p75Key]
      if (val && val > maxValue)
        maxValue = val * 1.1
    })
  })

  // Build series for each site
  const series = sitesWithHistory.map((site, idx) => {
    const values = sortedDates.map((date) => {
      const entry = site.history?.find(h => h.date === date)
      return entry?.[p75Key] || null
    })

    const points = sortedDates.map((date, i) => {
      const val = values[i]
      return {
        x: (i / (sortedDates.length - 1)) * 100,
        y: val !== null ? 100 - ((val - 0) / (maxValue - 0)) * 100 : null,
        value: val,
        date,
      }
    }).filter(p => p.y !== null)

    return {
      url: site.url,
      color: siteColors[idx % siteColors.length],
      points,
      path: points.length >= 2
        ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
        : '',
    }
  })

  const goodY = 100 - ((def.good - 0) / (maxValue - 0)) * 100
  const poorY = 100 - ((def.poor - 0) / (maxValue - 0)) * 100

  return {
    series,
    dates: sortedDates,
    maxValue,
    goodY,
    poorY,
    def,
  }
})

const siteColors = [
  { stroke: 'rgb(249 115 22)', fill: 'rgba(249, 115, 22, 0.15)', class: 'text-orange-500', bg: 'bg-orange-500' },
  { stroke: 'rgb(59 130 246)', fill: 'rgba(59, 130, 246, 0.15)', class: 'text-blue-500', bg: 'bg-blue-500' },
  { stroke: 'rgb(168 85 247)', fill: 'rgba(168, 85, 247, 0.15)', class: 'text-purple-500', bg: 'bg-purple-500' },
  { stroke: 'rgb(20 184 166)', fill: 'rgba(20, 184, 166, 0.15)', class: 'text-teal-500', bg: 'bg-teal-500' },
]

const ratingColors: Record<CruxRating | 'null', { bg: string, border: string, text: string, badge: string }> = {
  'good': {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-500',
  },
  'needs-improvement': {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500',
  },
  'poor': {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-500',
    text: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-500',
  },
  'null': {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-300 dark:border-gray-600',
    text: 'text-gray-500 dark:text-gray-400',
    badge: 'bg-gray-500',
  },
}

function formatChartDate(date: string) {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatCollectionDate(date: string) {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getDomain(url: string): string {
  const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^/]+)/i)
  return match ? match[1] : url
}

function getBarWidth(comp: SiteComparison, metric: MetricKey): number {
  if (!result.value)
    return 0
  const value = getMetricValue(comp, metric)
  if (value === undefined)
    return 0

  const def = metricDefinitions[metric]
  // Scale: 0 = 0%, poor threshold = 80%, max = 100%
  const maxDisplay = def.poor * 1.5
  return Math.min(100, (value / maxDisplay) * 100)
}

const cwvMetrics: MetricKey[] = ['lcp', 'cls', 'inp']
const supportingMetrics: MetricKey[] = ['fcp', 'ttfb']
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
    <!-- Hero with racing stripe motif -->
    <section class="relative pt-10 pb-6 lg:pt-12 lg:pb-8 overflow-hidden">
      <!-- Diagonal stripes background -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-orange-500/10 to-amber-500/10 dark:from-orange-500/5 dark:to-amber-500/5 rotate-12 blur-3xl" />
        <div class="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-tr from-blue-500/10 to-violet-500/10 dark:from-blue-500/5 dark:to-violet-500/5 -rotate-12 blur-3xl" />
      </div>

      <div class="max-w-5xl mx-auto px-6 text-center relative">
        <ClientOnly>
          <div
            v-motion
            :initial="{ opacity: 0, y: -10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.3 }"
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-bold tracking-wider mb-4"
          >
            <UIcon name="i-heroicons-trophy" class="w-3 h-3" />
            PERFORMANCE SHOWDOWN
          </div>
          <h1
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4, delay: 0.05 }"
            class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05] text-gray-900 dark:text-white mb-3"
          >
            CWV
            <span class="relative">
              <span class="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent">Compare</span>
              <span class="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-full" />
            </span>
          </h1>
          <p
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4, delay: 0.1 }"
            class="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto font-medium"
          >
            Pit your site against competitors. Real Chrome user data. Clear winners.
          </p>
          <template #fallback>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-bold tracking-wider mb-4">
              <UIcon name="i-heroicons-trophy" class="w-3 h-3" />
              PERFORMANCE SHOWDOWN
            </div>
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05] text-gray-900 dark:text-white mb-3">
              CWV
              <span class="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent">Compare</span>
            </h1>
            <p class="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto font-medium">
              Pit your site against competitors. Real Chrome user data. Clear winners.
            </p>
          </template>
        </ClientOnly>
      </div>
    </section>

    <!-- Tool Section -->
    <section class="px-3 sm:px-6 lg:px-8 pb-12">
      <div class="max-w-5xl mx-auto">
        <div class="relative">
          <!-- Glow effect -->
          <div class="absolute -inset-4 bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent rounded-3xl blur-3xl pointer-events-none" />

          <div class="relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-200 dark:ring-gray-800">
            <!-- Header with competitive styling -->
            <div class="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
              <div class="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
                <UIcon name="i-heroicons-scale" class="w-5 h-5 text-white" />
              </div>
              <div class="flex-1">
                <span class="text-sm font-bold text-gray-900 dark:text-white">Core Web Vitals Comparison</span>
                <span class="ml-2 text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">• Field data from real Chrome users</span>
              </div>
              <div class="text-xs font-medium px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                CrUX
              </div>
            </div>

            <!-- Input Section -->
            <div class="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
              <form class="space-y-4" @submit.prevent="compare">
                <!-- URL Inputs -->
                <div class="space-y-3">
                  <div
                    v-for="(url, index) in urls"
                    :key="index"
                    class="relative group"
                  >
                    <div class="flex items-center gap-2">
                      <div
                        class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                        :class="siteColors[index % siteColors.length].bg"
                        :style="{ color: 'white' }"
                      >
                        {{ index + 1 }}
                      </div>
                      <UInput
                        v-model="urls[index]"
                        :placeholder="index === 0 ? 'Your site (e.g., mysite.com)' : `Competitor ${index} (e.g., competitor${index}.com)`"
                        size="lg"
                        class="flex-1"
                        icon="i-heroicons-globe-alt"
                        :disabled="loading"
                      />
                      <button
                        v-if="urls.length > 2"
                        type="button"
                        class="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        :disabled="loading"
                        @click="removeUrl(index)"
                      >
                        <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Add URL button -->
                <div v-if="urls.length < 4">
                  <button
                    type="button"
                    class="w-full p-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    :disabled="loading"
                    @click="addUrl"
                  >
                    <UIcon name="i-heroicons-plus-circle" class="w-5 h-5" />
                    Add Competitor ({{ 4 - urls.length }} remaining)
                  </button>
                </div>

                <!-- Controls -->
                <div class="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center sm:justify-between pt-2">
                  <!-- Device toggle -->
                  <div class="flex items-center gap-3">
                    <span class="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Device:</span>
                    <div class="inline-flex rounded-xl border border-gray-200 dark:border-gray-700 p-1 bg-gray-100 dark:bg-gray-800">
                      <button
                        type="button"
                        class="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                        :class="[formFactor === 'PHONE' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']"
                        :disabled="loading"
                        @click="formFactor = 'PHONE'"
                      >
                        <UIcon name="i-heroicons-device-phone-mobile" class="w-4 h-4" />
                        Mobile
                      </button>
                      <button
                        type="button"
                        class="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                        :class="[formFactor === 'DESKTOP' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']"
                        :disabled="loading"
                        @click="formFactor = 'DESKTOP'"
                      >
                        <UIcon name="i-heroicons-computer-desktop" class="w-4 h-4" />
                        Desktop
                      </button>
                    </div>
                  </div>

                  <UButton
                    type="submit"
                    size="xl"
                    :disabled="urls.filter(u => u.trim()).length < 2 || loading"
                    :loading="loading"
                    class="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
                  >
                    <UIcon name="i-heroicons-play" class="w-5 h-5 mr-2" />
                    Start Comparison
                  </UButton>
                </div>
              </form>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="p-12 text-center">
              <div class="relative w-20 h-20 mx-auto mb-4">
                <div class="absolute inset-0 rounded-full border-4 border-orange-200 dark:border-orange-900" />
                <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" />
                <UIcon name="i-heroicons-scale" class="absolute inset-0 m-auto w-8 h-8 text-orange-500" />
              </div>
              <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Gathering performance data...
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fetching CrUX metrics for {{ urls.filter(u => u.trim()).length }} sites
              </p>
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

            <!-- Results -->
            <div v-if="result && !loading" class="p-4 sm:p-6 space-y-8">
              <!-- Overall Winner Banner -->
              <div
                v-if="result.winners.overall"
                v-motion
                :initial="{ opacity: 0, scale: 0.95 }"
                :animate="{ opacity: 1, scale: 1 }"
                :transition="{ duration: 0.4, delay: 0.1 }"
                class="relative p-6 rounded-2xl overflow-hidden"
              >
                <!-- Trophy pattern background -->
                <div class="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500" />
                <div class="absolute inset-0 opacity-10">
                  <div class="absolute inset-0" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px);" />
                </div>

                <div class="relative flex items-center justify-between gap-4 flex-wrap">
                  <div class="flex items-center gap-4">
                    <div class="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <UIcon name="i-heroicons-trophy-solid" class="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <div class="text-xs font-bold text-white/80 uppercase tracking-wider">
                        Overall Winner
                      </div>
                      <div class="text-2xl sm:text-3xl font-black text-white">
                        {{ getDomain(result.winners.overall) }}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <template v-for="(comp, idx) in result.comparisons.filter(c => c.url === result!.winners.overall)" :key="comp.url">
                      <div class="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white text-sm font-bold">
                        {{ comp.cwvScore }}/3 CWV Passed
                      </div>
                    </template>
                  </div>
                </div>
              </div>

              <!-- Collection Period -->
              <div v-if="result.collectionPeriod" class="text-center text-xs text-gray-500 dark:text-gray-400">
                <UIcon name="i-heroicons-calendar" class="w-3.5 h-3.5 inline mr-1" />
                Data from {{ formatCollectionDate(result.collectionPeriod.start) }} to {{ formatCollectionDate(result.collectionPeriod.end) }}
              </div>

              <!-- CWV Metric Comparisons -->
              <div class="space-y-6">
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-bolt" class="w-5 h-5 text-orange-500" />
                  <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                    Core Web Vitals
                  </h3>
                  <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">(P75 values)</span>
                </div>

                <div
                  v-for="metric in cwvMetrics"
                  :key="metric"
                  class="relative"
                >
                  <div
                    v-motion
                    :initial="{ opacity: 0, x: -20 }"
                    :animate="{ opacity: 1, x: 0 }"
                    :transition="{ duration: 0.3 }"
                    class="p-4 sm:p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                  >
                    <!-- Metric Header -->
                    <div class="flex items-center justify-between mb-4">
                      <div class="flex items-center gap-3">
                        <span class="text-lg font-black text-gray-900 dark:text-white">{{ metricDefinitions[metric].abbr }}</span>
                        <span class="text-sm text-gray-500 dark:text-gray-400">{{ metricDefinitions[metric].name }}</span>
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        Good: ≤{{ metric === 'cls' ? metricDefinitions[metric].good.toFixed(2) : metricDefinitions[metric].good }}{{ metric === 'cls' ? '' : 'ms' }}
                      </div>
                    </div>

                    <!-- Comparison Bars -->
                    <div class="space-y-3">
                      <div
                        v-for="(comp, idx) in result.comparisons"
                        :key="comp.url"
                        class="relative"
                      >
                        <div class="flex items-center gap-3">
                          <!-- Site indicator -->
                          <div
                            class="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                            :class="siteColors[idx % siteColors.length].bg"
                            style="color: white;"
                          >
                            {{ idx + 1 }}
                          </div>

                          <!-- Domain name -->
                          <div class="w-32 sm:w-40 truncate text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {{ getDomain(comp.url) }}
                          </div>

                          <!-- Bar container -->
                          <div class="flex-1 relative">
                            <div class="h-8 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden relative">
                              <!-- Threshold markers -->
                              <div
                                class="absolute top-0 bottom-0 w-px bg-emerald-500 z-10"
                                :style="{ left: `${(metricDefinitions[metric].good / (metricDefinitions[metric].poor * 1.5)) * 100}%` }"
                              />
                              <div
                                class="absolute top-0 bottom-0 w-px bg-red-500 z-10"
                                :style="{ left: `${(metricDefinitions[metric].poor / (metricDefinitions[metric].poor * 1.5)) * 100}%` }"
                              />

                              <!-- Value bar -->
                              <div
                                v-if="comp.hasData && getMetricValue(comp, metric) !== undefined"
                                v-motion
                                :initial="{ width: 0 }"
                                :animate="{ width: `${getBarWidth(comp, metric)}%` }"
                                :transition="{ duration: 0.6, delay: idx * 0.1 }"
                                class="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end pr-2"
                                :class="[
                                  ratingColors[getMetricRating(metric, getMetricValue(comp, metric)!)].badge,
                                  isWinner(comp, metric) ? 'ring-2 ring-yellow-400 ring-offset-1' : '',
                                ]"
                              >
                                <span class="text-xs font-bold text-white drop-shadow-sm">
                                  {{ formatCruxMetricValue(metric, getMetricValue(comp, metric)) }}
                                </span>
                              </div>

                              <!-- No data -->
                              <div v-else class="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
                                No data
                              </div>
                            </div>
                          </div>

                          <!-- Winner badge -->
                          <div class="w-8 flex justify-center">
                            <UIcon
                              v-if="isWinner(comp, metric) && comp.hasData"
                              name="i-heroicons-trophy-solid"
                              class="w-5 h-5 text-yellow-500"
                            />
                          </div>
                        </div>

                        <!-- Histogram under bar -->
                        <div v-if="getMetricHistogram(comp, metric)" class="ml-9 sm:ml-[4.5rem] mt-1 flex items-center gap-2">
                          <div class="flex-1 h-1.5 rounded-full overflow-hidden flex">
                            <div
                              class="bg-emerald-400"
                              :style="{ width: `${getMetricHistogram(comp, metric)!.good}%` }"
                            />
                            <div
                              class="bg-amber-400"
                              :style="{ width: `${getMetricHistogram(comp, metric)!.needsImprovement}%` }"
                            />
                            <div
                              class="bg-red-400"
                              :style="{ width: `${getMetricHistogram(comp, metric)!.poor}%` }"
                            />
                          </div>
                          <span class="text-[10px] text-gray-500 w-14 text-right">{{ getMetricHistogram(comp, metric)!.good }}% good</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Supporting Metrics -->
              <div class="space-y-4">
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-beaker" class="w-5 h-5 text-gray-500" />
                  <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                    Supporting Metrics
                  </h3>
                </div>

                <div class="grid sm:grid-cols-2 gap-4">
                  <div
                    v-for="metric in supportingMetrics"
                    :key="metric"
                    class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                  >
                    <div class="flex items-center justify-between mb-3">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-gray-900 dark:text-white">{{ metricDefinitions[metric].abbr }}</span>
                        <span class="text-xs text-gray-500">{{ metricDefinitions[metric].name }}</span>
                      </div>
                    </div>

                    <div class="space-y-2">
                      <div
                        v-for="(comp, idx) in result.comparisons"
                        :key="comp.url"
                        class="flex items-center gap-2"
                      >
                        <div
                          class="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
                          :class="siteColors[idx % siteColors.length].bg"
                          style="color: white;"
                        >
                          {{ idx + 1 }}
                        </div>
                        <div class="flex-1 truncate text-xs text-gray-600 dark:text-gray-400">
                          {{ getDomain(comp.url) }}
                        </div>
                        <div
                          class="text-sm font-bold"
                          :class="comp.hasData && getMetricValue(comp, metric) !== undefined
                            ? ratingColors[getMetricRating(metric, getMetricValue(comp, metric)!)].text
                            : 'text-gray-400'"
                        >
                          {{ comp.hasData ? formatCruxMetricValue(metric, getMetricValue(comp, metric)) : '-' }}
                        </div>
                        <UIcon
                          v-if="isWinner(comp, metric) && comp.hasData"
                          name="i-heroicons-trophy-solid"
                          class="w-4 h-4 text-yellow-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Trend Comparison Chart -->
              <div v-if="trendChartData" class="space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-violet-500" />
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                      Trend Comparison
                    </h3>
                  </div>
                  <div class="flex gap-1 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1">
                    <button
                      v-for="m in allMetrics"
                      :key="m"
                      class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                      :class="selectedTrendMetric === m
                        ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
                      @click="selectedTrendMetric = m"
                    >
                      {{ metricDefinitions[m].abbr }}
                    </button>
                  </div>
                </div>

                <div class="relative bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <!-- Y-axis labels -->
                  <div class="absolute left-2 top-4 bottom-12 flex flex-col justify-between text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                    <span>{{ selectedTrendMetric === 'cls' ? trendChartData.maxValue.toFixed(2) : Math.round(trendChartData.maxValue) }}</span>
                    <span>{{ selectedTrendMetric === 'cls' ? trendChartData.def.poor.toFixed(2) : trendChartData.def.poor }}</span>
                    <span>{{ selectedTrendMetric === 'cls' ? trendChartData.def.good.toFixed(2) : trendChartData.def.good }}</span>
                    <span>0</span>
                  </div>

                  <!-- Chart -->
                  <div class="ml-10 mr-2">
                    <svg class="w-full h-52" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <!-- Good zone -->
                      <rect x="0" :y="trendChartData.goodY" width="100" :height="100 - trendChartData.goodY" fill="rgb(16 185 129 / 0.08)" />
                      <!-- NI zone -->
                      <rect x="0" :y="trendChartData.poorY" width="100" :height="trendChartData.goodY - trendChartData.poorY" fill="rgb(245 158 11 / 0.08)" />
                      <!-- Poor zone -->
                      <rect x="0" y="0" width="100" :height="trendChartData.poorY" fill="rgb(239 68 68 / 0.05)" />

                      <!-- Threshold lines -->
                      <line x1="0" :y1="trendChartData.goodY" x2="100" :y2="trendChartData.goodY" stroke="rgb(16 185 129)" stroke-width="0.3" stroke-dasharray="2,2" />
                      <line x1="0" :y1="trendChartData.poorY" x2="100" :y2="trendChartData.poorY" stroke="rgb(239 68 68)" stroke-width="0.3" stroke-dasharray="2,2" />

                      <!-- Site lines -->
                      <template v-for="(series, idx) in trendChartData.series" :key="series.url">
                        <path
                          v-if="series.path"
                          :d="series.path"
                          fill="none"
                          :stroke="series.color.stroke"
                          stroke-width="0.8"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <g v-for="(point, i) in series.points" :key="i">
                          <circle
                            :cx="point.x"
                            :cy="point.y!"
                            r="0.8"
                            :fill="series.color.stroke"
                          />
                        </g>
                      </template>
                    </svg>

                    <!-- X-axis labels -->
                    <div class="flex justify-between mt-2 text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                      <span>{{ formatChartDate(trendChartData.dates[0]) }}</span>
                      <span v-if="trendChartData.dates.length > 10">{{ formatChartDate(trendChartData.dates[Math.floor(trendChartData.dates.length / 2)]) }}</span>
                      <span>{{ formatChartDate(trendChartData.dates[trendChartData.dates.length - 1]) }}</span>
                    </div>
                  </div>

                  <!-- Legend -->
                  <div class="flex flex-wrap items-center justify-center gap-4 mt-4">
                    <div
                      v-for="(series, idx) in trendChartData.series"
                      :key="series.url"
                      class="flex items-center gap-2"
                    >
                      <div class="w-4 h-1 rounded" :style="{ backgroundColor: series.color.stroke }" />
                      <span class="text-xs text-gray-600 dark:text-gray-400">{{ getDomain(series.url) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Summary Cards -->
              <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  v-for="(comp, idx) in result.comparisons"
                  :key="comp.url"
                  class="relative p-4 rounded-xl border-2 transition-all"
                  :class="[
                    isOverallWinner(comp)
                      ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50',
                  ]"
                >
                  <!-- Winner crown -->
                  <div v-if="isOverallWinner(comp)" class="absolute -top-3 -right-2">
                    <UIcon name="i-heroicons-trophy-solid" class="w-6 h-6 text-yellow-500" />
                  </div>

                  <div class="flex items-center gap-2 mb-3">
                    <div
                      class="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                      :class="siteColors[idx % siteColors.length].bg"
                      style="color: white;"
                    >
                      {{ idx + 1 }}
                    </div>
                    <div class="font-semibold text-gray-900 dark:text-white truncate flex-1">
                      {{ getDomain(comp.url) }}
                    </div>
                  </div>

                  <div v-if="comp.hasData" class="space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-gray-500">CWV Score</span>
                      <div class="flex gap-1">
                        <div
                          v-for="i in 3"
                          :key="i"
                          class="w-4 h-4 rounded-full"
                          :class="i <= comp.cwvScore ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'"
                        />
                      </div>
                    </div>
                    <div
                      class="text-center py-2 rounded-lg text-sm font-bold"
                      :class="comp.passesAllCWV
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'"
                    >
                      {{ comp.passesAllCWV ? '✓ Passes CWV' : '✗ Fails CWV' }}
                    </div>
                  </div>
                  <div v-else class="text-center py-4 text-sm text-gray-500">
                    No CrUX data
                  </div>
                </div>
              </div>

              <!-- Explainer -->
              <div class="p-4 sm:p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="font-bold text-gray-900 dark:text-white mb-2">
                  About This Comparison
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  This comparison uses real Chrome user data (CrUX) showing the 75th percentile (P75) of each metric.
                  Winners are determined by the lowest (best) P75 value for each metric. Overall winner considers
                  Core Web Vitals pass rate and combined metric performance.
                </p>
              </div>

              <!-- Feedback -->
              <ToolFeedback tool-id="cwv-compare" :context="{ urls: urls.filter(u => u.trim()), formFactor }" />
            </div>

            <!-- Empty state -->
            <div v-if="!result && !loading && !error" class="p-12 text-center">
              <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center">
                <UIcon name="i-heroicons-scale" class="w-10 h-10 text-orange-500" />
              </div>
              <p class="font-semibold text-gray-700 dark:text-gray-300">
                Enter domains to compare
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Compare 2-4 sites using real Chrome user data
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="px-3 sm:px-6 lg:px-8 pb-16">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Frequently Asked Questions
        </h2>

        <div class="grid sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              What data is being compared?
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              This tool compares real user performance data from the Chrome User Experience Report (CrUX).
              It shows P75 values—the experience of 75% of your users.
            </p>
          </div>

          <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              Why is there no data for a site?
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Sites need sufficient Chrome traffic to appear in CrUX. New sites, low-traffic sites, or
              sites blocking data collection won't have field data available.
            </p>
          </div>

          <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              How is the winner determined?
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              For each metric, the site with the lowest (fastest/best) P75 value wins. Overall winner
              prioritizes Core Web Vitals pass rate, then combined metric performance.
            </p>
          </div>

          <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              Can I share this comparison?
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Yes! The URL updates as you compare sites. Copy and share the URL to show others
              the same comparison results.
            </p>
          </div>
        </div>

        <!-- Related Resources -->
        <div class="mt-10 text-center">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Improve Your Core Web Vitals
          </h3>
          <div class="flex flex-wrap justify-center gap-2">
            <UButton to="/learn-lighthouse/lcp" variant="ghost" size="sm">
              <UIcon name="i-heroicons-photo" class="w-4 h-4 mr-1" />
              Fix LCP
            </UButton>
            <UButton to="/learn-lighthouse/cls" variant="ghost" size="sm">
              <UIcon name="i-heroicons-arrows-pointing-out" class="w-4 h-4 mr-1" />
              Fix CLS
            </UButton>
            <UButton to="/learn-lighthouse/inp" variant="ghost" size="sm">
              <UIcon name="i-heroicons-cursor-arrow-rays" class="w-4 h-4 mr-1" />
              Fix INP
            </UButton>
            <UButton to="/learn-lighthouse/core-web-vitals" variant="ghost" size="sm">
              <UIcon name="i-heroicons-academic-cap" class="w-4 h-4 mr-1" />
              Full Guide
            </UButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
