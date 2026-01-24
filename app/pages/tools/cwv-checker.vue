<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import { motion } from 'motion-v'

definePageMeta({
  breadcrumb: {
    icon: 'i-heroicons-check-badge',
    ariaLabel: 'Core Web Vitals Checker',
  },
})

useSeoMeta({
  title: 'Core Web Vitals Test - Free CWV Checker',
  description: 'Check if your page passes Google\'s Core Web Vitals. Test LCP, CLS, and INP with lab and real user data. Free tool with actionable recommendations.',
})

defineOgImage('NuxtSeo', {
  title: 'Core Web Vitals Test',
  description: 'Check LCP, CLS & INP',
  theme: '#10b981',
})

// Schema.org structured data
useSchemaOrg([
  {
    '@type': 'WebApplication',
    'name': 'Core Web Vitals Checker',
    'description': 'Test any URL against Google\'s Core Web Vitals thresholds',
    'url': 'https://unlighthouse.dev/tools/cwv-checker',
    'applicationCategory': 'DeveloperApplication',
    'operatingSystem': 'Web',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
    'featureList': [
      'LCP measurement',
      'CLS measurement',
      'INP measurement',
      'Lab and field data',
      'Mobile and desktop testing',
      'Fix recommendations',
    ],
  },
  {
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'What are Core Web Vitals?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Core Web Vitals are three metrics Google uses to measure user experience: LCP (loading speed), CLS (visual stability), and INP (interactivity). They are a confirmed ranking factor in Google Search.',
        },
      },
      {
        '@type': 'Question',
        'name': 'What is a good Core Web Vitals score?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Good scores are: LCP under 2.5 seconds, CLS under 0.1, and INP under 200 milliseconds. To pass Core Web Vitals, at least 75% of page loads must meet the good threshold for all three metrics.',
        },
      },
      {
        '@type': 'Question',
        'name': 'Do Core Web Vitals affect SEO?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes. Core Web Vitals are a confirmed Google ranking factor as part of page experience signals. Pages that pass CWV may have a ranking advantage over those that don\'t.',
        },
      },
    ],
  },
])

interface MetricResult {
  value: number
  displayValue: string
  rating: 'good' | 'needs-improvement' | 'poor'
  score: number
}

interface FieldMetric {
  value: number
  displayValue: string
  rating: 'good' | 'needs-improvement' | 'poor'
  percentiles: { good: number, needsImprovement: number, poor: number }
}

interface Recommendation {
  metric: string
  title: string
  description: string
  learnMoreUrl: string
  toolUrl?: string
}

interface CWVResult {
  url: string
  fetchedUrl: string
  timestamp: number
  strategy: 'mobile' | 'desktop'
  passesCWV: boolean
  performanceScore: number
  lab: {
    lcp: MetricResult | null
    cls: MetricResult | null
    fcp: MetricResult | null
    tbt: MetricResult | null
    si: MetricResult | null
    ttfb: MetricResult | null
  }
  field: {
    lcp: FieldMetric | null
    cls: FieldMetric | null
    inp: FieldMetric | null
    fcp: FieldMetric | null
    ttfb: FieldMetric | null
    originFallback: boolean
  } | null
  recommendations: Recommendation[]
  filmstrip: Array<{ timing: number, data: string }>
  screenshot: { data: string, width: number, height: number } | null
}

const route = useRoute()
const router = useRouter()
const urlInput = ref('')
const strategy = ref<'mobile' | 'desktop'>('mobile')
const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<CWVResult | null>(null)

const loadingMessages = [
  'Connecting to PageSpeed Insights API...',
  'Running Lighthouse audit...',
  'Measuring Core Web Vitals...',
  'Checking real user data (CrUX)...',
  'Analyzing page performance...',
  'Generating recommendations...',
]
const loadingMessageIdx = ref(0)
let loadingTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  const urlParam = route.query.url as string
  const strategyParam = route.query.strategy as string
  if (strategyParam === 'desktop')
    strategy.value = 'desktop'
  if (urlParam) {
    urlInput.value = decodeURIComponent(urlParam)
    analyze()
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

watch(strategy, (newStrategy) => {
  if (newStrategy === 'desktop') {
    router.replace({ query: { ...route.query, strategy: 'desktop' } })
  }
  else {
    const { strategy: _, ...rest } = route.query
    router.replace({ query: rest })
  }
})

function startLoadingMessages() {
  loadingMessageIdx.value = 0
  loadingTimer = setInterval(() => {
    loadingMessageIdx.value = (loadingMessageIdx.value + 1) % loadingMessages.length
  }, 3000)
}

function stopLoadingMessages() {
  if (loadingTimer) {
    clearInterval(loadingTimer)
    loadingTimer = null
  }
}

onUnmounted(stopLoadingMessages)

function analyze() {
  if (!urlInput.value.trim())
    return

  loading.value = true
  error.value = null
  result.value = null
  startLoadingMessages()

  $fetch<CWVResult>('/api/tools/cwv-check', {
    query: { url: urlInput.value, strategy: strategy.value },
  })
    .then((data) => {
      result.value = data
    })
    .catch((err) => {
      error.value = err.data?.message || err.message || 'Failed to analyze URL'
    })
    .finally(() => {
      loading.value = false
      stopLoadingMessages()
    })
}

const ratingColors = {
  'good': {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-500',
  },
  'needs-improvement': {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-500',
  },
  'poor': {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-500',
  },
}

const metricLabels = {
  lcp: 'Largest Contentful Paint',
  cls: 'Cumulative Layout Shift',
  inp: 'Interaction to Next Paint',
  fcp: 'First Contentful Paint',
  tbt: 'Total Blocking Time',
  si: 'Speed Index',
  ttfb: 'Time to First Byte',
}

const metricDescriptions = {
  lcp: 'Measures loading performance. Good: ≤2.5s',
  cls: 'Measures visual stability. Good: ≤0.1',
  inp: 'Measures interactivity. Good: ≤200ms',
}

function getRatingIcon(rating: string) {
  if (rating === 'good')
    return 'i-heroicons-check-circle-solid'
  if (rating === 'needs-improvement')
    return 'i-heroicons-exclamation-circle-solid'
  return 'i-heroicons-x-circle-solid'
}

// Get the CWV metrics to display prominently
const cwvMetrics = computed(() => {
  if (!result.value)
    return []

  const metrics = []

  // LCP - prefer field, fall back to lab
  const lcpField = result.value.field?.lcp
  const lcpLab = result.value.lab.lcp
  if (lcpField || lcpLab) {
    metrics.push({
      key: 'lcp',
      label: 'LCP',
      fullLabel: 'Largest Contentful Paint',
      description: 'Loading',
      value: lcpField?.displayValue || lcpLab?.displayValue || '',
      rating: lcpField?.rating || lcpLab?.rating || 'poor',
      source: lcpField ? 'field' : 'lab',
      percentiles: lcpField?.percentiles,
    })
  }

  // CLS - prefer field, fall back to lab
  const clsField = result.value.field?.cls
  const clsLab = result.value.lab.cls
  if (clsField || clsLab) {
    metrics.push({
      key: 'cls',
      label: 'CLS',
      fullLabel: 'Cumulative Layout Shift',
      description: 'Visual Stability',
      value: clsField?.displayValue || clsLab?.displayValue || '',
      rating: clsField?.rating || clsLab?.rating || 'poor',
      source: clsField ? 'field' : 'lab',
      percentiles: clsField?.percentiles,
    })
  }

  // INP - field only (lab uses TBT as proxy)
  const inpField = result.value.field?.inp
  const tbtLab = result.value.lab.tbt
  metrics.push({
    key: 'inp',
    label: inpField ? 'INP' : 'TBT',
    fullLabel: inpField ? 'Interaction to Next Paint' : 'Total Blocking Time',
    description: 'Interactivity',
    value: inpField?.displayValue || tbtLab?.displayValue || 'N/A',
    rating: inpField?.rating || tbtLab?.rating || 'poor',
    source: inpField ? 'field' : 'lab',
    percentiles: inpField?.percentiles,
    isProxy: !inpField,
  })

  return metrics
})
</script>

<template>
  <div class="min-h-screen">
    <!-- Hero -->
    <section class="relative pt-10 pb-6 lg:pt-12 lg:pb-8">
      <div class="max-w-4xl mx-auto px-6 text-center">
        <ClientOnly>
          <motion.h1
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4 }"
            class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.1] text-gray-900 dark:text-white mb-3"
          >
            Core Web Vitals
            <span class="text-emerald-600 dark:text-emerald-400">Test</span>
          </motion.h1>
          <motion.p
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4, delay: 0.1 }"
            class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto"
          >
            Check if your page passes Google's Core Web Vitals with lab and real user data.
          </motion.p>
          <template #fallback>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.1] text-gray-900 dark:text-white mb-3">
              Core Web Vitals
              <span class="text-emerald-600 dark:text-emerald-400">Test</span>
            </h1>
            <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Check if your page passes Google's Core Web Vitals with lab and real user data.
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
          <div class="absolute -inset-4 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent rounded-3xl blur-3xl pointer-events-none" />

          <div class="relative bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
            <!-- Header -->
            <div class="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800">
              <UIcon name="i-heroicons-check-badge" class="w-4 h-4 text-emerald-500" />
              <span class="text-sm font-semibold">Core Web Vitals Assessment</span>
            </div>

            <!-- Input -->
            <div class="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
              <form class="flex flex-col gap-3" @submit.prevent="analyze">
                <UInput
                  v-model="urlInput"
                  placeholder="Enter URL (e.g., example.com)"
                  size="lg"
                  class="flex-1"
                  icon="i-heroicons-globe-alt"
                  :disabled="loading"
                />
                <div class="flex gap-2 justify-between sm:justify-start">
                  <div class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-100 dark:bg-gray-800">
                    <button
                      type="button"
                      class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md text-sm font-medium transition-colors"
                      :class="[strategy === 'mobile' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']"
                      :disabled="loading"
                      @click="strategy = 'mobile'"
                    >
                      <UIcon name="i-heroicons-device-phone-mobile" class="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md text-sm font-medium transition-colors"
                      :class="[strategy === 'desktop' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']"
                      :disabled="loading"
                      @click="strategy = 'desktop'"
                    >
                      <UIcon name="i-heroicons-computer-desktop" class="w-5 h-5" />
                    </button>
                  </div>
                  <UButton
                    type="submit"
                    size="lg"
                    :disabled="!urlInput.trim() || loading"
                    class="bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex-1 sm:flex-none"
                  >
                    <span class="sm:hidden">Test</span>
                    <span class="hidden sm:inline">Run CWV Test</span>
                  </UButton>
                </div>
              </form>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="p-8 text-center">
              <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-emerald-500 animate-spin" />
                <span class="text-sm text-emerald-700 dark:text-emerald-300">{{ loadingMessages[loadingMessageIdx] }}</span>
              </div>
              <p class="mt-4 text-xs text-gray-500">
                This can take up to 2 minutes. The API runs a full Lighthouse audit.
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
            <div v-if="result" class="p-4 sm:p-6 space-y-8">
              <!-- Pass/Fail Banner -->
              <div
                class="p-4 sm:p-6 rounded-xl text-center"
                :class="result.passesCWV
                  ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800'"
              >
                <div class="flex items-center justify-center gap-3 mb-2">
                  <UIcon
                    :name="result.passesCWV ? 'i-heroicons-check-badge-solid' : 'i-heroicons-x-circle-solid'"
                    class="w-8 h-8"
                    :class="result.passesCWV ? 'text-emerald-500' : 'text-red-500'"
                  />
                  <span
                    class="text-xl sm:text-2xl font-bold"
                    :class="result.passesCWV ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'"
                  >
                    {{ result.passesCWV ? 'Passes Core Web Vitals' : 'Fails Core Web Vitals' }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  {{ result.passesCWV
                    ? 'This page meets Google\'s Core Web Vitals thresholds for a good user experience.'
                    : 'This page does not meet all Core Web Vitals thresholds. See recommendations below.' }}
                </p>
                <p class="text-xs text-gray-500 mt-2 truncate max-w-md mx-auto">
                  {{ result.fetchedUrl }}
                </p>
              </div>

              <!-- CWV Metric Cards -->
              <div>
                <div class="flex items-center gap-2 mb-4">
                  <UIcon name="i-heroicons-bolt" class="w-5 h-5 text-emerald-500" />
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Core Web Vitals
                  </h3>
                  <span
                    v-if="result.field"
                    class="px-2 py-0.5 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                  >
                    {{ result.field.originFallback ? 'Origin Data' : 'Real Users' }}
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <motion.div
                    v-for="(metric, idx) in cwvMetrics"
                    :key="metric.key"
                    :initial="{ opacity: 0, y: 20 }"
                    :animate="{ opacity: 1, y: 0 }"
                    :transition="{ duration: 0.3, delay: idx * 0.1 }"
                    class="relative p-5 rounded-xl border-2 text-center"
                    :class="[ratingColors[metric.rating]?.bg || ratingColors.poor.bg, ratingColors[metric.rating]?.border || ratingColors.poor.border]"
                  >
                    <!-- Source badge -->
                    <span
                      class="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-medium rounded"
                      :class="metric.source === 'field'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'"
                    >
                      {{ metric.source === 'field' ? 'Field' : 'Lab' }}
                    </span>

                    <div class="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                      {{ metric.label }}
                      <span v-if="metric.isProxy" class="text-[10px] normal-case">(proxy for INP)</span>
                    </div>
                    <div class="text-3xl font-bold mb-2" :class="ratingColors[metric.rating]?.text || ratingColors.poor.text">
                      {{ metric.value }}
                    </div>
                    <UIcon
                      :name="getRatingIcon(metric.rating)"
                      class="w-8 h-8 mx-auto mb-1"
                      :class="ratingColors[metric.rating]?.text || ratingColors.poor.text"
                    />
                    <div class="text-xs font-medium uppercase" :class="ratingColors[metric.rating]?.text || ratingColors.poor.text">
                      {{ metric.rating.replace('-', ' ') }}
                    </div>
                    <div class="text-[10px] text-gray-500 mt-2">
                      {{ metric.description }}
                    </div>

                    <!-- Percentile bar for field data -->
                    <div v-if="metric.percentiles" class="mt-3 h-2 rounded-full overflow-hidden flex">
                      <div
                        class="bg-green-400"
                        :style="{ width: `${metric.percentiles.good}%` }"
                      />
                      <div
                        class="bg-orange-400"
                        :style="{ width: `${metric.percentiles.needsImprovement}%` }"
                      />
                      <div
                        class="bg-red-400"
                        :style="{ width: `${metric.percentiles.poor}%` }"
                      />
                    </div>
                  </motion.div>
                </div>
              </div>

              <!-- Filmstrip Timeline -->
              <div v-if="result.filmstrip.length">
                <div class="flex items-center gap-2 mb-4">
                  <UIcon name="i-heroicons-film" class="w-5 h-5 text-blue-500" />
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Page Load Timeline
                  </h3>
                </div>
                <div class="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                  <div class="flex gap-1.5 sm:gap-2 min-w-max">
                    <div
                      v-for="(frame, idx) in result.filmstrip"
                      :key="idx"
                      class="flex flex-col items-center"
                    >
                      <div class="w-16 h-28 sm:w-20 sm:h-36 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                        <img
                          :src="frame.data"
                          :alt="`Frame at ${frame.timing >= 1000 ? `${(frame.timing / 1000).toFixed(1)}s` : `${frame.timing}ms`}`"
                          class="w-full h-full object-cover object-top"
                        >
                      </div>
                      <span class="text-[9px] sm:text-[10px] font-medium text-gray-500 mt-1 tabular-nums">
                        {{ frame.timing >= 1000 ? `${(frame.timing / 1000).toFixed(1)}s` : `${frame.timing}ms` }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Lab Data Details -->
              <div v-if="result.lab.fcp || result.lab.tbt || result.lab.si">
                <div class="flex items-center gap-2 mb-4">
                  <UIcon name="i-heroicons-beaker" class="w-5 h-5 text-violet-500" />
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Lab Metrics
                  </h3>
                  <span class="text-xs text-gray-500">(Lighthouse)</span>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div
                    v-for="(metric, key) in { fcp: result.lab.fcp, tbt: result.lab.tbt, si: result.lab.si, ttfb: result.lab.ttfb }"
                    :key="key"
                    class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30"
                  >
                    <div class="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                      {{ key.toUpperCase() }}
                    </div>
                    <div
                      v-if="metric"
                      class="text-lg font-bold"
                      :class="ratingColors[metric.rating]?.text || ratingColors.poor.text"
                    >
                      {{ metric.displayValue }}
                    </div>
                    <div v-else class="text-lg font-bold text-gray-400">
                      N/A
                    </div>
                    <div class="text-[10px] text-gray-500 mt-1 truncate">
                      {{ metricLabels[key as keyof typeof metricLabels] }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Screenshot -->
              <div v-if="result.screenshot">
                <div class="flex items-center gap-2 mb-4">
                  <UIcon name="i-heroicons-photo" class="w-5 h-5 text-indigo-500" />
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Page Screenshot
                  </h3>
                </div>
                <div class="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 max-h-[400px] overflow-y-auto">
                  <img
                    :src="result.screenshot.data"
                    alt="Page screenshot"
                    :width="result.screenshot.width"
                    :height="result.screenshot.height"
                    class="w-full h-auto"
                  >
                </div>
              </div>

              <!-- Recommendations -->
              <div v-if="result.recommendations.length">
                <div class="flex items-center gap-2 mb-4">
                  <UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-amber-500" />
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Recommendations
                  </h3>
                </div>

                <div class="space-y-3">
                  <div
                    v-for="rec in result.recommendations"
                    :key="rec.metric"
                    class="p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10"
                  >
                    <div class="flex items-start gap-3">
                      <span
                        class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                        :class="ratingColors[result.lab[rec.metric as keyof typeof result.lab]?.rating || 'poor'].badge"
                      >
                        {{ rec.metric.toUpperCase() }}
                      </span>
                      <div class="flex-1 min-w-0">
                        <h4 class="font-medium text-gray-900 dark:text-white">
                          {{ rec.title }}
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {{ rec.description }}
                        </p>
                        <div class="flex gap-2 mt-3">
                          <UButton
                            :to="rec.learnMoreUrl"
                            variant="outline"
                            size="xs"
                            trailing-icon="i-heroicons-arrow-right"
                          >
                            Learn more
                          </UButton>
                          <UButton
                            v-if="rec.toolUrl"
                            :to="rec.toolUrl"
                            variant="ghost"
                            size="xs"
                            trailing-icon="i-heroicons-wrench-screwdriver"
                          >
                            Use tool
                          </UButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- What are CWV -->
              <div class="p-4 sm:p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="font-semibold text-gray-900 dark:text-white mb-4">
                  What are Core Web Vitals?
                </h3>
                <div class="space-y-3 text-sm">
                  <div class="flex gap-3">
                    <span class="shrink-0 w-10 h-6 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center">LCP</span>
                    <div>
                      <NuxtLink to="/glossary/lcp" class="font-medium text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400">
                        Largest Contentful Paint
                      </NuxtLink>
                      <span class="text-gray-500"> - Loading performance. Good: ≤2.5s</span>
                    </div>
                  </div>
                  <div class="flex gap-3">
                    <span class="shrink-0 w-10 h-6 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center">CLS</span>
                    <div>
                      <NuxtLink to="/glossary/cls" class="font-medium text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400">
                        Cumulative Layout Shift
                      </NuxtLink>
                      <span class="text-gray-500"> - Visual stability. Good: ≤0.1</span>
                    </div>
                  </div>
                  <div class="flex gap-3">
                    <span class="shrink-0 w-10 h-6 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center">INP</span>
                    <div>
                      <NuxtLink to="/glossary/inp" class="font-medium text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400">
                        Interaction to Next Paint
                      </NuxtLink>
                      <span class="text-gray-500"> - Responsiveness. Good: ≤200ms</span>
                    </div>
                  </div>
                </div>
                <p class="text-xs text-gray-500 mt-4">
                  Core Web Vitals are a set of metrics that measure real-world user experience for loading, interactivity, and visual stability. They are a confirmed Google ranking factor.
                </p>
              </div>

              <!-- Upsell -->
              <div class="p-4 sm:p-6 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800">
                <div class="flex items-start gap-4">
                  <div class="shrink-0 w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                    <UIcon name="i-heroicons-magnifying-glass-circle" class="w-6 h-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div class="flex-1">
                    <h3 class="font-semibold text-gray-900 dark:text-white">
                      This tests ONE page
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Your site has hundreds of pages. Scan them all with Unlighthouse CLI:
                    </p>
                    <div class="mt-3 p-3 rounded-lg bg-gray-900 dark:bg-black font-mono text-sm text-emerald-400">
                      npx unlighthouse --site {{ result.fetchedUrl.replace(/^https?:\/\//, '').split('/')[0] }}
                    </div>
                    <div class="flex gap-2 mt-4">
                      <UButton
                        to="/guide/getting-started/unlighthouse-cli"
                        color="primary"
                        size="sm"
                      >
                        Scan Entire Site (Free)
                      </UButton>
                      <UButton
                        to="/cloud"
                        variant="outline"
                        size="sm"
                      >
                        Schedule Recurring Audits
                      </UButton>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Google PSI Link -->
              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      View on Google PageSpeed Insights
                    </p>
                    <p class="text-xs text-gray-500">
                      See the full Lighthouse report
                    </p>
                  </div>
                  <UButton
                    :to="`https://pagespeed.web.dev/report?url=${encodeURIComponent(result.url)}`"
                    target="_blank"
                    variant="outline"
                    size="sm"
                    trailing-icon="i-heroicons-arrow-top-right-on-square"
                  >
                    Open
                  </UButton>
                </div>
              </div>

              <!-- Feedback -->
              <ToolFeedback tool-id="cwv-checker" :context="{ url: urlInput, strategy }" />
            </div>

            <!-- Empty state -->
            <div v-if="!result && !loading && !error" class="p-8 text-center text-gray-500">
              <UIcon name="i-heroicons-check-badge" class="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Enter a URL to check Core Web Vitals</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="px-3 sm:px-6 lg:px-8 pb-16">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Frequently Asked Questions
        </h2>

        <div class="space-y-4">
          <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              What are Core Web Vitals?
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Core Web Vitals are three metrics Google uses to measure user experience: LCP (loading speed), CLS (visual stability), and INP (interactivity). They are a confirmed ranking factor in Google Search.
            </p>
          </div>

          <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              What is a good Core Web Vitals score?
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Good scores are: LCP under 2.5 seconds, CLS under 0.1, and INP under 200 milliseconds. To pass Core Web Vitals, at least 75% of page loads must meet the "good" threshold for all three metrics.
            </p>
          </div>

          <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              What's the difference between Lab and Field data?
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Lab data is collected in a controlled environment (Lighthouse). Field data is from real users via the Chrome User Experience Report (CrUX). Field data is what Google uses for ranking, but lab data helps diagnose issues.
            </p>
          </div>

          <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              Do Core Web Vitals affect SEO?
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Yes. Core Web Vitals are a confirmed Google ranking factor as part of page experience signals. Pages that pass CWV may have a ranking advantage over those that don't, especially for competitive queries.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
