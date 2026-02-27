<script setup lang="ts">
import { watchPausable } from '@vueuse/core'

// Loading messages composable
function useLoadingMessages(messages: string[], interval = 800) {
  const current = ref(messages[0])
  let timer: ReturnType<typeof setInterval> | null = null
  let idx = 0

  function start() {
    idx = 0
    current.value = messages[0]
    timer = setInterval(() => {
      idx = (idx + 1) % messages.length
      current.value = messages[idx]
    }, interval)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  onUnmounted(stop)

  return { current, start, stop }
}

definePageMeta({
  breadcrumb: {
    icon: 'i-heroicons-cursor-arrow-rays',
    ariaLabel: 'INP Analyzer',
  },
})

const faqs = [
  {
    question: 'What is Interaction to Next Paint (INP)?',
    answer: 'Interaction to Next Paint (INP) is a Core Web Vital that measures responsiveness. It tracks the delay between user interactions (clicks, taps, key presses) and the visual feedback. A good INP score is 200 milliseconds or less, indicating a responsive experience.',
  },
  {
    question: 'How is INP different from First Input Delay (FID)?',
    answer: 'INP replaced FID as a Core Web Vital in March 2024. While FID only measured the first interaction, INP measures ALL interactions throughout the page lifecycle and reports the worst one. This makes INP a more comprehensive measure of real-world interactivity.',
  },
  {
    question: 'What causes poor INP scores?',
    answer: 'Poor INP is typically caused by: long JavaScript tasks blocking the main thread, heavy third-party scripts (analytics, ads, widgets), unoptimized event handlers, layout thrashing from DOM manipulation, and large JavaScript bundles that take time to parse and execute.',
  },
  {
    question: 'How do I improve my INP score?',
    answer: 'To improve INP: break long tasks into smaller chunks using yield patterns, defer non-critical JavaScript, use code splitting to reduce bundle size, optimize event handlers to avoid forced layouts, move heavy computation to web workers, and audit third-party scripts for performance impact.',
  },
  {
    question: 'Why does lab data show TBT instead of INP?',
    answer: 'Total Blocking Time (TBT) is used as a lab proxy for INP because true INP requires real user interactions. TBT measures time spent on long tasks (>50ms) during page load, which correlates with interactivity. Field data from real users provides actual INP measurements.',
  },
]

useToolSeo({
  title: 'INP Analyzer - Test Interaction to Next Paint',
  description: 'Free INP testing tool. Analyze your Interaction to Next Paint score, find long tasks blocking the main thread, and improve responsiveness.',
  faqs,
})

// Loading messages with tips - shown during PageSpeed API analysis
const { current: loadingMessage, start: startMessages, stop: stopMessages } = useLoadingMessages([
  'Connecting to PageSpeed Insights API...',
  'Tip: Break long tasks into smaller chunks',
  'Running Lighthouse audit on your page...',
  'Tip: Defer non-critical JavaScript',
  'Profiling main thread activity...',
  'Tip: Use code splitting to reduce bundle size',
  'Measuring Total Blocking Time (TBT)...',
  'Tip: Load third-party scripts with async/defer',
  'Analyzing script evaluation time...',
  'Tip: Use web workers for heavy computation',
  'Detecting long tasks (>50ms)...',
  'Tip: Consider progressive hydration strategies',
  'Generating INP analysis report...',
], 3000)

// State
const route = useRoute()
const router = useRouter()
const urlInput = ref('')
const strategy = ref<'mobile' | 'desktop'>('mobile')
const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<InpResult | null>(null)
const loadingContainerRef = ref<HTMLElement | null>(null)
const showFloatingLoader = ref(false)

// URL syncing
onMounted(() => {
  const urlParam = route.query.url as string
  const strategyParam = route.query.strategy as string
  if (strategyParam === 'desktop')
    strategy.value = 'desktop'
  if (urlParam) {
    urlInput.value = decodeURIComponent(urlParam)
    loading.value = true
    analyze()
  }

  const handleScroll = () => {
    if (!loading.value || !loadingContainerRef.value) {
      showFloatingLoader.value = false
      return
    }
    const rect = loadingContainerRef.value.getBoundingClientRect()
    showFloatingLoader.value = rect.bottom < 0
  }

  window.addEventListener('scroll', handleScroll, { passive: true })
  onUnmounted(() => window.removeEventListener('scroll', handleScroll))
})

watchPausable(
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

interface MainThreadItem {
  group: string
  label: string
  duration: number
}

interface LongTask {
  url: string
  startTime: number
  duration: number
}

interface ThirdParty {
  entity: string
  blockingTime: number
  mainThreadTime: number
  transferSize: number
}

interface ScriptItem {
  url: string
  total: number
  scripting: number
  scriptParseCompile: number
}

interface InpResult {
  url: string
  fetchedUrl: string
  timestamp: number
  framework: 'nuxt' | 'next' | 'vite' | null
  performanceScore: number
  tbt: {
    value: number
    displayValue: string
    score: number
    thresholds: { good: number, poor: number }
  }
  mainThread: {
    total: number
    items: MainThreadItem[]
  }
  longTasks: LongTask[]
  thirdParties: ThirdParty[]
  scripts: ScriptItem[]
  taskMetrics: {
    numTasksOver50ms: number
    numTasksOver100ms: number
    numTasksOver500ms: number
    maxServerLatency: number
  } | null
  opportunities: Array<{
    id: string
    title: string
    description: string
    displayValue: string
    score: number
    savings: { ms: number } | null
  }>
  screenshot: {
    data: string
    width: number
    height: number
  } | null
  strategy: 'mobile' | 'desktop'
}

function analyze() {
  if (!urlInput.value.trim())
    return

  loading.value = true
  error.value = null
  result.value = null
  startMessages()

  $fetch<InpResult>('/api/tools/inp', {
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
      stopMessages()
    })
}

function formatMs(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024)
    return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

function shortenUrl(url: string) {
  try {
    const u = new URL(url)
    const path = u.pathname.split('/').pop() || u.pathname
    return path.length > 40 ? `${path.slice(0, 37)}...` : path
  }
  catch {
    return url.length > 40 ? `${url.slice(0, 37)}...` : url
  }
}

// Calculate position on threshold bar (0-100%)
const thresholdPosition = computed(() => {
  if (!result.value)
    return 0
  const tbtMs = result.value.tbt.value
  if (tbtMs <= 200)
    return (tbtMs / 200) * 40
  if (tbtMs <= 600)
    return 40 + ((tbtMs - 200) / 400) * 25
  const cappedMs = Math.min(tbtMs, 1500)
  return 65 + ((cappedMs - 600) / 900) * 35
})

// Main thread category colors
const categoryColors: Record<string, string> = {
  scriptEvaluation: 'bg-cyan-500',
  other: 'bg-slate-400',
  styleLayout: 'bg-purple-500',
  paintCompositeRender: 'bg-green-500',
  scriptParseCompile: 'bg-orange-500',
  parseHTML: 'bg-blue-500',
  garbageCollection: 'bg-red-400',
}

function getCategoryColor(group: string) {
  return categoryColors[group] || 'bg-gray-400'
}

// Insights
interface InpInsight {
  type: 'positive' | 'info' | 'warning'
  icon: string
  title: string
  description: string
}

const insights = computed<InpInsight[]>(() => {
  if (!result.value)
    return []

  const items: InpInsight[] = []
  const tbtScore = result.value.tbt.score
  const taskMetrics = result.value.taskMetrics
  const thirdParties = result.value.thirdParties
  const framework = result.value.framework

  // TBT score insights
  if (tbtScore >= 90) {
    items.push({
      type: 'positive',
      icon: 'i-heroicons-check-circle',
      title: 'Excellent responsiveness',
      description: 'Your page has minimal main thread blocking. Users will experience smooth interactions.',
    })
  }
  else if (tbtScore >= 50) {
    items.push({
      type: 'info',
      icon: 'i-heroicons-information-circle',
      title: 'Moderate blocking time',
      description: 'Some interactions may feel slightly delayed. Consider optimizing JavaScript execution.',
    })
  }
  else {
    items.push({
      type: 'warning',
      icon: 'i-heroicons-exclamation-triangle',
      title: 'High blocking time detected',
      description: 'Users may experience noticeable delays when interacting with your page. Focus on reducing long tasks.',
    })
  }

  // Long tasks insights
  if (taskMetrics) {
    if (taskMetrics.numTasksOver500ms > 0) {
      items.push({
        type: 'warning',
        icon: 'i-heroicons-clock',
        title: `${taskMetrics.numTasksOver500ms} extremely long task${taskMetrics.numTasksOver500ms > 1 ? 's' : ''} (>500ms)`,
        description: 'Tasks over 500ms cause significant input delay. Break these into smaller chunks using requestIdleCallback or setTimeout.',
      })
    }
    else if (taskMetrics.numTasksOver100ms > 3) {
      items.push({
        type: 'warning',
        icon: 'i-heroicons-queue-list',
        title: `${taskMetrics.numTasksOver100ms} long tasks (>100ms)`,
        description: 'Multiple long tasks are blocking the main thread. Consider code splitting and lazy loading.',
      })
    }
  }

  // Third-party blocking
  const totalThirdPartyBlocking = thirdParties.reduce((sum, tp) => sum + tp.blockingTime, 0)
  if (totalThirdPartyBlocking > 200) {
    items.push({
      type: 'warning',
      icon: 'i-heroicons-cube-transparent',
      title: `Third-party scripts blocking for ${formatMs(totalThirdPartyBlocking)}`,
      description: 'Consider loading non-critical scripts with async/defer, using Partytown, or replacing heavy widgets.',
    })
  }

  // Framework-specific tips
  if (framework === 'nuxt' && tbtScore < 90) {
    items.push({
      type: 'info',
      icon: 'i-logos-nuxt-icon',
      title: 'Nuxt optimization tips',
      description: 'Use <LazyComponent> for below-fold content, enable experimental.payloadExtraction, and consider using nuxt-delay-hydration for non-critical interactivity.',
    })
  }
  else if (framework === 'next' && tbtScore < 90) {
    items.push({
      type: 'info',
      icon: 'i-logos-nextjs-icon',
      title: 'Next.js optimization tips',
      description: 'Use next/dynamic for code splitting, enable React Server Components, and consider the App Router for streaming SSR.',
    })
  }

  return items
})
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
            INP
            <span class="text-cyan-600 dark:text-cyan-400">Analyzer</span>
          </h1>
          <p
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4, delay: 0.1 }"
            class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto"
          >
            Find what's blocking your main thread and slowing down interactions.
          </p>
          <template #fallback>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.1] text-gray-900 dark:text-white mb-3">
              INP
              <span class="text-cyan-600 dark:text-cyan-400">Analyzer</span>
            </h1>
            <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Find what's blocking your main thread and slowing down interactions.
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
          <div class="absolute -inset-4 bg-gradient-to-b from-cyan-500/10 via-cyan-500/5 to-transparent rounded-3xl blur-3xl pointer-events-none" />

          <div class="relative bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
            <!-- Header -->
            <div class="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800">
              <UIcon name="i-heroicons-cursor-arrow-rays" class="w-4 h-4 text-cyan-500" />
              <span class="text-sm font-semibold">INP Analysis</span>
              <span class="px-1.5 py-0.5 text-[10px] font-medium bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded">Core Web Vital</span>
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
                  <!-- Mobile/Desktop Toggle -->
                  <div class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-100 dark:bg-gray-800">
                    <button
                      type="button"
                      class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md text-sm font-medium transition-colors" :class="[
                        strategy === 'mobile'
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
                      ]"
                      :disabled="loading"
                      @click="strategy = 'mobile'"
                    >
                      <UIcon name="i-heroicons-device-phone-mobile" class="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md text-sm font-medium transition-colors" :class="[
                        strategy === 'desktop'
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
                      ]"
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
                    class="bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex-1 sm:flex-none"
                  >
                    <span class="sm:hidden">Analyze</span>
                    <span class="hidden sm:inline">Analyze Interactivity</span>
                  </UButton>
                </div>
              </form>
            </div>

            <!-- Loading State -->
            <div v-if="loading" ref="loadingContainerRef" class="p-4 sm:p-6 text-center">
              <div class="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 max-w-full">
                <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-cyan-500 animate-spin shrink-0" />
                <span class="text-xs sm:text-sm text-cyan-700 dark:text-cyan-300 truncate">{{ loadingMessage }}</span>
              </div>
              <p class="mt-4 text-xs text-gray-500">
                This can take up to 2 minutes. Learn more about INP below while we analyze your page.
              </p>
              <UIcon name="i-heroicons-chevron-down" class="w-5 h-5 text-gray-400 mx-auto mt-2 animate-bounce" />
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
            <div v-if="result" class="p-4 sm:p-6">
              <!-- Hero: Score + TBT Info -->
              <div class="flex flex-col sm:flex-row gap-4 mb-6">
                <!-- TBT Score Card -->
                <div class="sm:w-1/2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4">
                  <div class="flex items-center gap-3 sm:gap-4">
                    <div
                      class="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg shrink-0 relative"
                      :class="{
                        'bg-green-500': result.tbt.score >= 90,
                        'bg-orange-500': result.tbt.score >= 50 && result.tbt.score < 90,
                        'bg-red-500': result.tbt.score < 50,
                      }"
                    >
                      <!-- Pulse ring for emphasis -->
                      <div
                        class="absolute inset-0 rounded-full animate-ping opacity-20"
                        :class="{
                          'bg-green-500': result.tbt.score >= 90,
                          'bg-orange-500': result.tbt.score >= 50 && result.tbt.score < 90,
                          'bg-red-500': result.tbt.score < 50,
                        }"
                        style="animation-duration: 2s;"
                      />
                      {{ Math.round(result.tbt.score) }}
                    </div>
                    <div class="min-w-0">
                      <div
                        class="text-xl sm:text-2xl font-bold tabular-nums"
                        :class="{
                          'text-green-600 dark:text-green-400': result.tbt.score >= 90,
                          'text-orange-600 dark:text-orange-400': result.tbt.score >= 50 && result.tbt.score < 90,
                          'text-red-600 dark:text-red-400': result.tbt.score < 50,
                        }"
                      >
                        {{ result.tbt.displayValue }}
                      </div>
                      <div class="text-xs text-gray-500">
                        Total Blocking Time
                      </div>
                      <div class="text-[10px] text-gray-400 mt-0.5">
                        Lab proxy for INP
                      </div>
                    </div>
                  </div>

                  <!-- Task metrics badges -->
                  <div v-if="result.taskMetrics" class="flex flex-wrap gap-2">
                    <span
                      class="px-2 py-1 rounded-md text-xs font-medium"
                      :class="result.taskMetrics.numTasksOver50ms > 5
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'"
                    >
                      {{ result.taskMetrics.numTasksOver50ms }} tasks &gt;50ms
                    </span>
                    <span
                      v-if="result.taskMetrics.numTasksOver100ms > 0"
                      class="px-2 py-1 rounded-md text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                    >
                      {{ result.taskMetrics.numTasksOver100ms }} tasks &gt;100ms
                    </span>
                    <span
                      v-if="result.taskMetrics.numTasksOver500ms > 0"
                      class="px-2 py-1 rounded-md text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    >
                      {{ result.taskMetrics.numTasksOver500ms }} tasks &gt;500ms
                    </span>
                  </div>

                  <!-- Framework badge -->
                  <div v-if="result.framework" class="flex items-center gap-2">
                    <span
                      class="px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5"
                      :class="{
                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300': result.framework === 'nuxt',
                        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300': result.framework === 'next',
                        'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300': result.framework === 'vite',
                      }"
                    >
                      <UIcon v-if="result.framework === 'nuxt'" name="i-logos-nuxt-icon" class="w-3.5 h-3.5" />
                      <UIcon v-else-if="result.framework === 'next'" name="i-logos-nextjs-icon" class="w-3.5 h-3.5" />
                      <UIcon v-else-if="result.framework === 'vite'" name="i-logos-vitejs" class="w-3.5 h-3.5" />
                      {{ result.framework === 'nuxt' ? 'Nuxt' : result.framework === 'next' ? 'Next.js' : 'Vite' }} detected
                    </span>
                  </div>
                </div>

                <!-- Threshold Bar -->
                <div class="sm:w-1/2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div class="flex items-center gap-2 mb-3">
                    <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-cyan-500" />
                    <span class="text-sm font-semibold">TBT Threshold</span>
                  </div>
                  <div class="relative">
                    <div class="flex h-3 rounded-full overflow-hidden shadow-inner">
                      <div class="flex-[2] bg-gradient-to-r from-green-400 to-green-500" />
                      <div class="flex-[4] bg-gradient-to-r from-orange-400 to-orange-500" />
                      <div class="flex-[3] bg-gradient-to-r from-red-400 to-red-500" />
                    </div>
                    <!-- Position indicator -->
                    <div
                      class="absolute top-0 -translate-x-1/2 transition-all duration-500"
                      :style="{ left: `${thresholdPosition}%` }"
                    >
                      <div class="flex flex-col items-center">
                        <div
                          class="w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 shadow-md"
                          :class="{
                            'bg-green-500': result.tbt.score >= 90,
                            'bg-orange-500': result.tbt.score >= 50 && result.tbt.score < 90,
                            'bg-red-500': result.tbt.score < 50,
                          }"
                        />
                        <div class="w-0.5 h-2 bg-gray-400 dark:bg-gray-600" />
                        <span class="text-[10px] font-bold tabular-nums mt-0.5">{{ result.tbt.displayValue }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex justify-between mt-6 text-[10px] text-gray-500">
                    <span>0ms</span>
                    <span class="text-green-600 font-medium hidden sm:inline">≤200ms Good</span>
                    <span class="text-green-600 font-medium sm:hidden">Good</span>
                    <span class="text-orange-500">600ms</span>
                    <span class="text-red-500">Poor</span>
                  </div>
                </div>
              </div>

              <!-- Insights Section -->
              <div v-if="insights.length" class="mb-6">
                <div class="flex items-center gap-2 mb-3">
                  <UIcon name="i-heroicons-light-bulb" class="w-4 h-4 text-cyan-500" />
                  <span class="text-sm font-semibold">Insights</span>
                </div>
                <div class="space-y-2">
                  <div
                    v-for="(insight, idx) in insights"
                    :key="idx"
                    class="p-3 rounded-lg border"
                    :class="{
                      'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800': insight.type === 'positive',
                      'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800': insight.type === 'info',
                      'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800': insight.type === 'warning',
                    }"
                  >
                    <div class="flex items-start gap-3">
                      <UIcon
                        :name="insight.icon"
                        class="w-5 h-5 shrink-0 mt-0.5"
                        :class="{
                          'text-green-500': insight.type === 'positive',
                          'text-blue-500': insight.type === 'info',
                          'text-orange-500': insight.type === 'warning',
                        }"
                      />
                      <div>
                        <p
                          class="text-sm font-medium"
                          :class="{
                            'text-green-800 dark:text-green-200': insight.type === 'positive',
                            'text-blue-800 dark:text-blue-200': insight.type === 'info',
                            'text-orange-800 dark:text-orange-200': insight.type === 'warning',
                          }"
                        >
                          {{ insight.title }}
                        </p>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {{ insight.description }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Main Thread Breakdown - Oscilloscope Style -->
              <div class="mb-6 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div class="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <UIcon name="i-heroicons-cpu-chip" class="w-4 h-4 text-cyan-500" />
                      <span class="text-sm font-semibold">Main Thread Breakdown</span>
                    </div>
                    <span class="text-xs text-gray-500 tabular-nums">{{ formatMs(result.mainThread.total) }} total</span>
                  </div>
                </div>
                <div class="p-4 bg-gray-900">
                  <!-- Oscilloscope-style stacked bar -->
                  <div class="relative">
                    <!-- Grid lines -->
                    <div class="absolute inset-0 flex">
                      <div v-for="i in 10" :key="i" class="flex-1 border-r border-gray-800/50" />
                    </div>
                    <!-- Stacked bar -->
                    <div class="relative flex h-8 rounded overflow-hidden">
                      <div
                        v-for="(item, idx) in result.mainThread.items"
                        :key="item.group"
                        v-motion
                        :initial="{ width: 0 }"
                        :animate="{ width: `${(item.duration / result.mainThread.total) * 100}%` }"
                        :transition="{ duration: 0.5, delay: idx * 0.05 }"
                        :class="getCategoryColor(item.group)"
                        class="min-w-[2px] relative group cursor-pointer"
                      >
                        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {{ item.label }}: {{ formatMs(item.duration) }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- Legend -->
                  <div class="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2">
                    <div
                      v-for="item in result.mainThread.items.slice(0, 6)"
                      :key="item.group"
                      class="flex items-center gap-1.5 text-xs min-w-0"
                    >
                      <span :class="getCategoryColor(item.group)" class="w-2 h-2 rounded-sm shrink-0" />
                      <span class="text-gray-400 truncate flex-1 text-[10px] sm:text-xs">{{ item.label }}</span>
                      <span class="text-gray-300 font-medium tabular-nums shrink-0 text-[10px] sm:text-xs">{{ formatMs(item.duration) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CrUX Field Data (INP from real users) -->
              <div class="mb-6">
                <ToolsCruxFieldDataCard
                  metric="inp"
                  :url="urlInput"
                  :form-factor="strategy === 'mobile' ? 'PHONE' : 'DESKTOP'"
                />
              </div>

              <div class="grid lg:grid-cols-2 gap-6">
                <!-- Left: Third-Party Impact -->
                <div>
                  <div class="flex items-center gap-2 mb-3">
                    <UIcon name="i-heroicons-cube-transparent" class="w-4 h-4 text-orange-500" />
                    <span class="text-sm font-semibold">Third-Party Blocking</span>
                  </div>

                  <div v-if="result.thirdParties.length === 0" class="text-center py-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                    <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      No significant third-party blocking
                    </p>
                  </div>

                  <div v-else class="space-y-2">
                    <div
                      v-for="(tp, idx) in result.thirdParties.slice(0, 5)"
                      :key="tp.entity"
                      v-motion
                      :initial="{ opacity: 0, x: -10 }"
                      :animate="{ opacity: 1, x: 0 }"
                      :transition="{ duration: 0.2, delay: idx * 0.05 }"
                      class="p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-800 transition-colors"
                    >
                      <div class="flex items-center justify-between gap-3">
                        <div class="min-w-0">
                          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {{ tp.entity }}
                          </p>
                          <div class="flex items-center gap-2 mt-1">
                            <span class="text-[10px] text-gray-500">
                              {{ formatBytes(tp.transferSize) }}
                            </span>
                            <span class="text-[10px] text-gray-400">•</span>
                            <span class="text-[10px] text-gray-500">
                              {{ formatMs(tp.mainThreadTime) }} main thread
                            </span>
                          </div>
                        </div>
                        <div class="shrink-0 px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50">
                          <span class="text-sm font-bold text-orange-700 dark:text-orange-300 tabular-nums">
                            {{ formatMs(tp.blockingTime) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Right: Heavy Scripts -->
                <div>
                  <div class="flex items-center gap-2 mb-3">
                    <UIcon name="i-heroicons-code-bracket" class="w-4 h-4 text-cyan-500" />
                    <span class="text-sm font-semibold">Script Evaluation</span>
                  </div>

                  <div v-if="result.scripts.length === 0" class="text-center py-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                    <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      No heavy scripts detected
                    </p>
                  </div>

                  <div v-else class="space-y-2">
                    <div
                      v-for="(script, idx) in result.scripts.slice(0, 5)"
                      :key="script.url"
                      v-motion
                      :initial="{ opacity: 0, x: -10 }"
                      :animate="{ opacity: 1, x: 0 }"
                      :transition="{ duration: 0.2, delay: idx * 0.05 }"
                      class="p-3 rounded-lg border border-gray-200 dark:border-gray-800"
                    >
                      <div class="flex items-center justify-between gap-3">
                        <div class="min-w-0">
                          <p class="text-xs font-mono text-gray-700 dark:text-gray-300 truncate" :title="script.url">
                            {{ shortenUrl(script.url) }}
                          </p>
                          <div class="flex items-center gap-2 mt-1">
                            <span class="text-[10px] text-cyan-600 dark:text-cyan-400">
                              {{ formatMs(script.scripting) }} eval
                            </span>
                            <span class="text-[10px] text-gray-400">•</span>
                            <span class="text-[10px] text-gray-500">
                              {{ formatMs(script.scriptParseCompile) }} parse
                            </span>
                          </div>
                        </div>
                        <span class="text-sm font-bold text-gray-900 dark:text-white tabular-nums shrink-0">
                          {{ formatMs(script.total) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Opportunities -->
              <div v-if="result.opportunities.length > 0" class="mt-6">
                <div class="flex items-center gap-2 mb-3">
                  <UIcon name="i-heroicons-rocket-launch" class="w-4 h-4 text-cyan-500" />
                  <span class="text-sm font-semibold">Optimization Opportunities</span>
                </div>
                <div class="grid sm:grid-cols-2 gap-2">
                  <div
                    v-for="(opp, idx) in result.opportunities"
                    :key="opp.id"
                    v-motion
                    :initial="{ opacity: 0, y: 10 }"
                    :animate="{ opacity: 1, y: 0 }"
                    :transition="{ duration: 0.2, delay: idx * 0.03 }"
                    class="p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-cyan-300 dark:hover:border-cyan-800 transition-colors"
                  >
                    <div class="flex items-start gap-3">
                      <div
                        v-if="opp.savings?.ms"
                        class="shrink-0 px-2 py-1 rounded-md bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800/50"
                      >
                        <span class="text-sm font-bold text-cyan-700 dark:text-cyan-300 tabular-nums">
                          -{{ formatMs(opp.savings.ms) }}
                        </span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                          {{ opp.title }}
                        </p>
                        <p v-if="opp.displayValue" class="text-xs text-gray-500 mt-1">
                          {{ opp.displayValue }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CTA Banner -->
              <div class="mt-6 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30 border border-cyan-200 dark:border-cyan-800">
                <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div class="text-center sm:text-left">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      Want the full performance report?
                    </p>
                    <p class="text-xs text-gray-500">
                      See all Core Web Vitals and optimization opportunities
                    </p>
                  </div>
                  <UButton :to="`/tools/pagespeed-insights-performance?url=${encodeURIComponent(urlInput)}`" size="sm" class="w-full sm:w-auto">
                    View Full Report
                  </UButton>
                </div>
              </div>

              <!-- Feedback -->
              <ToolsToolFeedback tool-id="inp-analyzer" :context="{ url: urlInput, strategy }" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Educational Content -->
    <section class="px-3 sm:px-6 lg:px-8 pb-12">
      <div class="max-w-6xl mx-auto">
        <!-- What is INP -->
        <div class="mb-10 grid md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-4 sm:gap-6 lg:gap-8 items-start">
          <!-- Left: Text Content -->
          <div>
            <h2 class="text-lg sm:text-xl lg:text-2xl font-bold mb-3 text-gray-900 dark:text-white">
              What is Interaction to Next Paint?
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              INP measures how quickly your page responds to user interactions like clicks, taps, and keyboard input.
              It captures the <strong class="text-gray-900 dark:text-white">worst interaction latency</strong> during a page visit,
              reporting when the browser finally paints a response. Google replaced FID with INP as a
              <a href="https://web.dev/vitals/" target="_blank" class="text-cyan-600 dark:text-cyan-400 hover:underline">Core Web Vital</a>
              in March 2024.
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Since INP requires real user interactions, lab tools like Lighthouse use <strong class="text-gray-900 dark:text-white">Total Blocking Time (TBT)</strong>
              as a proxy. TBT measures how long the main thread was blocked by long tasks during page load—a strong predictor of poor INP.
            </p>
          </div>

          <!-- Right: INP Timeline Visualization -->
          <div class="relative bg-gray-900 rounded-xl p-4 overflow-hidden">
            <div class="absolute top-0 left-1/4 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl" />
            <div class="absolute bottom-0 right-1/4 w-24 h-24 bg-cyan-600/15 rounded-full blur-2xl" />

            <div class="relative">
              <h3 class="text-xs font-semibold text-white mb-3 flex items-center gap-1.5">
                <UIcon name="i-heroicons-cursor-arrow-rays" class="w-3.5 h-3.5 text-cyan-400" />
                INP Timeline
              </h3>

              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <div class="w-14 text-[10px] text-gray-400 text-right shrink-0">
                    Click
                  </div>
                  <div class="flex-1 flex items-center gap-1">
                    <div class="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                    <div class="h-0.5 bg-gray-700 flex-1" />
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-14 text-[10px] text-orange-400 text-right shrink-0">
                    Processing
                  </div>
                  <div class="flex-1">
                    <div class="h-2 bg-gradient-to-r from-orange-600 to-orange-400 rounded-full w-3/5" />
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-14 text-[10px] text-green-400 text-right font-bold shrink-0">
                    Paint
                  </div>
                  <div class="flex-1">
                    <div class="h-2 bg-gradient-to-r from-green-500 to-green-400 rounded-full w-4/5" />
                  </div>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-gray-800">
                <div class="flex items-center justify-between text-[10px]">
                  <span class="text-gray-400">Good INP</span>
                  <span class="text-green-400 font-bold">≤200ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Common Causes -->
        <div class="mb-12 relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div class="p-5 sm:p-6">
            <div class="flex items-center gap-2 mb-6">
              <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-600">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-white" />
              </span>
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Common Causes of Poor INP
              </h2>
            </div>

            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-2">
                  <UIcon name="i-heroicons-code-bracket" class="w-5 h-5 text-cyan-500" />
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                    Long Tasks
                  </h3>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  JavaScript executing for &gt;50ms blocks the main thread. Break up work with <code class="text-cyan-600 dark:text-cyan-400">requestIdleCallback</code> or <code class="text-cyan-600 dark:text-cyan-400">scheduler.yield()</code>.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-2">
                  <UIcon name="i-heroicons-cube-transparent" class="w-5 h-5 text-cyan-500" />
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                    Third-Party Scripts
                  </h3>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Analytics, chat widgets, and ads often block the main thread. Load them async or use Partytown to run in a web worker.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-2">
                  <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-cyan-500" />
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                    Hydration
                  </h3>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Framework hydration can block interactions. Use progressive hydration, islands architecture, or server components.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-2">
                  <UIcon name="i-heroicons-squares-2x2" class="w-5 h-5 text-cyan-500" />
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                    Large DOM
                  </h3>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Too many DOM nodes slow down style calculations and layout. Keep nodes under 1,500 and virtualize long lists.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-2">
                  <UIcon name="i-heroicons-paint-brush" class="w-5 h-5 text-cyan-500" />
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                    Layout Thrashing
                  </h3>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Reading and writing layout properties in a loop forces synchronous reflows. Batch DOM reads and writes.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-2">
                  <UIcon name="i-heroicons-archive-box" class="w-5 h-5 text-cyan-500" />
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                    Bundle Size
                  </h3>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Large JavaScript bundles take longer to parse and execute. Use code splitting, tree shaking, and lazy loading.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- FAQ Section -->
        <ToolFaq :faqs="faqs" color="cyan" />

        <!-- Related Tools -->
        <div class="text-center mt-12">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Related Tools
          </h3>
          <div class="flex flex-wrap justify-center gap-2">
            <UButton to="/tools/lcp-finder" variant="ghost" size="sm">
              <UIcon name="i-heroicons-photo" class="w-4 h-4 mr-1" />
              LCP Finder
            </UButton>
            <UButton to="/tools/lighthouse-score-calculator" variant="ghost" size="sm">
              <UIcon name="i-heroicons-calculator" class="w-4 h-4 mr-1" />
              Score Calculator
            </UButton>
            <UButton to="/learn-lighthouse/inp" variant="ghost" size="sm">
              <UIcon name="i-heroicons-academic-cap" class="w-4 h-4 mr-1" />
              INP Optimization Guide
            </UButton>
            <UButton to="/glossary/inp" variant="ghost" size="sm">
              <UIcon name="i-heroicons-book-open" class="w-4 h-4 mr-1" />
              INP Glossary
            </UButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
