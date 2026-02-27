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
    icon: 'i-heroicons-arrows-pointing-out',
    ariaLabel: 'CLS Debugger',
  },
})

const faqs = [
  {
    question: 'What is Cumulative Layout Shift (CLS)?',
    answer: 'Cumulative Layout Shift (CLS) is a Core Web Vital that measures visual stability. It quantifies how much page content unexpectedly shifts during loading. A good CLS score is 0.1 or less, meaning minimal unexpected movement of visible elements.',
  },
  {
    question: 'How do I find layout shift culprits on my page?',
    answer: 'This CLS debugger identifies exactly which elements cause layout shifts by analyzing your page with Lighthouse. It shows you the specific DOM elements, their shift scores, and visual overlays highlighting problem areas. Common culprits include images without dimensions, ads, embeds, and dynamically injected content.',
  },
  {
    question: 'What causes high CLS scores?',
    answer: 'High CLS is typically caused by: images or videos without explicit width/height attributes, ads or embeds that resize after loading, web fonts causing FOUT/FOIT, dynamically injected content above existing content, and animations that trigger layout changes instead of using transform.',
  },
  {
    question: 'How do I fix Cumulative Layout Shift issues?',
    answer: 'To fix CLS: always set width and height on images and video elements, reserve space for ads and embeds with CSS aspect-ratio, use font-display: optional or swap with fallback fonts, avoid inserting content above existing content, and use CSS transforms for animations instead of properties that trigger layout.',
  },
  {
    question: 'What is the difference between CLS in lab data vs field data?',
    answer: 'Lab CLS measures layout shifts during initial page load in a controlled environment. Field CLS (from real users) captures shifts throughout the entire page session, including those from user interactions. Field data often shows higher CLS because it includes shifts from lazy-loaded content and user-triggered changes.',
  },
]

useToolSeo({
  title: 'CLS Debugger - Free Layout Shift Testing Tool',
  description: 'Free CLS testing tool. Enter a URL to find which elements cause Cumulative Layout Shift and get actionable fixes. No signup required.',
  faqs,
})

// Loading messages with tips - shown during PageSpeed API analysis
const { current: loadingMessage, start: startMessages, stop: stopMessages } = useLoadingMessages([
  'Connecting to PageSpeed Insights API...',
  'Tip: Always set width and height on images',
  'Running Lighthouse audit on your page...',
  'Tip: Reserve space for ads and embeds',
  'Analyzing layout stability during load...',
  'Tip: Use font-display: optional for web fonts',
  'Detecting elements causing layout shifts...',
  'Tip: Avoid inserting content above existing content',
  'Measuring cumulative layout shift score...',
  'Tip: Use CSS aspect-ratio for responsive images',
  'Identifying unsized images and media...',
  'Tip: Add skeleton loaders for async content',
  'Generating CLS analysis report...',
], 3000)

// State
const route = useRoute()
const router = useRouter()
const urlInput = ref('')
const strategy = ref<'mobile' | 'desktop'>('mobile')
const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<ClsResult | null>(null)
const screenshotRef = ref<HTMLElement | null>(null)
const loadingContainerRef = ref<HTMLElement | null>(null)
const showFloatingLoader = ref(false)
const selectedElement = ref<number | null>(null)

interface ShiftElement {
  node: string
  nodeLabel: string
  selector: string
  score: number
  boundingRect?: {
    top: number
    right: number
    bottom: number
    left: number
    width: number
    height: number
  }
}

interface ShiftCluster {
  clusterStartTime: number
  clusterEndTime: number
  clusterDuration: number
  clusterScore: number
  shifts: Array<{
    startTime: number
    score: number
    impactedNodes: Array<{
      node: string
      nodeLabel: string
      selector: string
      previousRect?: { top: number, left: number, width: number, height: number }
      currentRect?: { top: number, left: number, width: number, height: number }
    }>
  }>
}

interface ClsCause {
  id: string
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
}

interface ClsResult {
  url: string
  fetchedUrl: string
  timestamp: number
  framework: 'nuxt' | 'next' | 'vite' | null
  performanceScore: number
  strategy: 'mobile' | 'desktop'
  cls: {
    value: number
    displayValue: string
    score: number
    thresholds: { good: number, poor: number }
  }
  shiftElements: ShiftElement[]
  shiftClusters: ShiftCluster[]
  clsCauses: ClsCause[]
  clsCulprits: Array<{ cause: string, elements: string[] }>
  unsizedImages: Array<{ url: string, snippet: string, selector: string }>
  resources: Array<{ type: string, label: string, count: number, size: number }>
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

function scrollToShiftElement(idx: number) {
  const container = screenshotRef.value
  const val = result.value
  const element = val?.shiftElements[idx]
  if (!container || !element?.boundingRect || !val?.screenshot)
    return

  selectedElement.value = idx
  const containerWidth = container.clientWidth
  const scale = containerWidth / val.screenshot.width
  const scaledTop = element.boundingRect.top * scale
  const containerHeight = container.clientHeight
  const scrollTop = Math.max(0, scaledTop - containerHeight / 3)
  container.scrollTo({ top: scrollTop, behavior: 'smooth' })
}

function analyze() {
  if (!urlInput.value.trim())
    return

  loading.value = true
  error.value = null
  result.value = null
  selectedElement.value = null
  startMessages()

  $fetch<ClsResult>('/api/tools/cls', {
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

function formatScore(score: number) {
  return score.toFixed(3)
}

// Calculate position on threshold bar (0-100%)
const thresholdPosition = computed(() => {
  if (!result.value)
    return 0
  const cls = result.value.cls.value

  if (cls <= 0.1) {
    return (cls / 0.1) * 40
  }
  else if (cls <= 0.25) {
    return 40 + ((cls - 0.1) / 0.15) * 25
  }
  else {
    const cappedCls = Math.min(cls, 0.5)
    return 65 + ((cappedCls - 0.25) / 0.25) * 35
  }
})

// Severity color helper
function getSeverityColor(severity: 'high' | 'medium' | 'low') {
  return {
    high: 'text-red-500',
    medium: 'text-orange-500',
    low: 'text-yellow-500',
  }[severity]
}

function getSeverityBg(severity: 'high' | 'medium' | 'low') {
  return {
    high: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    medium: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    low: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  }[severity]
}

// Insights based on results
interface ClsInsight {
  type: 'positive' | 'info' | 'warning'
  icon: string
  title: string
  description: string
}

const insights = computed<ClsInsight[]>(() => {
  if (!result.value)
    return []

  const items: ClsInsight[] = []
  const cls = result.value.cls
  const shiftElements = result.value.shiftElements
  const unsizedImages = result.value.unsizedImages
  const framework = result.value.framework

  // Overall CLS status
  if (cls.score >= 90) {
    items.push({
      type: 'positive',
      icon: 'i-heroicons-check-circle',
      title: 'Excellent layout stability',
      description: 'Your page has minimal layout shift. Users will have a smooth visual experience.',
    })
  }
  else if (cls.score >= 50) {
    items.push({
      type: 'info',
      icon: 'i-heroicons-information-circle',
      title: 'Some layout shifts detected',
      description: 'Your CLS is acceptable but could be improved. Focus on the elements listed below.',
    })
  }
  else {
    items.push({
      type: 'warning',
      icon: 'i-heroicons-exclamation-triangle',
      title: 'Significant layout instability',
      description: 'Users are experiencing jarring layout shifts. This directly impacts Core Web Vitals and SEO.',
    })
  }

  // Unsized images
  if (unsizedImages.length > 0) {
    items.push({
      type: 'warning',
      icon: 'i-heroicons-photo',
      title: `${unsizedImages.length} image${unsizedImages.length > 1 ? 's' : ''} missing dimensions`,
      description: 'Add width and height attributes to prevent layout shifts when images load.',
    })
  }

  // Shift elements count
  if (shiftElements.length > 3) {
    items.push({
      type: 'warning',
      icon: 'i-heroicons-squares-2x2',
      title: `${shiftElements.length} elements shifting`,
      description: 'Multiple elements are causing shifts. Check for common causes like late-loading content or injected ads.',
    })
  }

  // Framework-specific tips
  if (framework === 'nuxt' && cls.score < 90) {
    items.push({
      type: 'info',
      icon: 'i-logos-nuxt-icon',
      title: 'Nuxt CLS tips',
      description: 'Use @nuxt/image for automatic sizing, add skeleton loaders for async content, and use font-display: optional.',
    })
  }
  else if (framework === 'next' && cls.score < 90) {
    items.push({
      type: 'info',
      icon: 'i-logos-nextjs-icon',
      title: 'Next.js CLS tips',
      description: 'Use next/image for automatic sizing, add placeholder="blur" for images, and use next/font for zero-CLS fonts.',
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
            CLS
            <span class="text-cyan-600 dark:text-cyan-400">Debugger</span>
          </h1>
          <p
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4, delay: 0.1 }"
            class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto"
          >
            Find which elements cause layout shifts and fix the jank.
          </p>
          <template #fallback>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.1] text-gray-900 dark:text-white mb-3">
              CLS
              <span class="text-cyan-600 dark:text-cyan-400">Debugger</span>
            </h1>
            <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Find which elements cause layout shifts and fix the jank.
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
              <UIcon name="i-heroicons-arrows-pointing-out" class="w-4 h-4 text-cyan-500" />
              <span class="text-sm font-semibold">CLS Analysis</span>
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
                    <span class="sm:hidden">Find Shifts</span>
                    <span class="hidden sm:inline">Find Layout Shifts</span>
                  </UButton>
                </div>
              </form>
            </div>

            <!-- Loading State -->
            <div v-if="loading" ref="loadingContainerRef" class="p-6 text-center">
              <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
                <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-cyan-500 animate-spin" />
                <span class="text-sm text-cyan-700 dark:text-cyan-300">{{ loadingMessage }}</span>
              </div>
              <p class="mt-4 text-xs text-gray-500">
                This can take up to 2 minutes. Learn about CLS below while we analyze.
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
              <!-- Hero: Screenshot + CLS Info side by side -->
              <div class="flex flex-col sm:flex-row gap-4 mb-6">
                <!-- Screenshot with shift overlays -->
                <div v-if="result.screenshot" class="sm:w-1/2 flex justify-center">
                  <div
                    ref="screenshotRef"
                    class="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 max-h-[350px] overflow-y-auto w-full"
                    :style="{ maxWidth: `${result.screenshot.width}px` }"
                  >
                    <div class="relative w-full">
                      <img
                        :src="result.screenshot.data"
                        alt="Page screenshot"
                        :width="result.screenshot.width"
                        :height="result.screenshot.height"
                        class="w-full h-auto block"
                      >
                      <!-- Shift Element Overlays -->
                      <div
                        v-for="(element, idx) in result.shiftElements.filter(e => e.boundingRect)"
                        :key="idx"
                        class="absolute border-2 rounded-sm pointer-events-none transition-all duration-300"
                        :class="[
                          selectedElement === idx
                            ? 'border-cyan-400 bg-cyan-400/30 ring-2 ring-cyan-400 ring-offset-1'
                            : 'border-red-400/70 bg-red-400/20',
                        ]"
                        :style="{
                          top: `${(element.boundingRect!.top / result.screenshot!.height) * 100}%`,
                          left: `${(element.boundingRect!.left / result.screenshot!.width) * 100}%`,
                          width: `${(element.boundingRect!.width / result.screenshot!.width) * 100}%`,
                          height: `${(element.boundingRect!.height / result.screenshot!.height) * 100}%`,
                        }"
                      >
                        <span
                          class="absolute -top-5 left-0 px-1.5 py-0.5 text-[9px] font-bold text-white rounded whitespace-nowrap"
                          :class="selectedElement === idx ? 'bg-cyan-500' : 'bg-red-500'"
                        >
                          {{ formatScore(element.score) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- CLS Info Card -->
                <div class="sm:w-1/2 flex flex-col justify-center">
                  <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4">
                    <!-- Score + Value -->
                    <div class="flex items-center gap-4">
                      <div
                        class="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg shrink-0"
                        :class="{
                          'bg-green-500': result.cls.score >= 90,
                          'bg-orange-500': result.cls.score >= 50 && result.cls.score < 90,
                          'bg-red-500': result.cls.score < 50,
                        }"
                      >
                        {{ Math.round(result.cls.score) }}
                      </div>
                      <div>
                        <div
                          class="text-2xl font-bold tabular-nums"
                          :class="{
                            'text-green-600 dark:text-green-400': result.cls.score >= 90,
                            'text-orange-600 dark:text-orange-400': result.cls.score >= 50 && result.cls.score < 90,
                            'text-red-600 dark:text-red-400': result.cls.score < 50,
                          }"
                        >
                          {{ result.cls.displayValue }}
                        </div>
                        <div class="text-xs text-gray-500">
                          Cumulative Layout Shift
                        </div>
                      </div>
                    </div>

                    <!-- Quick Stats -->
                    <div class="grid grid-cols-2 gap-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                      <div class="text-center p-2 rounded-lg bg-white dark:bg-gray-900">
                        <div class="text-lg font-bold text-gray-900 dark:text-white">
                          {{ result.shiftElements.length }}
                        </div>
                        <div class="text-[10px] text-gray-500">
                          Shifting Elements
                        </div>
                      </div>
                      <div class="text-center p-2 rounded-lg bg-white dark:bg-gray-900">
                        <div class="text-lg font-bold text-gray-900 dark:text-white">
                          {{ result.unsizedImages.length }}
                        </div>
                        <div class="text-[10px] text-gray-500">
                          Unsized Images
                        </div>
                      </div>
                    </div>

                    <!-- Framework badge -->
                    <div v-if="result.framework" class="flex items-center gap-2">
                      <span
                        class="px-2 py-1 text-xs font-medium rounded flex items-center gap-1.5" :class="{
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

              <!-- CrUX Field Data -->
              <div class="mb-6">
                <ToolsCruxFieldDataCard
                  metric="cls"
                  :url="urlInput"
                  :form-factor="strategy === 'mobile' ? 'PHONE' : 'DESKTOP'"
                  :lab-value="result.cls.value"
                  :lab-display-value="result.cls.displayValue"
                />
              </div>

              <div class="grid lg:grid-cols-2 gap-6">
                <!-- Left: Threshold & Shift Elements -->
                <div class="space-y-5">
                  <!-- Threshold Bar -->
                  <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div class="flex items-center gap-2 mb-3">
                      <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-cyan-500" />
                      <span class="text-sm font-semibold">CLS Threshold</span>
                    </div>
                    <div class="relative">
                      <div class="flex h-3 rounded-full overflow-hidden shadow-inner">
                        <div class="flex-[1] bg-gradient-to-r from-green-400 to-green-500" />
                        <div class="flex-[1.5] bg-gradient-to-r from-orange-400 to-orange-500" />
                        <div class="flex-[2.5] bg-gradient-to-r from-red-400 to-red-500" />
                      </div>
                      <!-- Position indicator -->
                      <div
                        class="absolute top-0 -translate-x-1/2 transition-all duration-500"
                        :style="{ left: `${thresholdPosition}%` }"
                      >
                        <div class="flex flex-col items-center">
                          <div
                            class="w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 shadow-md flex items-center justify-center"
                            :class="{
                              'bg-green-500': result.cls.score >= 90,
                              'bg-orange-500': result.cls.score >= 50 && result.cls.score < 90,
                              'bg-red-500': result.cls.score < 50,
                            }"
                          />
                          <div class="w-0.5 h-2 bg-gray-400 dark:bg-gray-600" />
                          <span class="text-[10px] font-bold tabular-nums mt-0.5">{{ result.cls.displayValue }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="flex justify-between mt-6 text-[10px] text-gray-500">
                      <span>0</span>
                      <span class="text-green-600 font-medium">≤0.1 Good</span>
                      <span class="text-orange-500">0.25</span>
                      <span class="text-red-500">Poor</span>
                    </div>
                  </div>

                  <!-- Shift Elements List -->
                  <div v-if="result.shiftElements.length" class="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div class="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                      <div class="flex items-center gap-2">
                        <UIcon name="i-heroicons-arrows-pointing-out" class="w-4 h-4 text-cyan-500" />
                        <span class="text-sm font-semibold">Elements Causing Shifts</span>
                      </div>
                    </div>
                    <div class="divide-y divide-gray-100 dark:divide-gray-800">
                      <button
                        v-for="(element, idx) in result.shiftElements.slice(0, 5)"
                        :key="idx"
                        type="button"
                        class="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        :class="{ 'bg-cyan-50 dark:bg-cyan-900/20': selectedElement === idx }"
                        @click="scrollToShiftElement(idx)"
                      >
                        <div class="flex items-start gap-3">
                          <div
                            class="shrink-0 px-2 py-1 rounded-md border"
                            :class="element.score > 0.1 ? 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800/50' : 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800/50'"
                          >
                            <span
                              class="text-sm font-bold tabular-nums"
                              :class="element.score > 0.1 ? 'text-red-700 dark:text-red-300' : 'text-orange-700 dark:text-orange-300'"
                            >
                              {{ formatScore(element.score) }}
                            </span>
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {{ element.nodeLabel || 'Unknown element' }}
                            </p>
                            <code v-if="element.selector" class="block text-[10px] text-cyan-600 dark:text-cyan-400 truncate mt-0.5">
                              {{ element.selector }}
                            </code>
                          </div>
                          <UIcon name="i-heroicons-eye" class="w-4 h-4 text-gray-400 shrink-0" />
                        </div>
                      </button>
                    </div>
                  </div>

                  <!-- No shifts message -->
                  <div v-else class="text-center py-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                    <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      No significant layout shifts detected!
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                      Your page has excellent visual stability.
                    </p>
                  </div>
                </div>

                <!-- Right: Causes & Fixes -->
                <div class="space-y-5">
                  <!-- Common Causes -->
                  <div v-if="result.clsCauses.length">
                    <div class="flex items-center gap-2 mb-3">
                      <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-orange-500" />
                      <span class="text-sm font-semibold">Common Causes Found</span>
                    </div>
                    <div class="space-y-2">
                      <div
                        v-for="cause in result.clsCauses"
                        :key="cause.id"
                        class="p-3 rounded-lg border"
                        :class="getSeverityBg(cause.severity)"
                      >
                        <div class="flex items-start gap-2">
                          <UIcon
                            name="i-heroicons-exclamation-circle"
                            class="w-4 h-4 shrink-0 mt-0.5"
                            :class="getSeverityColor(cause.severity)"
                          />
                          <div>
                            <p class="text-sm font-medium text-gray-900 dark:text-white">
                              {{ cause.title }}
                            </p>
                            <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              {{ cause.description }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Unsized Images -->
                  <div v-if="result.unsizedImages.length" class="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div class="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                      <div class="flex items-center gap-2">
                        <UIcon name="i-heroicons-photo" class="w-4 h-4 text-orange-500" />
                        <span class="text-sm font-semibold">Images Missing Dimensions</span>
                      </div>
                    </div>
                    <div class="p-3 space-y-2">
                      <div
                        v-for="(img, idx) in result.unsizedImages"
                        :key="idx"
                        class="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50"
                      >
                        <code class="block text-xs text-gray-700 dark:text-gray-300 truncate">
                          {{ img.snippet || img.url }}
                        </code>
                        <p class="text-[10px] text-orange-600 dark:text-orange-400 mt-1">
                          Add width="" and height="" attributes
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- No causes found -->
                  <div v-if="!result.clsCauses.length && !result.unsizedImages.length && result.cls.score >= 90" class="text-center py-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                    <UIcon name="i-heroicons-sparkles" class="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      No common CLS issues detected!
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                      Your layout stability is excellent.
                    </p>
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
              <ToolFeedback tool-id="cls-debugger" :context="{ url: urlInput, strategy }" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Educational Content -->
    <section class="px-3 sm:px-6 lg:px-8 pb-12">
      <div class="max-w-6xl mx-auto">
        <!-- What is CLS -->
        <div class="mb-10 grid lg:grid-cols-[1fr_320px] gap-4 sm:gap-6 lg:gap-8 items-start">
          <!-- Left: Text Content -->
          <div>
            <h2 class="text-lg sm:text-xl lg:text-2xl font-bold mb-3 text-gray-900 dark:text-white">
              What is Cumulative Layout Shift?
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              CLS measures <strong class="text-gray-900 dark:text-white">visual stability</strong>—how much elements move unexpectedly while the page loads.
              A high CLS score means users experience jarring shifts, like clicking a button that suddenly moves because an ad loaded above it.
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Google considers CLS one of the three
              <a href="https://web.dev/vitals/" target="_blank" class="text-cyan-600 dark:text-cyan-400 hover:underline">Core Web Vitals</a>
              that directly affect search rankings. A score of <strong class="text-gray-900 dark:text-white">0.1 or below</strong> is considered good.
            </p>
          </div>

          <!-- Right: CLS Visualization -->
          <div class="relative bg-gray-900 rounded-xl p-4 overflow-hidden">
            <div class="absolute top-0 left-1/4 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl" />
            <div class="absolute bottom-0 right-1/4 w-24 h-24 bg-cyan-600/15 rounded-full blur-2xl" />

            <div class="relative">
              <h3 class="text-xs font-semibold text-white mb-3 flex items-center gap-1.5">
                <UIcon name="i-heroicons-arrows-pointing-out" class="w-3.5 h-3.5 text-cyan-400" />
                Layout Shift Example
              </h3>

              <!-- Shift visualization -->
              <div class="space-y-2">
                <!-- Before state -->
                <div class="relative h-16 rounded bg-gray-800 border border-gray-700 overflow-hidden">
                  <div class="absolute top-2 left-2 right-2 h-3 bg-gray-600 rounded" />
                  <div class="absolute top-7 left-2 w-16 h-6 bg-cyan-500/60 rounded border border-cyan-400 flex items-center justify-center">
                    <span class="text-[8px] text-white font-medium">Button</span>
                  </div>
                  <div class="absolute top-2 right-2 text-[8px] text-gray-400">
                    Before
                  </div>
                </div>

                <!-- Arrow -->
                <div class="flex justify-center">
                  <UIcon name="i-heroicons-arrow-down" class="w-4 h-4 text-red-400 animate-bounce" />
                </div>

                <!-- After state with shift -->
                <div class="relative h-20 rounded bg-gray-800 border border-red-500/50 overflow-hidden">
                  <div class="absolute top-2 left-2 right-2 h-3 bg-gray-600 rounded" />
                  <div class="absolute top-7 left-2 right-2 h-5 bg-red-500/30 rounded border border-dashed border-red-400 flex items-center justify-center">
                    <span class="text-[8px] text-red-300">Ad loaded here</span>
                  </div>
                  <div class="absolute top-14 left-2 w-16 h-6 bg-cyan-500/60 rounded border border-cyan-400 flex items-center justify-center">
                    <span class="text-[8px] text-white font-medium">Button</span>
                  </div>
                  <div class="absolute top-2 right-2 text-[8px] text-red-400">
                    After (shifted!)
                  </div>
                </div>
              </div>

              <div class="mt-3 pt-2 border-t border-gray-800">
                <p class="text-[10px] text-gray-400">
                  Elements moving after render causes poor <strong class="text-white">user experience</strong> and missed clicks.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Common CLS Causes -->
        <div class="mb-12 relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div class="p-5 sm:p-6">
            <div class="mb-6">
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-600">
                  <UIcon name="i-heroicons-wrench-screwdriver" class="w-4 h-4 text-white" />
                </span>
                Common CLS Causes & Fixes
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Most layout shifts come from these common issues
              </p>
            </div>

            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <!-- Images without dimensions -->
              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <UIcon name="i-heroicons-photo" class="w-4 h-4 text-orange-500" />
                  </div>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white">Unsized Images</span>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Images without width/height push content when they load.
                </p>
                <code class="block text-[10px] bg-gray-900 dark:bg-gray-950 text-green-400 p-2 rounded overflow-x-auto">
                  &lt;img width="800" height="600" ...&gt;
                </code>
              </div>

              <!-- Web fonts -->
              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <UIcon name="i-heroicons-language" class="w-4 h-4 text-purple-500" />
                  </div>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white">Font Loading</span>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Custom fonts can cause text to reflow when they load.
                </p>
                <code class="block text-[10px] bg-gray-900 dark:bg-gray-950 text-green-400 p-2 rounded overflow-x-auto">
                  font-display: optional;
                </code>
              </div>

              <!-- Dynamic content -->
              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <UIcon name="i-heroicons-rectangle-group" class="w-4 h-4 text-blue-500" />
                  </div>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white">Dynamic Content</span>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Ads, embeds, and async content push existing content.
                </p>
                <code class="block text-[10px] bg-gray-900 dark:bg-gray-950 text-green-400 p-2 rounded overflow-x-auto">
                  Reserve space with min-height
                </code>
              </div>

              <!-- Animations -->
              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                    <UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-pink-500" />
                  </div>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white">CSS Animations</span>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Avoid animating properties that trigger layout.
                </p>
                <code class="block text-[10px] bg-gray-900 dark:bg-gray-950 text-green-400 p-2 rounded overflow-x-auto">
                  Use transform, not top/left
                </code>
              </div>

              <!-- Injected content -->
              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <UIcon name="i-heroicons-code-bracket" class="w-4 h-4 text-red-500" />
                  </div>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white">Injected Elements</span>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Banners, cookie notices, and alerts inserted at the top.
                </p>
                <code class="block text-[10px] bg-gray-900 dark:bg-gray-950 text-green-400 p-2 rounded overflow-x-auto">
                  Use position: fixed or sticky
                </code>
              </div>

              <!-- Skeleton loaders -->
              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <UIcon name="i-heroicons-squares-2x2" class="w-4 h-4 text-green-500" />
                  </div>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white">Missing Placeholders</span>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Async content should have skeleton loaders.
                </p>
                <code class="block text-[10px] bg-gray-900 dark:bg-gray-950 text-green-400 p-2 rounded overflow-x-auto">
                  Show skeleton while loading
                </code>
              </div>
            </div>
          </div>
        </div>

        <!-- FAQ Section -->
        <ToolFaq :faqs="faqs" color="cyan" />

        <!-- Related Tools -->
        <div class="text-center mt-12">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Explore more Core Web Vitals tools
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <UButton to="/tools/lcp-finder" variant="outline" size="sm" class="gap-2">
              <UIcon name="i-heroicons-photo" class="w-4 h-4" />
              LCP Finder
            </UButton>
            <UButton to="/tools/pagespeed-insights-performance" variant="outline" size="sm" class="gap-2">
              <UIcon name="i-heroicons-chart-bar" class="w-4 h-4" />
              Full Performance Report
            </UButton>
            <UButton to="/learn-lighthouse/cls" variant="outline" size="sm" class="gap-2">
              <UIcon name="i-heroicons-book-open" class="w-4 h-4" />
              CLS Optimization Guide
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Floating loader when scrolled past -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-300"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div v-if="showFloatingLoader" class="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-cyan-500 animate-spin" />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ loadingMessage }}</span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
