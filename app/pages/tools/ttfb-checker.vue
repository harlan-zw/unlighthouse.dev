<script setup lang="ts">
import type { TTFBCheckResponse } from '~~/server/api/tools/ttfb-check.post'
import { watchDebounced } from '@vueuse/core'
import { motion } from 'motion-v'
import { formatCruxMetricValue, metricDefinitions } from '~/utils/crux'

definePageMeta({
  breadcrumb: {
    icon: 'i-heroicons-clock',
    ariaLabel: 'TTFB Checker',
  },
})

const faqs = [
  {
    question: 'What is Time to First Byte (TTFB)?',
    answer: 'Time to First Byte (TTFB) measures how long it takes for the browser to receive the first byte of response from the server after making a request. It includes DNS lookup, TCP connection, TLS handshake, and server processing time. A good TTFB is under 800ms.',
  },
  {
    question: 'Why is TTFB important for performance?',
    answer: 'TTFB directly impacts all subsequent metrics like LCP and FCP. A slow server response delays everything—the browser can\'t start parsing HTML, downloading resources, or rendering content until TTFB completes. Improving TTFB creates a faster foundation for your entire page load.',
  },
  {
    question: 'What causes slow TTFB?',
    answer: 'Slow TTFB is typically caused by: slow server-side processing, database query delays, no server-side caching, distance between user and server (no CDN), unoptimized backend code, shared hosting resource limits, and cold starts on serverless functions.',
  },
  {
    question: 'How do I improve my TTFB?',
    answer: 'To improve TTFB: use a CDN to serve content closer to users, implement server-side caching (Redis, Varnish), optimize database queries, use edge rendering or SSR at the edge, upgrade hosting infrastructure, enable HTTP/2 or HTTP/3, and reduce server-side processing complexity.',
  },
  {
    question: 'What is the difference between origin and URL TTFB in CrUX?',
    answer: 'Origin TTFB is the aggregate across all pages on your domain from real Chrome users. URL TTFB is specific to a single page. Origin data has more samples and is more stable, while URL data shows page-specific performance but may have insufficient data for low-traffic pages.',
  },
]

useToolSeo({
  title: 'TTFB Checker - Test Time to First Byte',
  description: 'Free TTFB test tool. Check your server response time with real Chrome user data (CrUX). Compare field vs lab TTFB and track trends over time.',
  faqs,
})

type FormFactor = 'PHONE' | 'DESKTOP'
type Mode = 'origin' | 'url'

const route = useRoute()
const router = useRouter()

const urlInput = ref('')
const mode = ref<Mode>('origin')
const formFactor = ref<FormFactor>('PHONE')
const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<TTFBCheckResponse | null>(null)

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

  $fetch<TTFBCheckResponse>('/api/tools/ttfb-check', {
    method: 'POST',
    body: {
      url: urlInput.value,
      mode: mode.value,
      formFactor: formFactor.value,
      includeHistory: true,
      includeLab: true,
    },
  })
    .then((data) => {
      result.value = data
    })
    .catch((err) => {
      error.value = err.data?.message || err.message || 'Failed to fetch TTFB data'
    })
    .finally(() => {
      loading.value = false
    })
}

// Chart data for TTFB history
const chartData = computed(() => {
  if (!result.value?.history?.length)
    return null

  const history = result.value.history
  const def = metricDefinitions.ttfb

  const values = history.map(h => h.ttfb75 || 0).filter(v => v > 0)
  if (!values.length)
    return null

  const maxValue = Math.max(...values, def.poor * 1.2)
  const minValue = 0

  const points = history.map((h, i) => {
    const val = h.ttfb75 || 0
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
  const lastX = validPoints[validPoints.length - 1]!.x
  const firstX = validPoints[0]!.x
  return `${linePath} L ${lastX} 100 L ${firstX} 100 Z`
})

const ratingColors = {
  'good': {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  'needs-improvement': {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-600 dark:text-amber-400',
  },
  'poor': {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-600 dark:text-red-400',
  },
}

function formatChartDate(date: string) {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const ttfbFactors = [
  { icon: 'i-heroicons-server', label: 'Server response time' },
  { icon: 'i-heroicons-globe-alt', label: 'DNS lookup' },
  { icon: 'i-heroicons-lock-closed', label: 'SSL/TLS negotiation' },
  { icon: 'i-heroicons-signal', label: 'Network latency' },
  { icon: 'i-heroicons-arrow-path', label: 'Redirects' },
]

const ttfbTips = [
  { icon: 'i-heroicons-cloud', label: 'Use a CDN', desc: 'Serve content closer to users' },
  { icon: 'i-heroicons-archive-box', label: 'Enable server caching', desc: 'Cache database queries and pages' },
  { icon: 'i-heroicons-circle-stack', label: 'Optimize database', desc: 'Index queries, use connection pooling' },
  { icon: 'i-heroicons-bolt', label: 'Use HTTP/2 or HTTP/3', desc: 'Modern protocols reduce latency' },
  { icon: 'i-heroicons-arrow-uturn-left', label: 'Reduce redirects', desc: 'Each redirect adds round-trip time' },
]
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
            TTFB
            <span class="text-sky-600 dark:text-sky-400">Checker</span>
          </motion.h1>
          <motion.p
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4, delay: 0.1 }"
            class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto"
          >
            Test Time to First Byte with real Chrome user data and lab measurements.
          </motion.p>
          <template #fallback>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.1] text-gray-900 dark:text-white mb-3">
              TTFB
              <span class="text-sky-600 dark:text-sky-400">Checker</span>
            </h1>
            <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Test Time to First Byte with real Chrome user data and lab measurements.
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
          <div class="absolute -inset-4 bg-gradient-to-b from-sky-500/10 via-cyan-500/5 to-transparent rounded-3xl blur-3xl pointer-events-none" />

          <div class="relative bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
            <!-- Header -->
            <div class="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800">
              <UIcon name="i-heroicons-clock" class="w-4 h-4 text-sky-500" />
              <span class="text-sm font-semibold">Time to First Byte</span>
              <span class="ml-auto text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Server response time</span>
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
                    class="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white font-medium"
                  >
                    Check TTFB
                  </UButton>
                </div>
              </form>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="p-8 text-center">
              <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
                <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-sky-500 animate-spin" />
                <span class="text-sm text-sky-700 dark:text-sky-300">Measuring TTFB...</span>
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
            <div v-if="result && !result.hasFieldData && !result.lab" class="p-6 sm:p-8">
              <div class="text-center max-w-md mx-auto">
                <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-amber-500" />
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No TTFB Data Available
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  This {{ mode === 'origin' ? 'site' : 'page' }} doesn't have enough Chrome traffic for field data, and lab data couldn't be fetched.
                </p>
                <div class="flex gap-2 justify-center">
                  <UButton
                    to="/tools/cwv-checker"
                    variant="outline"
                    size="sm"
                  >
                    Try CWV Checker
                  </UButton>
                </div>
              </div>
            </div>

            <!-- Results -->
            <div v-if="result && (result.hasFieldData || result.lab)" class="p-4 sm:p-6 space-y-8">
              <!-- Field vs Lab Comparison -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Field Data Card -->
                <motion.div
                  :initial="{ opacity: 0, y: 20 }"
                  :animate="{ opacity: 1, y: 0 }"
                  :transition="{ duration: 0.3 }"
                  class="p-5 rounded-xl border-2"
                  :class="result.field
                    ? [ratingColors[result.field.ttfb.rating].bg, ratingColors[result.field.ttfb.rating].border]
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'"
                >
                  <div class="flex items-center gap-2 mb-3">
                    <UIcon name="i-heroicons-users" class="w-4 h-4 text-blue-500" />
                    <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Field Data (Real Users)</span>
                  </div>

                  <div v-if="result.field">
                    <div class="text-4xl font-bold mb-2" :class="ratingColors[result.field.ttfb.rating].text">
                      {{ result.field.ttfb.displayValue }}
                    </div>
                    <div class="text-xs text-gray-500 mb-3">
                      P75 from Chrome UX Report
                    </div>

                    <!-- Histogram -->
                    <div class="h-3 rounded-full overflow-hidden flex mb-2">
                      <div class="bg-emerald-400" :style="{ width: `${result.field.ttfb.histogram.good}%` }" />
                      <div class="bg-amber-400" :style="{ width: `${result.field.ttfb.histogram.needsImprovement}%` }" />
                      <div class="bg-red-400" :style="{ width: `${result.field.ttfb.histogram.poor}%` }" />
                    </div>
                    <div class="flex justify-between text-[10px] text-gray-500">
                      <span>{{ result.field.ttfb.histogram.good }}% good</span>
                      <span>{{ result.field.ttfb.histogram.poor }}% poor</span>
                    </div>
                  </div>
                  <div v-else class="text-gray-500">
                    <p class="text-sm">
                      No field data available
                    </p>
                    <p class="text-xs mt-1">
                      Site may have insufficient Chrome traffic
                    </p>
                  </div>
                </motion.div>

                <!-- Lab Data Card -->
                <motion.div
                  :initial="{ opacity: 0, y: 20 }"
                  :animate="{ opacity: 1, y: 0 }"
                  :transition="{ duration: 0.3, delay: 0.1 }"
                  class="p-5 rounded-xl border-2 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800"
                >
                  <div class="flex items-center gap-2 mb-3">
                    <UIcon name="i-heroicons-beaker" class="w-4 h-4 text-violet-500" />
                    <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Lab Data (Lighthouse)</span>
                  </div>

                  <div v-if="result.lab">
                    <div class="text-4xl font-bold mb-2 text-violet-600 dark:text-violet-400">
                      {{ result.lab.ttfb.displayValue }}
                    </div>
                    <div class="text-xs text-gray-500 mb-3">
                      Server Response Time
                    </div>

                    <!-- Score bar -->
                    <div class="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-2">
                      <div
                        class="h-full rounded-full transition-all"
                        :class="result.lab.ttfb.score >= 90 ? 'bg-emerald-500' : result.lab.ttfb.score >= 50 ? 'bg-amber-500' : 'bg-red-500'"
                        :style="{ width: `${result.lab.ttfb.score}%` }"
                      />
                    </div>
                    <div class="text-xs text-gray-500">
                      Score: {{ result.lab.ttfb.score }}/100
                    </div>
                  </div>
                  <div v-else class="text-gray-500">
                    <p class="text-sm">
                      Lab test failed
                    </p>
                    <p class="text-xs mt-1">
                      Try testing the URL directly
                    </p>
                  </div>
                </motion.div>
              </div>

              <!-- Comparison Insight -->
              <div v-if="result.field && result.lab" class="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      Field vs Lab Comparison
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <template v-if="result.field.ttfb.p75 > result.lab.ttfb.value * 1.2">
                        Field TTFB is <strong class="text-amber-600 dark:text-amber-400">{{ Math.round((result.field.ttfb.p75 - result.lab.ttfb.value) / result.lab.ttfb.value * 100) }}% higher</strong> than lab.
                        Real users experience slower response times, likely due to geographic distance, network conditions, or server load.
                      </template>
                      <template v-else-if="result.lab.ttfb.value > result.field.ttfb.p75 * 1.2">
                        Lab TTFB is higher than field data. This is unusual — your lab test location may be further from your servers than most users.
                      </template>
                      <template v-else>
                        Field and lab TTFB are similar, indicating consistent server performance across different conditions.
                      </template>
                    </p>
                  </div>
                </div>
              </div>

              <!-- TTFB Trend Chart -->
              <div v-if="chartData">
                <div class="flex items-center gap-2 mb-4">
                  <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-sky-500" />
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ result.history!.length }}-Week TTFB Trend
                  </h3>
                </div>

                <div class="relative bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                  <!-- Y-axis labels -->
                  <div class="absolute left-1 sm:left-2 top-3 sm:top-4 bottom-10 sm:bottom-12 flex flex-col justify-between text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                    <span>{{ Math.round(chartData.maxValue) }}ms</span>
                    <span>{{ chartData.def.poor }}ms</span>
                    <span>{{ chartData.def.good }}ms</span>
                    <span>0</span>
                  </div>

                  <!-- Chart -->
                  <div class="ml-10 sm:ml-12 mr-1 sm:mr-2">
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
                        fill="url(#ttfbChartGradient)"
                        opacity="0.3"
                      />

                      <!-- Main line -->
                      <path
                        :d="chartPath"
                        fill="none"
                        stroke="rgb(14 165 233)"
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
                          fill="rgb(14 165 233)"
                        />
                      </g>

                      <!-- Gradient definition -->
                      <defs>
                        <linearGradient id="ttfbChartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stop-color="rgb(14 165 233)" stop-opacity="0.4" />
                          <stop offset="100%" stop-color="rgb(14 165 233)" stop-opacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <!-- X-axis labels -->
                    <div class="flex justify-between mt-2 text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                      <span v-if="result.history!.length">{{ formatChartDate(result.history![0]!.date) }}</span>
                      <span v-if="result.history!.length > 10">{{ formatChartDate(result.history![Math.floor(result.history!.length / 2)]!.date) }}</span>
                      <span v-if="result.history!.length">{{ formatChartDate(result.history![result.history!.length - 1]!.date) }}</span>
                    </div>
                  </div>

                  <!-- Legend -->
                  <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 text-xs">
                    <div class="flex items-center gap-1">
                      <div class="w-3 h-0.5 bg-emerald-500" />
                      <span class="text-gray-500 dark:text-gray-400">Good (≤800ms)</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="w-3 h-0.5 bg-red-500" />
                      <span class="text-gray-500 dark:text-gray-400">Poor (>1800ms)</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="w-3 h-0.5 bg-sky-500" />
                      <span class="text-gray-500 dark:text-gray-400">P75 TTFB</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- What Affects TTFB -->
              <div class="p-4 sm:p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-4">
                  <UIcon name="i-heroicons-question-mark-circle" class="w-5 h-5 text-gray-500" />
                  <h3 class="font-semibold text-gray-900 dark:text-white">
                    What Affects TTFB?
                  </h3>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  <div
                    v-for="factor in ttfbFactors"
                    :key="factor.label"
                    class="flex flex-col items-center gap-2 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  >
                    <UIcon :name="factor.icon" class="w-5 h-5 text-gray-500" />
                    <span class="text-xs text-center text-gray-600 dark:text-gray-400">{{ factor.label }}</span>
                  </div>
                </div>
              </div>

              <!-- How to Improve TTFB -->
              <div class="p-4 sm:p-6 rounded-xl bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 border border-sky-200 dark:border-sky-800">
                <div class="flex items-center gap-2 mb-4">
                  <UIcon name="i-heroicons-wrench-screwdriver" class="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  <h3 class="font-semibold text-gray-900 dark:text-white">
                    How to Improve TTFB
                  </h3>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    v-for="tip in ttfbTips"
                    :key="tip.label"
                    class="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-gray-800/60"
                  >
                    <UIcon :name="tip.icon" class="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ tip.label }}
                      </p>
                      <p class="text-xs text-gray-600 dark:text-gray-400">
                        {{ tip.desc }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Feedback -->
              <ToolFeedback tool-id="ttfb-checker" :context="{ url: urlInput, mode, formFactor }" />
            </div>

            <!-- Empty state -->
            <div v-if="!result && !loading && !error" class="p-8 text-center text-gray-500">
              <UIcon name="i-heroicons-clock" class="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Enter a domain to check TTFB</p>
              <p class="text-xs mt-2">
                Measures Time to First Byte (server response time)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="px-3 sm:px-6 lg:px-8 pb-16">
      <div class="max-w-4xl mx-auto">
        <ToolFaq :faqs="faqs" color="blue" />

        <!-- Related Resources -->
        <div class="mt-12 text-center">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Learn More About Web Performance
          </h3>
          <div class="flex flex-wrap justify-center gap-2">
            <UButton to="/learn-lighthouse/lcp" variant="ghost" size="sm">
              <UIcon name="i-heroicons-photo" class="w-4 h-4 mr-1" />
              LCP Guide
            </UButton>
            <UButton to="/learn-lighthouse/core-web-vitals" variant="ghost" size="sm">
              <UIcon name="i-heroicons-academic-cap" class="w-4 h-4 mr-1" />
              Core Web Vitals
            </UButton>
            <UButton to="/glossary/ttfb" variant="ghost" size="sm">
              <UIcon name="i-heroicons-book-open" class="w-4 h-4 mr-1" />
              TTFB Glossary
            </UButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
