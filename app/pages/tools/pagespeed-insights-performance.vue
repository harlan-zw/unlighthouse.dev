<script setup lang="ts">
import { watchPausable } from '@vueuse/core'
import { motion } from 'motion-v'

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
    icon: 'i-heroicons-chart-bar',
    ariaLabel: 'PageSpeed Insights Performance',
  },
})

useSeoMeta({
  title: 'PageSpeed Insights - Full Performance Report',
  description: 'Comprehensive PageSpeed Insights performance report with Core Web Vitals, resource analysis, third-party breakdown, and actionable recommendations.',
})

defineOgImageComponent('NuxtSeo', {
  title: 'PageSpeed Insights',
  description: 'Full performance report',
  theme: '#4285f4',
})

// Loading messages
const { current: loadingMessage, start: startMessages, stop: stopMessages } = useLoadingMessages([
  'Waking up Google\'s servers...',
  'Sending carrier pigeons to PageSpeed...',
  'Lighthouse is warming up...',
  'Measuring pixels with a tiny ruler...',
  'Counting every byte...',
  'Asking Chrome nicely to render your page...',
  'Timing the paint, literally...',
  'Still faster than your CI pipeline...',
  'Google is thinking really hard...',
  'Almost there, probably...',
  'Calculating Core Web Vitals...',
  'Analyzing third-party scripts...',
  'Measuring main thread work...',
], 3000)

// State
const route = useRoute()
const router = useRouter()
const urlInput = ref('')
const strategy = ref<'mobile' | 'desktop'>('mobile')
const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<PsiResult | null>(null)
const loadingContainerRef = ref<HTMLElement | null>(null)
const showFloatingLoader = ref(false)
const screenshotRef = ref<HTMLElement | null>(null)
const expandedThirdParties = ref<Set<string>>(new Set())

interface PsiMetric {
  id: string
  title: string
  shortTitle: string
  displayValue: string
  numericValue: number
  score: number
  thresholds: { good: number, poor: number }
}

interface PsiResult {
  url: string
  fetchedUrl: string
  timestamp: number
  strategy: 'mobile' | 'desktop'
  framework: string | null
  performanceScore: number
  metrics: PsiMetric[]
  lcp: {
    value: number
    displayValue: string
    score: number
    phases: Array<{ id: string, label: string, duration: number }>
    element: {
      tagName: string
      snippet: string
      selector: string
      type: string
      boundingRect?: { top: number, left: number, right: number, bottom: number, width: number, height: number }
    } | null
    discovery: {
      eagerlyLoaded: boolean | null
      requestDiscoverable: boolean | null
      priorityHinted: boolean | null
    } | null
  }
  resources: Array<{ type: string, label: string, count: number, size: number }>
  thirdParties: Array<{
    entity: string
    size: number
    mainThreadTime: number
    subItems: Array<{ url: string, transferSize: number, mainThreadTime: number }>
  }>
  mainThread: {
    total: number
    items: Array<{ group: string, label: string, duration: number }>
  }
  opportunities: Array<{
    id: string
    title: string
    description: string
    displayValue: string
    score: number
    savings: { lcp: number, fcp: number, tbt: number, bytes: number } | null
  }>
  diagnostics: {
    totalRequests: number
    totalSize: number
    numScripts: number
    numStylesheets: number
    numFonts: number
    numTasksOver50ms: number
    numTasksOver100ms: number
    mainDocumentSize: number
    maxRtt: number
  } | null
  filmstrip: Array<{ timing: number, data: string }>
  screenshot: { data: string, width: number, height: number } | null
}

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

function analyze() {
  if (!urlInput.value.trim())
    return

  loading.value = true
  error.value = null
  result.value = null
  startMessages()

  $fetch<PsiResult>('/api/tools/pagespeed-insights', {
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
  if (bytes >= 1048576)
    return `${(bytes / 1048576).toFixed(1)} MB`
  if (bytes >= 1024)
    return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

function getScoreColor(score: number) {
  if (score >= 90)
    return 'text-green-500'
  if (score >= 50)
    return 'text-orange-500'
  return 'text-red-500'
}

function getScoreBg(score: number) {
  if (score >= 90)
    return 'bg-green-500'
  if (score >= 50)
    return 'bg-orange-500'
  return 'bg-red-500'
}

function getScoreRing(score: number) {
  if (score >= 90)
    return 'ring-green-500/30'
  if (score >= 50)
    return 'ring-orange-500/30'
  return 'ring-red-500/30'
}

const resourceColors: Record<string, string> = {
  'script': 'bg-amber-500',
  'font': 'bg-purple-500',
  'stylesheet': 'bg-blue-500',
  'document': 'bg-green-500',
  'image': 'bg-pink-500',
  'other': 'bg-gray-400',
  'media': 'bg-cyan-500',
  'third-party': 'bg-red-400',
  'total': 'bg-gray-600',
}

const mainThreadColors: Record<string, string> = {
  scriptEvaluation: 'bg-amber-500',
  styleLayout: 'bg-blue-500',
  scriptParseCompile: 'bg-orange-500',
  paintCompositeRender: 'bg-green-500',
  parseHTML: 'bg-purple-500',
  garbageCollection: 'bg-red-400',
  other: 'bg-gray-400',
}

function toggleThirdParty(entity: string) {
  if (expandedThirdParties.value.has(entity))
    expandedThirdParties.value.delete(entity)
  else
    expandedThirdParties.value.add(entity)
}

function scrollToLcpElement() {
  const container = screenshotRef.value
  const val = result.value
  if (!container || !val?.lcp.element?.boundingRect || !val.screenshot)
    return
  const containerWidth = container.clientWidth
  const scale = containerWidth / val.screenshot.width
  const scaledTop = val.lcp.element.boundingRect.top * scale
  const containerHeight = container.clientHeight
  const scrollTop = Math.max(0, scaledTop - containerHeight / 3)
  container.scrollTo({ top: scrollTop, behavior: 'smooth' })
}

watch(() => result.value?.lcp.element, (el) => {
  if (el?.boundingRect && result.value?.screenshot) {
    nextTick(() => setTimeout(scrollToLcpElement, 100))
  }
})

// Computed for filtered resources (exclude total and third-party for visualization)
const visualResources = computed(() => {
  if (!result.value)
    return []
  return result.value.resources.filter(r => r.type !== 'total' && r.type !== 'third-party' && r.size > 0)
})

const totalResourceSize = computed(() => {
  return result.value?.resources.find(r => r.type === 'total')?.size || 0
})
</script>

<template>
  <div class="min-h-screen">
    <!-- Floating Loader -->
    <Teleport to="body">
      <Transition name="slide-down">
        <div
          v-if="loading && showFloatingLoader"
          class="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white dark:bg-gray-900 shadow-lg border border-blue-200 dark:border-blue-800">
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-blue-500 animate-spin" />
            <span class="text-sm text-blue-700 dark:text-blue-300">{{ loadingMessage }}</span>
          </div>
        </div>
      </Transition>
    </Teleport>

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
            PageSpeed Insights
            <span class="text-blue-600 dark:text-blue-400">Performance</span>
          </motion.h1>
          <motion.p
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4, delay: 0.1 }"
            class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto"
          >
            Comprehensive performance analysis with Core Web Vitals, resource breakdown, and optimization opportunities.
          </motion.p>
          <template #fallback>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.1] text-gray-900 dark:text-white mb-3">
              PageSpeed Insights
              <span class="text-blue-600 dark:text-blue-400">Performance</span>
            </h1>
            <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Comprehensive performance analysis with Core Web Vitals, resource breakdown, and optimization opportunities.
            </p>
          </template>
        </ClientOnly>
      </div>
    </section>

    <!-- Tool Section -->
    <section class="px-3 sm:px-6 lg:px-8 pb-12">
      <div class="max-w-6xl mx-auto">
        <div class="relative">
          <!-- Glow effect -->
          <div class="absolute -inset-4 bg-gradient-to-b from-blue-500/10 via-blue-500/5 to-transparent rounded-3xl blur-3xl pointer-events-none" />

          <div class="relative bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
            <!-- Header -->
            <div class="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800">
              <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-blue-500" />
              <span class="text-sm font-semibold">Lighthouse Report</span>
              <span class="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">Full Analysis</span>
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
                    class="bg-blue-600 hover:bg-blue-500 text-white font-medium flex-1 sm:flex-none"
                  >
                    <span class="sm:hidden">Analyze</span>
                    <span class="hidden sm:inline">Run Full Analysis</span>
                  </UButton>
                </div>
              </form>
            </div>

            <!-- Loading State -->
            <div v-if="loading" ref="loadingContainerRef" class="p-6 text-center">
              <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-blue-500 animate-spin" />
                <span class="text-sm text-blue-700 dark:text-blue-300">{{ loadingMessage }}</span>
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
              <!-- Performance Score Hero -->
              <div class="text-center">
                <div class="inline-block">
                  <div
                    class="relative w-32 h-32 mx-auto"
                  >
                    <!-- Outer ring -->
                    <svg class="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="8"
                        class="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="8"
                        stroke-linecap="round"
                        :stroke-dasharray="`${result.performanceScore * 3.39} 339`"
                        :class="getScoreColor(result.performanceScore)"
                        class="transition-all duration-1000"
                      />
                    </svg>
                    <!-- Score text -->
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-4xl font-bold tabular-nums" :class="getScoreColor(result.performanceScore)">
                        {{ result.performanceScore }}
                      </span>
                    </div>
                  </div>
                  <div class="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
                    Performance Score
                  </div>
                  <div class="text-sm text-gray-500 truncate max-w-xs">
                    {{ result.fetchedUrl }}
                  </div>
                  <div class="mt-2 flex items-center justify-center gap-2">
                    <span class="px-2 py-0.5 text-xs font-medium rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      {{ result.strategy === 'mobile' ? 'Mobile' : 'Desktop' }}
                    </span>
                    <span
                      v-if="result.framework"
                      class="px-2 py-0.5 text-xs font-medium rounded flex items-center gap-1"
                      :class="{
                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300': result.framework === 'nuxt',
                        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300': result.framework === 'next',
                        'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300': result.framework === 'vite',
                      }"
                    >
                      <UIcon v-if="result.framework === 'nuxt'" name="i-logos-nuxt-icon" class="w-3 h-3" />
                      <UIcon v-else-if="result.framework === 'next'" name="i-logos-nextjs-icon" class="w-3 h-3" />
                      <UIcon v-else-if="result.framework === 'vite'" name="i-logos-vitejs" class="w-3 h-3" />
                      {{ result.framework === 'nuxt' ? 'Nuxt' : result.framework === 'next' ? 'Next.js' : 'Vite' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Core Web Vitals Grid -->
              <div>
                <div class="flex items-center gap-2 mb-4">
                  <UIcon name="i-heroicons-bolt" class="w-5 h-5 text-blue-500" />
                  <h3 class="text-lg font-semibold">
                    Core Web Vitals
                  </h3>
                </div>
                <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <motion.div
                    v-for="(metric, idx) in result.metrics"
                    :key="metric.id"
                    :initial="{ opacity: 0, y: 10 }"
                    :animate="{ opacity: 1, y: 0 }"
                    :transition="{ duration: 0.2, delay: idx * 0.05 }"
                    class="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">{{ metric.shortTitle }}</span>
                      <div
                        class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        :class="getScoreBg(metric.score)"
                      >
                        {{ metric.score }}
                      </div>
                    </div>
                    <div class="text-xl font-bold tabular-nums" :class="getScoreColor(metric.score)">
                      {{ metric.displayValue }}
                    </div>
                    <div class="text-xs text-gray-500 mt-1 truncate">
                      {{ metric.title }}
                    </div>
                    <!-- Threshold bar -->
                    <div class="mt-3 h-1.5 rounded-full overflow-hidden flex">
                      <div class="flex-[2.5] bg-green-400" />
                      <div class="flex-[1.5] bg-orange-400" />
                      <div class="flex-[2] bg-red-400" />
                    </div>
                  </motion.div>
                </div>
              </div>

              <!-- Filmstrip Timeline -->
              <div v-if="result.filmstrip.length">
                <div class="flex items-center gap-2 mb-4">
                  <UIcon name="i-heroicons-film" class="w-5 h-5 text-blue-500" />
                  <h3 class="text-lg font-semibold">
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
                      <div class="w-16 h-28 sm:w-24 sm:h-44 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                        <img
                          :src="frame.data"
                          :alt="`Frame at ${formatMs(frame.timing)}`"
                          class="w-full h-full object-cover object-top"
                        >
                      </div>
                      <span class="text-[9px] sm:text-[10px] font-medium text-gray-500 mt-1 tabular-nums">{{ formatMs(frame.timing) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- LCP Element + Screenshot -->
              <div v-if="result.lcp.element" class="grid lg:grid-cols-2 gap-6">
                <!-- Screenshot -->
                <div v-if="result.screenshot">
                  <div class="flex items-center gap-2 mb-3">
                    <UIcon name="i-heroicons-photo" class="w-5 h-5 text-violet-500" />
                    <h3 class="text-sm font-semibold">
                      LCP Element
                    </h3>
                  </div>
                  <div
                    ref="screenshotRef"
                    class="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 max-h-[300px] overflow-y-auto"
                  >
                    <div class="relative w-full">
                      <img
                        :src="result.screenshot.data"
                        alt="Page screenshot"
                        :width="result.screenshot.width"
                        :height="result.screenshot.height"
                        class="w-full h-auto block"
                      >
                      <div
                        v-if="result.lcp.element.boundingRect"
                        class="absolute border-2 border-violet-500 bg-violet-500/20 rounded-sm pointer-events-none"
                        :style="{
                          top: `${(result.lcp.element.boundingRect.top / result.screenshot.height) * 100}%`,
                          left: `${(result.lcp.element.boundingRect.left / result.screenshot.width) * 100}%`,
                          width: `${(result.lcp.element.boundingRect.width / result.screenshot.width) * 100}%`,
                          height: `${(result.lcp.element.boundingRect.height / result.screenshot.height) * 100}%`,
                        }"
                      >
                        <span class="absolute -top-5 left-0 px-1.5 py-0.5 text-[9px] font-medium bg-violet-500 text-white rounded whitespace-nowrap">
                          LCP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- LCP Details -->
                <div class="space-y-4">
                  <!-- LCP Score & Time -->
                  <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div class="flex items-center gap-4 mb-4">
                      <div
                        class="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg ring-4"
                        :class="[getScoreBg(result.lcp.score), getScoreRing(result.lcp.score)]"
                      >
                        {{ result.lcp.score }}
                      </div>
                      <div>
                        <div class="text-2xl font-bold tabular-nums" :class="getScoreColor(result.lcp.score)">
                          {{ result.lcp.displayValue }}
                        </div>
                        <div class="text-xs text-gray-500">
                          Largest Contentful Paint
                        </div>
                      </div>
                    </div>

                    <!-- Element Info -->
                    <div class="flex items-center gap-2 mb-2 flex-wrap">
                      <span class="px-1.5 py-0.5 text-[10px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded">
                        {{ result.lcp.element.type }}
                      </span>
                      <code class="text-xs text-gray-600 dark:text-gray-400">&lt;{{ result.lcp.element.tagName }}&gt;</code>
                    </div>
                    <p class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {{ result.lcp.element.snippet }}
                    </p>
                    <code v-if="result.lcp.element.selector" class="block mt-2 text-[10px] text-violet-600 dark:text-violet-400 truncate">
                      {{ result.lcp.element.selector }}
                    </code>
                  </div>

                  <!-- LCP Phases -->
                  <div v-if="result.lcp.phases.length" class="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div class="text-sm font-semibold mb-3">
                      Time Breakdown
                    </div>
                    <div class="flex h-4 rounded-lg overflow-hidden mb-3">
                      <div
                        v-for="(phase, idx) in result.lcp.phases"
                        :key="phase.id"
                        :style="{ width: `${(phase.duration / result.lcp.value) * 100}%` }"
                        :class="[idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-purple-500' : 'bg-orange-500']"
                        class="min-w-[4px]"
                      />
                    </div>
                    <div class="space-y-1">
                      <div
                        v-for="(phase, idx) in result.lcp.phases"
                        :key="phase.id"
                        class="flex items-center justify-between text-xs"
                      >
                        <div class="flex items-center gap-2">
                          <span
                            :class="[idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-purple-500' : 'bg-orange-500']"
                            class="w-2 h-2 rounded-full"
                          />
                          <span class="text-gray-600 dark:text-gray-400">{{ phase.label }}</span>
                        </div>
                        <span class="font-medium tabular-nums">{{ formatMs(phase.duration) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Discovery Checklist -->
                  <div v-if="result.lcp.discovery" class="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div class="text-sm font-semibold mb-3">
                      Image Optimization
                    </div>
                    <div class="space-y-2">
                      <div class="flex items-center gap-2 text-xs">
                        <UIcon
                          :name="result.lcp.discovery.eagerlyLoaded ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                          :class="result.lcp.discovery.eagerlyLoaded ? 'text-green-500' : 'text-red-500'"
                          class="w-4 h-4"
                        />
                        <span :class="result.lcp.discovery.eagerlyLoaded ? 'text-gray-600 dark:text-gray-400' : 'text-red-600 dark:text-red-400'">
                          {{ result.lcp.discovery.eagerlyLoaded ? 'Not lazy loaded' : 'Remove loading="lazy"' }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2 text-xs">
                        <UIcon
                          :name="result.lcp.discovery.requestDiscoverable ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                          :class="result.lcp.discovery.requestDiscoverable ? 'text-green-500' : 'text-red-500'"
                          class="w-4 h-4"
                        />
                        <span :class="result.lcp.discovery.requestDiscoverable ? 'text-gray-600 dark:text-gray-400' : 'text-red-600 dark:text-red-400'">
                          {{ result.lcp.discovery.requestDiscoverable ? 'Discoverable in HTML' : 'Add preload' }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2 text-xs">
                        <UIcon
                          :name="result.lcp.discovery.priorityHinted ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                          :class="result.lcp.discovery.priorityHinted ? 'text-green-500' : 'text-orange-500'"
                          class="w-4 h-4"
                        />
                        <span :class="result.lcp.discovery.priorityHinted ? 'text-gray-600 dark:text-gray-400' : 'text-orange-600 dark:text-orange-400'">
                          {{ result.lcp.discovery.priorityHinted ? 'Has fetchpriority="high"' : 'Add fetchpriority="high"' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Resource Breakdown -->
              <div v-if="result.resources.length">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-cube" class="w-5 h-5 text-blue-500" />
                    <h3 class="text-lg font-semibold">
                      Resource Breakdown
                    </h3>
                  </div>
                  <span class="text-sm text-gray-500 ml-7 sm:ml-0">{{ formatBytes(totalResourceSize) }} total</span>
                </div>

                <!-- Stacked bar -->
                <div class="h-8 rounded-lg overflow-hidden flex mb-4">
                  <div
                    v-for="resource in visualResources"
                    :key="resource.type"
                    :style="{ width: `${(resource.size / totalResourceSize) * 100}%` }"
                    :class="resourceColors[resource.type] || 'bg-gray-400'"
                    class="min-w-[2px] transition-all hover:opacity-80"
                    :title="`${resource.label}: ${formatBytes(resource.size)}`"
                  />
                </div>

                <!-- Resource table -->
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  <div
                    v-for="resource in result.resources.filter(r => r.type !== 'total')"
                    :key="resource.type"
                    class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                  >
                    <div class="flex items-center gap-2 mb-1">
                      <span
                        :class="resourceColors[resource.type] || 'bg-gray-400'"
                        class="w-2.5 h-2.5 rounded-full"
                      />
                      <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ resource.label }}</span>
                    </div>
                    <div class="text-lg font-bold tabular-nums">
                      {{ formatBytes(resource.size) }}
                    </div>
                    <div class="text-[10px] text-gray-500">
                      {{ resource.count }} requests
                    </div>
                  </div>
                </div>
              </div>

              <!-- Main Thread Work -->
              <div v-if="result.mainThread.items.length">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-cpu-chip" class="w-5 h-5 text-blue-500" />
                    <h3 class="text-lg font-semibold">
                      Main Thread Work
                    </h3>
                  </div>
                  <span class="text-sm text-gray-500 ml-7 sm:ml-0">{{ formatMs(result.mainThread.total) }} total</span>
                </div>

                <div class="space-y-2">
                  <div
                    v-for="item in result.mainThread.items"
                    :key="item.group"
                    class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"
                  >
                    <div class="flex items-center justify-between sm:contents">
                      <span class="text-xs text-gray-600 dark:text-gray-400 sm:w-32 truncate">{{ item.label }}</span>
                      <span class="text-xs font-medium tabular-nums sm:hidden">{{ formatMs(item.duration) }}</span>
                    </div>
                    <div class="flex-1 h-4 sm:h-5 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                      <div
                        :class="mainThreadColors[item.group] || 'bg-gray-400'"
                        :style="{ width: `${(item.duration / result.mainThread.total) * 100}%` }"
                        class="h-full rounded transition-all"
                      />
                    </div>
                    <span class="hidden sm:block text-xs font-medium tabular-nums w-16 text-right">{{ formatMs(item.duration) }}</span>
                  </div>
                </div>
              </div>

              <!-- Third Parties -->
              <div v-if="result.thirdParties.length">
                <div class="flex items-center gap-2 mb-4">
                  <UIcon name="i-heroicons-globe-alt" class="w-5 h-5 text-blue-500" />
                  <h3 class="text-lg font-semibold">
                    Third-Party Resources
                  </h3>
                </div>

                <div class="space-y-2">
                  <div
                    v-for="tp in result.thirdParties"
                    :key="tp.entity"
                    class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <button
                      type="button"
                      class="w-full p-3 flex items-center justify-between gap-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      @click="toggleThirdParty(tp.entity)"
                    >
                      <span class="font-medium text-sm truncate">{{ tp.entity }}</span>
                      <div class="flex items-center gap-2 sm:gap-4 shrink-0">
                        <span class="text-xs text-gray-500 hidden sm:inline">{{ formatBytes(tp.size) }}</span>
                        <span class="text-xs text-gray-500">{{ formatMs(tp.mainThreadTime) }}</span>
                        <UIcon
                          name="i-heroicons-chevron-down"
                          class="w-4 h-4 text-gray-400 transition-transform"
                          :class="{ 'rotate-180': expandedThirdParties.has(tp.entity) }"
                        />
                      </div>
                    </button>
                    <div v-if="expandedThirdParties.has(tp.entity) && tp.subItems.length" class="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 p-3">
                      <div class="space-y-1.5">
                        <div
                          v-for="(sub, idx) in tp.subItems.slice(0, 5)"
                          :key="idx"
                          class="flex items-center justify-between gap-2 text-xs"
                        >
                          <span class="text-gray-600 dark:text-gray-400 truncate min-w-0 flex-1">{{ sub.url }}</span>
                          <span class="text-gray-500 tabular-nums shrink-0">{{ formatBytes(sub.transferSize) }}</span>
                        </div>
                        <div v-if="tp.subItems.length > 5" class="text-xs text-gray-400">
                          +{{ tp.subItems.length - 5 }} more
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Opportunities -->
              <div v-if="result.opportunities.length">
                <div class="flex items-center gap-2 mb-4">
                  <UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-orange-500" />
                  <h3 class="text-lg font-semibold">
                    Opportunities
                  </h3>
                </div>

                <div class="space-y-2">
                  <div
                    v-for="opp in result.opportunities"
                    :key="opp.id"
                    class="p-3 sm:p-4 rounded-lg border border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-900/10"
                  >
                    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-sm text-gray-900 dark:text-white">
                          {{ opp.title }}
                        </div>
                        <div v-if="opp.displayValue" class="text-xs text-orange-600 dark:text-orange-400 mt-1 truncate">
                          {{ opp.displayValue }}
                        </div>
                      </div>
                      <div v-if="opp.savings" class="flex sm:flex-col gap-2 sm:gap-0 sm:text-right shrink-0">
                        <div v-if="opp.savings.lcp" class="text-xs text-green-600 dark:text-green-400">
                          Save {{ formatMs(opp.savings.lcp) }} LCP
                        </div>
                        <div v-if="opp.savings.bytes" class="text-xs text-gray-500">
                          {{ formatBytes(opp.savings.bytes) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Diagnostics -->
              <div v-if="result.diagnostics">
                <div class="flex items-center gap-2 mb-4">
                  <UIcon name="i-heroicons-clipboard-document-list" class="w-5 h-5 text-blue-500" />
                  <h3 class="text-lg font-semibold">
                    Diagnostics
                  </h3>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div class="p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
                    <div class="text-xl sm:text-2xl font-bold tabular-nums">
                      {{ result.diagnostics.totalRequests }}
                    </div>
                    <div class="text-[10px] sm:text-xs text-gray-500">
                      Requests
                    </div>
                  </div>
                  <div class="p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
                    <div class="text-xl sm:text-2xl font-bold tabular-nums">
                      {{ formatBytes(result.diagnostics.totalSize) }}
                    </div>
                    <div class="text-[10px] sm:text-xs text-gray-500">
                      Total Size
                    </div>
                  </div>
                  <div class="p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
                    <div class="text-xl sm:text-2xl font-bold tabular-nums">
                      {{ result.diagnostics.numScripts }}
                    </div>
                    <div class="text-[10px] sm:text-xs text-gray-500">
                      Scripts
                    </div>
                  </div>
                  <div class="p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
                    <div class="text-xl sm:text-2xl font-bold tabular-nums">
                      {{ result.diagnostics.numTasksOver50ms }}
                    </div>
                    <div class="text-[10px] sm:text-xs text-gray-500">
                      Long Tasks
                    </div>
                  </div>
                </div>
              </div>

              <!-- Link to Google PSI -->
              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      View on Google PageSpeed Insights
                    </p>
                    <p class="text-xs text-gray-500">
                      See the official report with full details
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
            </div>

            <!-- Empty state -->
            <div v-if="!result && !loading && !error" class="p-8 text-center text-gray-500">
              <UIcon name="i-heroicons-chart-bar" class="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Enter a URL to generate a full performance report</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
