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
    icon: 'i-heroicons-photo',
    ariaLabel: 'LCP Element Finder',
  },
})

useSeoMeta({
  title: 'LCP Element Finder - Identify Your Largest Contentful Paint',
  description: 'Find the LCP element on any page. See what\'s slowing down your Largest Contentful Paint and get actionable recommendations to improve it.',
})

defineOgImage('NuxtSeo', {
  title: 'LCP Element Finder',
  description: 'Identify your Largest Contentful Paint element',
  theme: '#a855f7',
})

// Loading messages with tips - shown during PageSpeed API analysis
const { current: loadingMessage, start: startMessages, stop: stopMessages } = useLoadingMessages([
  'Connecting to PageSpeed Insights API...',
  'Tip: Add fetchpriority="high" to your LCP image',
  'Running Lighthouse audit on your page...',
  'Tip: Preload LCP images with <link rel="preload">',
  'Analyzing page render timeline...',
  'Tip: Avoid lazy-loading images above the fold',
  'Identifying the largest contentful element...',
  'Tip: Use WebP or AVIF for smaller image files',
  'Measuring Time to First Byte (TTFB)...',
  'Tip: A fast server response improves all metrics',
  'Calculating resource load delays...',
  'Tip: Inline critical CSS to speed up first paint',
  'Measuring element render timing...',
  'Tip: Reduce JavaScript blocking the main thread',
  'Generating performance report...',
], 3000)

// State
const route = useRoute()
const router = useRouter()
const urlInput = ref('')
const strategy = ref<'mobile' | 'desktop'>('mobile')
const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<LcpResult | null>(null)
const screenshotRef = ref<HTMLElement | null>(null)
const loadingContainerRef = ref<HTMLElement | null>(null)
const showFloatingLoader = ref(false)

// LCP Phases visualization state
const lcpPhaseMode = ref<'image' | 'text'>('image')
const phaseHovered = ref<string | null>(null)
const isAnimating = ref(false)
const animationProgress = ref<number[]>([])

const lcpPhases = computed(() => {
  const isImage = lcpPhaseMode.value === 'image'
  return [
    {
      id: 'ttfb',
      label: 'Time to First Byte',
      shortLabel: 'TTFB',
      duration: isImage ? 800 : 600,
      percentage: isImage ? 25 : 30,
      intensity: 100, // darkest
      icon: 'i-heroicons-server',
      description: 'Time waiting for the server to respond with the first byte of HTML.',
      tips: ['Use a CDN to serve content closer to users', 'Enable server-side caching', 'Optimize database queries', 'Consider edge rendering (SSR at the edge)'],
      appliesTo: 'both',
    },
    {
      id: 'loadDelay',
      label: 'Resource Load Delay',
      shortLabel: 'Load Delay',
      duration: isImage ? 400 : 0,
      percentage: isImage ? 15 : 0,
      intensity: 80,
      icon: 'i-heroicons-clock',
      description: 'Time between TTFB and when the browser starts loading the LCP resource.',
      tips: ['Add <link rel="preload"> for LCP image', 'Avoid lazy-loading the LCP image', 'Inline critical CSS to unblock rendering', 'Remove render-blocking JavaScript'],
      appliesTo: 'image',
    },
    {
      id: 'loadDuration',
      label: 'Resource Load Duration',
      shortLabel: 'Load Time',
      duration: isImage ? 600 : 0,
      percentage: isImage ? 25 : 0,
      intensity: 60,
      icon: 'i-heroicons-arrow-down-tray',
      description: 'Time spent downloading the LCP image or video resource.',
      tips: ['Compress images with WebP or AVIF', 'Use responsive images with srcset', 'Serve appropriately sized images', 'Use a fast CDN with HTTP/2 or HTTP/3'],
      appliesTo: 'image',
    },
    {
      id: 'renderDelay',
      label: 'Element Render Delay',
      shortLabel: 'Render Delay',
      duration: isImage ? 700 : 1400,
      percentage: isImage ? 35 : 70,
      intensity: 40, // lightest
      icon: 'i-heroicons-paint-brush',
      description: 'Time from resource loaded (or TTFB for text) until the element is painted.',
      tips: ['Reduce JavaScript bundle size', 'Use font-display: optional for web fonts', 'Minimize main thread blocking', 'Defer non-critical JavaScript'],
      appliesTo: 'both',
    },
  ].filter(p => p.appliesTo === 'both' || p.appliesTo === lcpPhaseMode.value)
})

const totalDuration = computed(() => lcpPhases.value.reduce((sum, p) => sum + p.duration, 0))

// Current animation phase for wireframe visualization
const currentAnimationPhase = computed(() => {
  if (!isAnimating.value)
    return null
  // Find the phase that's currently animating (progress > 0 but < 1)
  const activeIdx = animationProgress.value.findIndex((p, idx) => {
    const isActive = p > 0 && p < 1
    const isLastCompleted = p === 1 && animationProgress.value.slice(idx + 1).every(v => v === 0)
    return isActive || isLastCompleted
  })
  if (activeIdx >= 0)
    return lcpPhases.value[activeIdx]?.id || null
  // All complete
  if (animationProgress.value.every(p => p === 1))
    return 'complete'
  return null
})

// Animation playback - 4x slower (each phase takes ~1.2s to animate)
function playAnimation() {
  if (isAnimating.value)
    return
  isAnimating.value = true
  animationProgress.value = lcpPhases.value.map(() => 0)

  const animatePhase = (idx: number) => {
    if (idx >= lcpPhases.value.length) {
      setTimeout(() => {
        isAnimating.value = false
      }, 800)
      return
    }

    // Animate this phase's width from 0 to 100 over 1.2s
    const startTime = performance.now()
    const duration = 1200 // 1.2s per phase

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      animationProgress.value[idx] = progress

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
      else {
        // Small pause before next phase
        setTimeout(() => animatePhase(idx + 1), 200)
      }
    }

    requestAnimationFrame(animate)
  }

  animatePhase(0)
}

// Reset animation when mode changes
watch(lcpPhaseMode, () => {
  isAnimating.value = false
  animationProgress.value = []
})

// URL syncing - read from query on mount, auto-analyze if present
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

  // Scroll handler for floating loader
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

// Debounce URL updates to query string
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

// Sync strategy to URL
watch(strategy, (newStrategy) => {
  if (newStrategy === 'desktop') {
    router.replace({ query: { ...route.query, strategy: 'desktop' } })
  }
  else {
    const { strategy: _, ...rest } = route.query
    router.replace({ query: rest })
  }
})

// Auto-scroll screenshot to LCP element
function scrollToLcpElement() {
  const container = screenshotRef.value
  const val = result.value
  if (!container || !val?.element?.boundingRect || !val.screenshot)
    return

  // Calculate scroll position based on the actual rendered size
  const containerWidth = container.clientWidth
  const scale = containerWidth / val.screenshot.width
  const scaledTop = val.element.boundingRect.top * scale
  const containerHeight = container.clientHeight

  // Center the element in the viewport
  const scrollTop = Math.max(0, scaledTop - containerHeight / 3)
  container.scrollTo({ top: scrollTop, behavior: 'smooth' })
}

watch(result, (val) => {
  if (val?.element?.boundingRect && val.screenshot) {
    // Wait for DOM update and image to potentially load
    nextTick(() => {
      setTimeout(scrollToLcpElement, 100)
    })
  }
})

interface LcpPhase {
  id: string
  label: string
  duration: number
}

interface LcpResult {
  url: string
  fetchedUrl: string
  timestamp: number
  framework: 'nuxt' | 'next' | 'vite' | null
  lcp: {
    value: number
    displayValue: string
    score: number
  }
  phases: LcpPhase[]
  element: {
    tagName: string
    snippet: string
    selector: string
    type: string
    boundingRect?: {
      top: number
      right: number
      bottom: number
      left: number
      width: number
      height: number
    }
  } | null
  discovery: {
    eagerlyLoaded: boolean | null
    requestDiscoverable: boolean | null
    priorityHinted: boolean | null
  } | null
  opportunities: Array<{
    id: string
    title: string
    description: string
    displayValue: string
    score: number
    savings: { ms: number, bytes?: number } | null
  }>
  screenshot: {
    data: string
    width: number
    height: number
  } | null
  strategy: 'mobile' | 'desktop'
  performanceScore: number
}

function analyze() {
  if (!urlInput.value.trim())
    return

  loading.value = true
  error.value = null
  result.value = null
  startMessages()

  $fetch<LcpResult>('/api/tools/lcp', {
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

// Calculate position on threshold bar (0-100%)
const thresholdPosition = computed(() => {
  if (!result.value)
    return 0
  const lcpMs = result.value.lcp.value
  const lcpSeconds = lcpMs / 1000

  if (lcpSeconds <= 2.5) {
    return (lcpSeconds / 2.5) * 40
  }
  else if (lcpSeconds <= 4) {
    return 40 + ((lcpSeconds - 2.5) / 1.5) * 25
  }
  else {
    const cappedSeconds = Math.min(lcpSeconds, 8)
    return 65 + ((cappedSeconds - 4) / 4) * 35
  }
})

// Generate contextual insights based on LCP results
interface LcpInsight {
  type: 'positive' | 'info' | 'warning'
  icon: string
  title: string
  description: string
}

const insights = computed<LcpInsight[]>(() => {
  if (!result.value)
    return []

  const items: LcpInsight[] = []
  const isTextLcp = result.value.element?.type === 'text'
  const isImageLcp = result.value.element?.type === 'image'
  const lcpScore = result.value.lcp.score
  const phases = result.value.phases || []
  const framework = result.value.framework
  const opportunities = result.value.opportunities || []

  // Find the biggest bottleneck phase
  const renderDelay = phases.find(p => p.id === 'renderDelay')?.duration || 0
  const ttfb = phases.find(p => p.id === 'ttfb')?.duration || 0
  const loadDelay = phases.find(p => p.id === 'loadDelay')?.duration || 0
  const loadTime = phases.find(p => p.id === 'loadTime')?.duration || 0

  // Check for JS-related opportunities
  const hasJsOpportunity = opportunities.some(o => o.id === 'unused-javascript' || o.id === 'render-blocking-resources')

  // Text LCP insights
  if (isTextLcp) {
    if (lcpScore >= 90) {
      items.push({
        type: 'positive',
        icon: 'i-heroicons-check-circle',
        title: 'Text LCP is optimal',
        description: 'Text elements typically have the fastest LCP since they don\'t require external resources. Your page is well optimized.',
      })
    }
    else if (lcpScore >= 50) {
      items.push({
        type: 'info',
        icon: 'i-heroicons-information-circle',
        title: 'Text LCP is solid',
        description: 'Having text as your LCP element is generally ideal. Further optimization is possible but may have diminishing returns.',
      })
    }
    else {
      items.push({
        type: 'warning',
        icon: 'i-heroicons-exclamation-triangle',
        title: 'Text LCP is slow',
        description: 'Despite being text (which is good), your LCP is delayed. Check if JavaScript is blocking the initial render or if custom fonts are causing delays.',
      })
    }

    // Render delay is the main issue for text LCP
    if (renderDelay > 500) {
      items.push({
        type: 'warning',
        icon: 'i-heroicons-clock',
        title: `${formatMs(renderDelay)} render delay`,
        description: framework === 'nuxt'
          ? 'For Nuxt: ensure you\'re using SSR (not SPA mode), add @nuxt/fonts module for automatic font optimization, and use font-display: optional for fastest text paint.'
          : 'This is usually caused by render-blocking JavaScript (framework hydration), custom fonts loading, or CSS blocking paint. Consider font-display: optional and reducing JS bundle size.',
      })
    }

    // Framework-specific tips for JS bundle issues
    if (hasJsOpportunity && lcpScore < 90) {
      if (framework === 'nuxt') {
        items.push({
          type: 'info',
          icon: 'i-logos-nuxt-icon',
          title: 'Nuxt optimization tips',
          description: 'Use @nuxt/fonts for automatic font optimization, enable experimental.payloadExtraction, and lazy load below-fold components with <LazyComponent>.',
        })
      }
      else if (framework === 'next') {
        items.push({
          type: 'info',
          icon: 'i-logos-nextjs-icon',
          title: 'Next.js optimization tips',
          description: 'Use next/font for automatic font optimization, enable App Router for streaming SSR, and use next/dynamic for lazy loading non-critical components.',
        })
      }
    }
  }

  // Image LCP insights
  if (isImageLcp) {
    const discovery = result.value.discovery
    const allDiscoveryGood = discovery?.eagerlyLoaded && discovery?.requestDiscoverable && discovery?.priorityHinted

    if (allDiscoveryGood && lcpScore >= 90) {
      items.push({
        type: 'positive',
        icon: 'i-heroicons-check-circle',
        title: 'Image LCP is well optimized',
        description: 'Your LCP image has proper priority hints and is loading efficiently.',
      })
    }
    else if (!discovery?.priorityHinted) {
      items.push({
        type: 'warning',
        icon: 'i-heroicons-arrow-up-circle',
        title: 'Add fetchpriority="high"',
        description: 'This tells the browser to prioritize loading the LCP image, which can significantly improve load times.',
      })
    }

    if (loadTime > 1000) {
      items.push({
        type: 'warning',
        icon: 'i-heroicons-photo',
        title: `Image takes ${formatMs(loadTime)} to load`,
        description: 'Consider compressing the image, using modern formats (WebP/AVIF), or serving from a CDN closer to users.',
      })
    }
  }

  // TTFB insights (applies to all)
  if (ttfb > 600) {
    items.push({
      type: 'warning',
      icon: 'i-heroicons-server',
      title: `Slow server response (${formatMs(ttfb)})`,
      description: 'Time to First Byte is high. Consider server-side caching, a CDN, or optimizing your server response time.',
    })
  }

  // Load delay insights (applies to all)
  if (loadDelay > 500) {
    items.push({
      type: 'warning',
      icon: 'i-heroicons-queue-list',
      title: `${formatMs(loadDelay)} resource delay`,
      description: 'The LCP resource started loading late. Check for render-blocking resources or consider preloading critical assets.',
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
          <motion.h1
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4 }"
            class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.1] text-gray-900 dark:text-white mb-3"
          >
            LCP Element
            <span class="text-violet-600 dark:text-violet-400">Finder</span>
          </motion.h1>
          <motion.p
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4, delay: 0.1 }"
            class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto"
          >
            Identify which element is your Largest Contentful Paint and get actionable fixes.
          </motion.p>
          <template #fallback>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.1] text-gray-900 dark:text-white mb-3">
              LCP Element
              <span class="text-violet-600 dark:text-violet-400">Finder</span>
            </h1>
            <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Identify which element is your Largest Contentful Paint and get actionable fixes.
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
          <div class="absolute -inset-4 bg-gradient-to-b from-violet-500/10 via-violet-500/5 to-transparent rounded-3xl blur-3xl pointer-events-none" />

          <div class="relative bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
            <!-- Header -->
            <div class="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800">
              <UIcon name="i-heroicons-photo" class="w-4 h-4 text-violet-500" />
              <span class="text-sm font-semibold">LCP Analysis</span>
              <span class="px-1.5 py-0.5 text-[10px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded">Core Web Vital</span>
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
                    class="bg-violet-600 hover:bg-violet-500 text-white font-medium flex-1 sm:flex-none"
                  >
                    <span class="sm:hidden">Find LCP</span>
                    <span class="hidden sm:inline">Find LCP Element</span>
                  </UButton>
                </div>
              </form>
            </div>

            <!-- Loading State -->
            <div v-if="loading" ref="loadingContainerRef" class="p-6 text-center">
              <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-violet-500 animate-spin" />
                <span class="text-sm text-violet-700 dark:text-violet-300">{{ loadingMessage }}</span>
              </div>
              <p class="mt-4 text-xs text-gray-500">
                This can take up to 2 minutes. Learn more about LCP below while we analyze your page.
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
              <!-- Hero: Screenshot + LCP Info side by side -->
              <div v-if="result.screenshot && result.element?.boundingRect" class="flex flex-col sm:flex-row gap-4 mb-6">
                <!-- Screenshot -->
                <div class="sm:w-1/2 flex justify-center">
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
                      <!-- LCP Element Highlight Overlay - uses percentages for scaling -->
                      <div
                        class="absolute border-2 border-violet-500 bg-violet-500/20 rounded-sm pointer-events-none"
                        :style="{
                          top: `${(result.element.boundingRect.top / result.screenshot.height) * 100}%`,
                          left: `${(result.element.boundingRect.left / result.screenshot.width) * 100}%`,
                          width: `${(result.element.boundingRect.width / result.screenshot.width) * 100}%`,
                          height: `${(result.element.boundingRect.height / result.screenshot.height) * 100}%`,
                        }"
                      >
                        <span class="absolute -top-5 left-0 px-1.5 py-0.5 text-[9px] font-medium bg-violet-500 text-white rounded whitespace-nowrap">
                          LCP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- LCP Info Card -->
                <div class="sm:w-1/2 flex flex-col justify-center">
                  <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4">
                    <!-- Score + Time -->
                    <div class="flex items-center gap-4">
                      <div
                        class="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg shrink-0"
                        :class="{
                          'bg-green-500': result.lcp.score >= 90,
                          'bg-orange-500': result.lcp.score >= 50 && result.lcp.score < 90,
                          'bg-red-500': result.lcp.score < 50,
                        }"
                      >
                        {{ Math.round(result.lcp.score) }}
                      </div>
                      <div>
                        <div
                          class="text-2xl font-bold tabular-nums"
                          :class="{
                            'text-green-600 dark:text-green-400': result.lcp.score >= 90,
                            'text-orange-600 dark:text-orange-400': result.lcp.score >= 50 && result.lcp.score < 90,
                            'text-red-600 dark:text-red-400': result.lcp.score < 50,
                          }"
                        >
                          {{ result.lcp.displayValue }}
                        </div>
                        <div class="text-xs text-gray-500">
                          Largest Contentful Paint
                        </div>
                      </div>
                    </div>

                    <!-- Element Info -->
                    <div class="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <div class="flex items-center gap-2 mb-2 flex-wrap">
                        <span class="px-1.5 py-0.5 text-[10px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded">
                          {{ result.element.type }}
                        </span>
                        <code class="text-xs text-gray-600 dark:text-gray-400">&lt;{{ result.element.tagName }}&gt;</code>
                        <span
                          v-if="result.framework" class="px-1.5 py-0.5 text-[10px] font-medium rounded flex items-center gap-1" :class="{
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
                      <p class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {{ result.element.snippet }}
                      </p>
                      <code v-if="result.element.selector" class="block mt-2 text-[10px] text-violet-600 dark:text-violet-400 truncate">
                        {{ result.element.selector }}
                      </code>
                    </div>

                    <!-- Discovery Checklist (if image) -->
                    <div v-if="result.discovery" class="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1.5">
                      <div class="flex items-center gap-2 text-xs">
                        <UIcon
                          :name="result.discovery.eagerlyLoaded ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                          :class="result.discovery.eagerlyLoaded ? 'text-green-500' : 'text-red-500'"
                          class="w-4 h-4"
                        />
                        <span :class="result.discovery.eagerlyLoaded ? 'text-gray-600 dark:text-gray-400' : 'text-red-600 dark:text-red-400'">
                          {{ result.discovery.eagerlyLoaded ? 'Not lazy loaded' : 'Remove loading="lazy"' }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2 text-xs">
                        <UIcon
                          :name="result.discovery.requestDiscoverable ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                          :class="result.discovery.requestDiscoverable ? 'text-green-500' : 'text-red-500'"
                          class="w-4 h-4"
                        />
                        <span :class="result.discovery.requestDiscoverable ? 'text-gray-600 dark:text-gray-400' : 'text-red-600 dark:text-red-400'">
                          {{ result.discovery.requestDiscoverable ? 'Discoverable in HTML' : 'Add preload' }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2 text-xs">
                        <UIcon
                          :name="result.discovery.priorityHinted ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                          :class="result.discovery.priorityHinted ? 'text-green-500' : 'text-orange-500'"
                          class="w-4 h-4"
                        />
                        <span :class="result.discovery.priorityHinted ? 'text-gray-600 dark:text-gray-400' : 'text-orange-600 dark:text-orange-400'">
                          {{ result.discovery.priorityHinted ? 'Has fetchpriority="high"' : 'Add fetchpriority="high"' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Insights Section -->
              <div v-if="insights.length" class="mb-6">
                <div class="flex items-center gap-2 mb-3">
                  <UIcon name="i-heroicons-light-bulb" class="w-4 h-4 text-violet-500" />
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

              <div class="grid lg:grid-cols-2 gap-6">
                <!-- Left: Timing & Threshold -->
                <div class="space-y-5">
                  <!-- Threshold Bar -->
                  <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div class="flex items-center gap-2 mb-3">
                      <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-violet-500" />
                      <span class="text-sm font-semibold">LCP Threshold</span>
                    </div>
                    <div class="relative">
                      <div class="flex h-3 rounded-full overflow-hidden shadow-inner">
                        <div class="flex-[2.5] bg-gradient-to-r from-green-400 to-green-500" />
                        <div class="flex-[1.5] bg-gradient-to-r from-orange-400 to-orange-500" />
                        <div class="flex-[2] bg-gradient-to-r from-red-400 to-red-500" />
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
                              'bg-green-500': result.lcp.score >= 90,
                              'bg-orange-500': result.lcp.score >= 50 && result.lcp.score < 90,
                              'bg-red-500': result.lcp.score < 50,
                            }"
                          />
                          <div class="w-0.5 h-2 bg-gray-400 dark:bg-gray-600" />
                          <span class="text-[10px] font-bold tabular-nums mt-0.5">{{ result.lcp.displayValue }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="flex justify-between mt-6 text-[10px] text-gray-500">
                      <span>0s</span>
                      <span class="text-green-600 font-medium">≤2.5s Good</span>
                      <span class="text-orange-500">4.0s</span>
                      <span class="text-red-500">Poor</span>
                    </div>
                  </div>

                  <!-- LCP Timing Breakdown -->
                  <div v-if="result.phases?.length" class="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div class="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                      <div class="flex items-center gap-2">
                        <UIcon name="i-heroicons-clock" class="w-4 h-4 text-violet-500" />
                        <span class="text-sm font-semibold">Time Breakdown</span>
                      </div>
                    </div>
                    <div class="p-4">
                      <!-- Stacked bar visualization -->
                      <div class="flex h-6 rounded-lg overflow-hidden mb-3">
                        <div
                          v-for="(phase, idx) in result.phases"
                          :key="phase.id"
                          :style="{ width: `${(phase.duration / result.lcp.value) * 100}%` }"
                          :class="[
                            idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-orange-500' : idx === 2 ? 'bg-green-500' : 'bg-purple-500',
                          ]"
                          class="min-w-[2px]"
                        />
                      </div>
                      <!-- Legend -->
                      <div class="space-y-1.5">
                        <div
                          v-for="(phase, idx) in result.phases"
                          :key="phase.id"
                          class="flex items-center justify-between text-xs"
                        >
                          <div class="flex items-center gap-2">
                            <span
                              :class="[
                                idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-orange-500' : idx === 2 ? 'bg-green-500' : 'bg-purple-500',
                              ]"
                              class="w-2.5 h-2.5 rounded-full"
                            />
                            <span class="text-gray-600 dark:text-gray-400">{{ phase.label }}</span>
                          </div>
                          <span class="font-medium tabular-nums">{{ formatMs(phase.duration) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Right: Opportunities -->
                <div>
                  <div class="flex items-center gap-2 mb-3">
                    <UIcon name="i-heroicons-light-bulb" class="w-4 h-4 text-orange-500" />
                    <span class="text-sm font-semibold">Opportunities</span>
                  </div>

                  <div v-if="result.opportunities.length === 0" class="text-center py-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                    <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      No major opportunities found.
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                      Your LCP is well optimized!
                    </p>
                  </div>

                  <div v-else class="space-y-2">
                    <motion.div
                      v-for="(opp, idx) in result.opportunities"
                      :key="opp.id"
                      :initial="{ opacity: 0, x: -10 }"
                      :animate="{ opacity: 1, x: 0 }"
                      :transition="{ duration: 0.2, delay: idx * 0.05 }"
                      class="p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-800 transition-colors"
                    >
                      <div class="flex items-start gap-3">
                        <div
                          v-if="opp.savings?.ms"
                          class="shrink-0 px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50"
                        >
                          <span class="text-sm font-bold text-orange-700 dark:text-orange-300 tabular-nums">
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
                    </motion.div>
                  </div>
                </div>
              </div>

              <!-- CTA Banner -->
              <div class="mt-6 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800">
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
              <ToolsToolFeedback tool-id="lcp-finder" :context="{ url: urlInput, strategy }" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Educational Content -->
    <section class="px-3 sm:px-6 lg:px-8 pb-12">
      <div class="max-w-6xl mx-auto">
        <!-- What is LCP - Two Column Layout -->
        <div class="mb-10 grid lg:grid-cols-[1fr_320px] gap-4 sm:gap-6 lg:gap-8 items-start">
          <!-- Left: Text Content -->
          <div>
            <h2 class="text-lg sm:text-xl lg:text-2xl font-bold mb-3 text-gray-900 dark:text-white">
              What is Largest Contentful Paint?
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              LCP measures how long it takes for the <strong class="text-gray-900 dark:text-white">largest visible content element</strong> to render on screen.
              This is typically a hero image, headline, or large text block. Google uses LCP as one of the three
              <a href="https://web.dev/vitals/" target="_blank" class="text-violet-600 dark:text-violet-400 hover:underline">Core Web Vitals</a>
              that directly affect search rankings.
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              A good LCP score means users perceive your page as <strong class="text-gray-900 dark:text-white">loaded quickly</strong>—even if other content is still loading in the background.
              The LCP element changes as the page loads, so the final LCP is measured when the largest element stops changing.
            </p>
          </div>

          <!-- Right: LCP Timeline Visualization -->
          <div class="relative bg-gray-900 rounded-xl p-4 overflow-hidden">
            <div class="absolute top-0 left-1/4 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl" />
            <div class="absolute bottom-0 right-1/4 w-24 h-24 bg-violet-600/15 rounded-full blur-2xl" />

            <div class="relative">
              <h3 class="text-xs font-semibold text-white mb-3 flex items-center gap-1.5">
                <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5 text-violet-400" />
                LCP Timeline
              </h3>

              <!-- Timeline visualization -->
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <div class="w-12 text-[10px] text-gray-400 text-right tabular-nums">
                    0ms
                  </div>
                  <div class="flex-1 h-1 bg-gray-800 rounded-full" />
                  <div class="text-[10px] text-gray-500">
                    Navigation
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-12 text-[10px] text-gray-400 text-right tabular-nums">
                    ~800ms
                  </div>
                  <div class="flex-1 h-1 bg-gradient-to-r from-violet-600 to-violet-400 rounded-full" style="width: 40%" />
                  <div class="text-[10px] text-violet-300">
                    FCP
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-12 text-[10px] text-green-400 text-right tabular-nums font-bold">
                    2.5s
                  </div>
                  <div class="flex-1 h-2 bg-gradient-to-r from-green-500 to-green-400 rounded-full" style="width: 70%" />
                  <div class="text-[10px] text-green-300 font-medium">
                    LCP ✓
                  </div>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-gray-800">
                <p class="text-[10px] text-gray-400">
                  LCP marks when the <strong class="text-white">largest element</strong> finishes rendering.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- LCP Phases Breakdown - Interactive Waterfall -->
        <div class="mb-12 relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div class="p-5 sm:p-6">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600">
                    <UIcon name="i-heroicons-chart-bar-square" class="w-4 h-4 text-white" />
                  </span>
                  LCP Phases Breakdown
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  See how time is spent loading your largest element
                </p>
              </div>

              <!-- Image/Text Toggle -->
              <div class="inline-flex p-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
                  :class="lcpPhaseMode === 'image' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
                  @click="lcpPhaseMode = 'image'"
                >
                  <UIcon name="i-heroicons-photo" class="w-4 h-4" />
                  <span>Image</span>
                </button>
                <button
                  type="button"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
                  :class="lcpPhaseMode === 'text' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
                  @click="lcpPhaseMode = 'text'"
                >
                  <UIcon name="i-heroicons-bars-3-bottom-left" class="w-4 h-4" />
                  <span>Text</span>
                </button>
              </div>
            </div>

            <!-- Waterfall Timeline + Wireframe Visualization -->
            <div class="mb-6">
              <!-- Timeline header with play button -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                    :class="isAnimating
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 cursor-not-allowed'
                      : 'bg-violet-600 hover:bg-violet-700 text-white'"
                    :disabled="isAnimating"
                    @click="playAnimation"
                  >
                    <UIcon :name="isAnimating ? 'i-heroicons-arrow-path' : 'i-heroicons-play'" :class="isAnimating ? 'animate-spin' : ''" class="w-4 h-4" />
                    <span>{{ isAnimating ? 'Playing...' : 'Play Animation' }}</span>
                  </button>
                  <span class="text-xs text-gray-400 dark:text-gray-500">Slowed 4× for clarity</span>
                </div>
                <span class="text-xs text-gray-500 tabular-nums">Total: {{ totalDuration }}ms</span>
              </div>

              <!-- Two column: Timeline + Wireframe -->
              <div class="grid lg:grid-cols-[1fr_200px] gap-4">
                <!-- Left: Stacked waterfall bars -->
                <div class="relative h-14 sm:h-16 lg:h-auto lg:min-h-[180px] rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <!-- Timeline labels -->
                  <div class="absolute inset-x-0 top-0 flex justify-between px-3 pt-1">
                    <span class="text-[10px] text-gray-400 dark:text-gray-500">0ms</span>
                    <span class="text-[10px] text-gray-400 dark:text-gray-500">LCP</span>
                  </div>

                  <!-- Phase bars - horizontal on mobile, vertical on desktop -->
                  <div class="absolute inset-x-3 bottom-2 top-5 flex lg:flex-col items-stretch gap-0.5">
                    <div
                      v-for="(phase, idx) in lcpPhases"
                      :key="phase.id"
                      class="relative rounded cursor-pointer transition-all duration-200 flex items-center justify-center group"
                      :class="[
                        phaseHovered && phaseHovered !== phase.id ? 'opacity-40' : 'opacity-100',
                      ]"
                      :style="{
                        width: isAnimating && animationProgress[idx] !== undefined
                          ? `${phase.percentage * animationProgress[idx]}%`
                          : `${phase.percentage}%`,
                        height: '100%',
                        backgroundColor: `rgba(139, 92, 246, ${phase.intensity / 100})`,
                      }"
                      @mouseenter="phaseHovered = phase.id"
                      @mouseleave="phaseHovered = null"
                    >
                      <!-- Phase label inside bar -->
                      <span
                        v-if="phase.percentage >= 15 && (!isAnimating || animationProgress[idx] > 0.5)"
                        class="text-[10px] sm:text-xs font-semibold text-white drop-shadow whitespace-nowrap"
                      >
                        {{ phase.shortLabel }}
                      </span>

                      <!-- Duration tooltip on hover -->
                      <div class="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-gray-900 dark:bg-gray-700 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {{ phase.duration }}ms
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Right: Wireframe Preview -->
                <div class="hidden lg:block">
                  <div class="relative h-[180px] rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
                    <!-- Browser chrome -->
                    <div class="h-5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-2 gap-1">
                      <span class="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                      <span class="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                      <span class="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                      <div class="flex-1 mx-2 h-2.5 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>

                    <!-- Page content -->
                    <div class="p-2 space-y-2">
                      <!-- Header skeleton -->
                      <div
                        class="h-3 rounded transition-all duration-500"
                        :class="{
                          'bg-gray-100 dark:bg-gray-800': currentAnimationPhase === null || currentAnimationPhase === 'ttfb',
                          'bg-gray-200 dark:bg-gray-700': currentAnimationPhase && currentAnimationPhase !== 'ttfb' && currentAnimationPhase !== 'complete',
                          'bg-gray-800 dark:bg-gray-200': currentAnimationPhase === 'complete',
                        }"
                        :style="{ width: currentAnimationPhase === null || currentAnimationPhase === 'ttfb' ? '0%' : '60%' }"
                      />

                      <!-- Hero image placeholder (LCP element) -->
                      <div
                        class="h-16 rounded transition-all duration-500 relative overflow-hidden"
                        :class="{
                          'bg-gray-100 dark:bg-gray-800': currentAnimationPhase === null || currentAnimationPhase === 'ttfb',
                          'bg-gray-200 dark:bg-gray-700': currentAnimationPhase === 'loadDelay',
                          'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700': currentAnimationPhase === 'loadDuration',
                          'bg-violet-100 dark:bg-violet-900/30': currentAnimationPhase === 'renderDelay',
                          'bg-gradient-to-br from-violet-400 via-purple-500 to-violet-600': currentAnimationPhase === 'complete',
                        }"
                      >
                        <!-- Loading shimmer during loadDuration -->
                        <div
                          v-if="currentAnimationPhase === 'loadDuration'"
                          class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
                        />
                        <!-- Rendered image when complete -->
                        <div
                          v-if="currentAnimationPhase === 'complete'"
                          class="absolute inset-0 flex items-center justify-center"
                        >
                          <UIcon name="i-heroicons-photo" class="w-8 h-8 text-white/80" />
                        </div>
                        <!-- Phase indicator -->
                        <div
                          v-if="currentAnimationPhase && currentAnimationPhase !== 'complete'"
                          class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-medium bg-black/50 text-white"
                        >
                          {{ currentAnimationPhase === 'ttfb' ? 'Waiting...' : currentAnimationPhase === 'loadDelay' ? 'Discovering...' : currentAnimationPhase === 'loadDuration' ? 'Loading...' : 'Rendering...' }}
                        </div>
                      </div>

                      <!-- Text lines - skeleton to rendered -->
                      <div class="space-y-1.5">
                        <div
                          class="h-2 rounded transition-all duration-500"
                          :class="{
                            'bg-gray-100 dark:bg-gray-800': currentAnimationPhase === null || currentAnimationPhase === 'ttfb',
                            'bg-gray-200 dark:bg-gray-700': currentAnimationPhase && currentAnimationPhase !== 'ttfb' && currentAnimationPhase !== 'complete',
                            'bg-gray-700 dark:bg-gray-300': currentAnimationPhase === 'complete',
                          }"
                          :style="{ width: currentAnimationPhase === null || currentAnimationPhase === 'ttfb' ? '0%' : '100%' }"
                        />
                        <div
                          class="h-2 rounded transition-all duration-500"
                          :class="{
                            'bg-gray-100 dark:bg-gray-800': currentAnimationPhase === null || currentAnimationPhase === 'ttfb',
                            'bg-gray-200 dark:bg-gray-700': currentAnimationPhase && currentAnimationPhase !== 'ttfb' && currentAnimationPhase !== 'complete',
                            'bg-gray-600 dark:bg-gray-400': currentAnimationPhase === 'complete',
                          }"
                          :style="{ width: currentAnimationPhase === null || currentAnimationPhase === 'ttfb' ? '0%' : '80%' }"
                        />
                        <div
                          class="h-2 rounded transition-all duration-500"
                          :class="{
                            'bg-gray-100 dark:bg-gray-800': currentAnimationPhase === null || currentAnimationPhase === 'ttfb',
                            'bg-gray-200 dark:bg-gray-700': currentAnimationPhase && currentAnimationPhase !== 'ttfb' && currentAnimationPhase !== 'complete',
                            'bg-gray-500 dark:bg-gray-500': currentAnimationPhase === 'complete',
                          }"
                          :style="{ width: currentAnimationPhase === null || currentAnimationPhase === 'ttfb' ? '0%' : '90%' }"
                        />
                      </div>
                    </div>

                    <!-- Current phase label -->
                    <div class="absolute bottom-0 inset-x-0 bg-gray-900/90 dark:bg-black/80 px-2 py-1">
                      <p class="text-[9px] text-center font-medium text-white truncate">
                        {{ currentAnimationPhase === null ? 'Click Play to start'
                          : currentAnimationPhase === 'ttfb' ? '⏳ Waiting for server response...'
                            : currentAnimationPhase === 'loadDelay' ? '🔍 Browser discovering LCP image...'
                              : currentAnimationPhase === 'loadDuration' ? '📥 Downloading LCP image...'
                                : currentAnimationPhase === 'renderDelay' ? '🎨 Rendering element...'
                                  : '✅ LCP Complete!' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Legend -->
              <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-3">
                <div
                  v-for="phase in lcpPhases"
                  :key="phase.id"
                  class="flex items-center gap-1.5 cursor-pointer transition-opacity"
                  :class="phaseHovered && phaseHovered !== phase.id ? 'opacity-40' : 'opacity-100'"
                  @mouseenter="phaseHovered = phase.id"
                  @mouseleave="phaseHovered = null"
                >
                  <span
                    class="w-3 h-3 rounded"
                    :style="{ backgroundColor: `rgba(139, 92, 246, ${phase.intensity / 100})` }"
                  />
                  <span class="text-xs text-gray-600 dark:text-gray-400">{{ phase.shortLabel }}</span>
                  <span class="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{{ phase.duration }}ms</span>
                </div>
              </div>
            </div>

            <!-- Phase Cards Grid -->
            <div class="grid sm:grid-cols-2 gap-3">
              <div
                v-for="phase in lcpPhases"
                :key="phase.id"
                class="group relative rounded-xl border transition-all duration-200 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                :class="phaseHovered === phase.id ? 'ring-2 ring-violet-500' : ''"
                @mouseenter="phaseHovered = phase.id"
                @mouseleave="phaseHovered = null"
              >
                <div class="p-4">
                  <!-- Phase header -->
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-flex items-center justify-center w-8 h-8 rounded-lg"
                        :style="{ backgroundColor: `rgba(139, 92, 246, ${phase.intensity / 100})` }"
                      >
                        <UIcon :name="phase.icon" class="w-4 h-4 text-white" />
                      </span>
                      <div>
                        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                          {{ phase.label }}
                        </h3>
                        <p class="text-xs text-gray-500">
                          Phase {{ lcpPhases.indexOf(phase) + 1 }} of {{ lcpPhases.length }}
                        </p>
                      </div>
                    </div>
                    <div class="text-right">
                      <span class="text-lg font-bold tabular-nums text-violet-600 dark:text-violet-400">{{ phase.duration }}ms</span>
                      <p class="text-[10px] text-gray-500">
                        {{ phase.percentage }}%
                      </p>
                    </div>
                  </div>

                  <!-- Description -->
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                    {{ phase.description }}
                  </p>

                  <!-- Optimization tips -->
                  <div class="space-y-1.5">
                    <p class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                      How to optimize
                    </p>
                    <ul class="space-y-1">
                      <li
                        v-for="(tip, tipIdx) in phase.tips.slice(0, 2)"
                        :key="tipIdx"
                        class="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400"
                      >
                        <UIcon name="i-heroicons-check-circle" class="w-3.5 h-3.5 mt-0.5 shrink-0 text-violet-500" />
                        <span>{{ tip }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- Text LCP note -->
            <Transition
              enter-active-class="transition-all duration-300"
              enter-from-class="opacity-0 translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-200"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-2"
            >
              <div
                v-if="lcpPhaseMode === 'text'"
                class="mt-4 p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800"
              >
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                  <div>
                    <p class="text-sm font-medium text-violet-700 dark:text-violet-300">
                      Text LCP has fewer phases
                    </p>
                    <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      When your LCP is text, there's no image to load. <strong class="text-gray-900 dark:text-white">Render Delay</strong> becomes the main bottleneck—usually from JavaScript blocking the main thread or web fonts loading.
                    </p>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- Source attribution -->
            <p class="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-6">
              Based on <a href="https://www.debugbear.com/docs/lcp-by-phase" target="_blank" class="text-violet-600 dark:text-violet-400 hover:underline">DebugBear</a> and <a href="https://web.dev/articles/optimize-lcp" target="_blank" class="text-violet-600 dark:text-violet-400 hover:underline">web.dev</a>
            </p>
          </div>
        </div>

        <!-- LCP Thresholds Explanation -->
        <div class="mb-12 p-4 sm:p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <h3 class="text-sm sm:text-base font-bold mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-violet-500" />
            LCP Scoring Thresholds
          </h3>

          <div class="grid lg:grid-cols-2 gap-4 sm:gap-5">
            <!-- Explanation -->
            <div class="space-y-3 text-xs text-gray-600 dark:text-gray-400">
              <p>
                Google's LCP thresholds are based on <strong class="text-gray-900 dark:text-white">real user data</strong> from millions of websites.
                To pass Core Web Vitals, <strong class="text-gray-900 dark:text-white">75% of page visits</strong> must have an LCP under 2.5 seconds.
              </p>
              <div class="grid grid-cols-3 gap-1.5 sm:gap-2 mt-3">
                <div class="p-2 sm:p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
                  <div class="text-sm sm:text-lg font-bold text-green-600 dark:text-green-400">
                    ≤2.5s
                  </div>
                  <div class="text-[9px] sm:text-[10px] font-medium text-green-700 dark:text-green-300">
                    Good
                  </div>
                </div>
                <div class="p-2 sm:p-2.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-center">
                  <div class="text-sm sm:text-lg font-bold text-orange-600 dark:text-orange-400">
                    2.5-4s
                  </div>
                  <div class="text-[9px] sm:text-[10px] font-medium text-orange-700 dark:text-orange-300">
                    Needs Work
                  </div>
                </div>
                <div class="p-2 sm:p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
                  <div class="text-sm sm:text-lg font-bold text-red-600 dark:text-red-400">
                    &gt;4s
                  </div>
                  <div class="text-[9px] sm:text-[10px] font-medium text-red-700 dark:text-red-300">
                    Poor
                  </div>
                </div>
              </div>
            </div>

            <!-- SVG Graph -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">
                LCP Score Distribution
              </div>
              <svg viewBox="0 0 300 120" class="w-full h-auto">
                <!-- Background zones -->
                <rect x="40" y="10" width="75" height="80" fill="#22c55e" fill-opacity="0.1" />
                <rect x="115" y="10" width="55" height="80" fill="#f97316" fill-opacity="0.1" />
                <rect x="170" y="10" width="120" height="80" fill="#ef4444" fill-opacity="0.1" />

                <!-- Axes -->
                <line x1="40" y1="90" x2="290" y2="90" stroke="currentColor" class="text-gray-300 dark:text-gray-600" stroke-width="1" />

                <!-- Threshold lines -->
                <line x1="115" y1="10" x2="115" y2="90" stroke="#22c55e" stroke-width="1" stroke-dasharray="4,4" />
                <line x1="170" y1="10" x2="170" y2="90" stroke="#f97316" stroke-width="1" stroke-dasharray="4,4" />

                <!-- X-axis labels -->
                <text x="40" y="105" text-anchor="middle" class="text-[9px] fill-gray-500">0s</text>
                <text x="115" y="105" text-anchor="middle" class="text-[9px] fill-green-600 font-medium">2.5s</text>
                <text x="170" y="105" text-anchor="middle" class="text-[9px] fill-orange-500 font-medium">4.0s</text>
                <text x="250" y="105" text-anchor="middle" class="text-[9px] fill-gray-500">8s</text>

                <!-- Zone labels -->
                <text x="77" y="55" text-anchor="middle" class="text-[10px] fill-green-600 font-medium">Good</text>
                <text x="142" y="55" text-anchor="middle" class="text-[10px] fill-orange-500 font-medium">Meh</text>
                <text x="220" y="55" text-anchor="middle" class="text-[10px] fill-red-500 font-medium">Poor</text>
              </svg>
            </div>
          </div>

          <p class="text-[11px] text-gray-500 dark:text-gray-500 pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
            Source: <a href="https://web.dev/lcp/" target="_blank" class="text-violet-600 dark:text-violet-400 hover:underline">web.dev/lcp</a>
          </p>
        </div>

        <!-- Common LCP Elements -->
        <div class="mb-12">
          <div class="flex items-center gap-3 mb-5">
            <div class="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-600/10 ring-1 ring-violet-500/20">
              <UIcon name="i-heroicons-photo" class="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-bold tracking-tight">
                Common LCP Elements
              </h3>
              <p class="text-xs text-gray-500">
                What typically becomes the LCP element
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div class="p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div class="flex items-center gap-2 mb-1.5 sm:mb-2">
                <span class="w-2 h-2 rounded-full bg-violet-500" />
                <span class="text-xs sm:text-sm font-semibold">Hero Images</span>
              </div>
              <p class="text-[10px] sm:text-xs text-gray-500">
                Large banner or header images above the fold
              </p>
            </div>
            <div class="p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div class="flex items-center gap-2 mb-1.5 sm:mb-2">
                <span class="w-2 h-2 rounded-full bg-violet-500" />
                <span class="text-xs sm:text-sm font-semibold">H1 Headlines</span>
              </div>
              <p class="text-[10px] sm:text-xs text-gray-500">
                Large text headings on text-heavy pages
              </p>
            </div>
            <div class="p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div class="flex items-center gap-2 mb-1.5 sm:mb-2">
                <span class="w-2 h-2 rounded-full bg-violet-500" />
                <span class="text-xs sm:text-sm font-semibold">Background Images</span>
              </div>
              <p class="text-[10px] sm:text-xs text-gray-500">
                CSS background-image on large containers
              </p>
            </div>
            <div class="p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div class="flex items-center gap-2 mb-1.5 sm:mb-2">
                <span class="w-2 h-2 rounded-full bg-violet-500" />
                <span class="text-xs sm:text-sm font-semibold">Video Posters</span>
              </div>
              <p class="text-[10px] sm:text-xs text-gray-500">
                Poster images for &lt;video&gt; elements
              </p>
            </div>
          </div>
        </div>

        <!-- What Affects LCP -->
        <div class="mb-12">
          <div class="flex items-center gap-3 mb-5">
            <div class="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-600/10 ring-1 ring-violet-500/20">
              <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-bold tracking-tight">
                What Affects LCP
              </h3>
              <p class="text-xs text-gray-500">
                Common issues that slow down your LCP
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            <NuxtLink
              to="/learn-lighthouse/lcp/slow-server-response"
              class="group p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700 transition-all"
            >
              <div class="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <span class="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-violet-600 shrink-0" />
                <span class="text-xs sm:text-sm font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Slow Server</span>
              </div>
              <p class="text-[10px] sm:text-xs text-gray-500 leading-relaxed">
                Server response delays everything
              </p>
            </NuxtLink>

            <NuxtLink
              to="/learn-lighthouse/lcp/render-blocking-resources"
              class="group p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700 transition-all"
            >
              <div class="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <span class="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-violet-500 shrink-0" />
                <span class="text-xs sm:text-sm font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Render Blocking</span>
              </div>
              <p class="text-[10px] sm:text-xs text-gray-500 leading-relaxed">
                CSS and sync JS block painting
              </p>
            </NuxtLink>

            <NuxtLink
              to="/learn-lighthouse/lcp/prioritize-lcp-image"
              class="group p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700 transition-all"
            >
              <div class="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <span class="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-violet-400 shrink-0" />
                <span class="text-xs sm:text-sm font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">No Priority</span>
              </div>
              <p class="text-[10px] sm:text-xs text-gray-500 leading-relaxed">
                LCP image loads too late
              </p>
            </NuxtLink>

            <NuxtLink
              to="/learn-lighthouse/lcp/lcp-lazy-loaded"
              class="group p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700 transition-all"
            >
              <div class="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <span class="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-red-500 shrink-0" />
                <span class="text-xs sm:text-sm font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Lazy Loaded</span>
              </div>
              <p class="text-[10px] sm:text-xs text-gray-500 leading-relaxed">
                Critical image has loading="lazy"
              </p>
            </NuxtLink>

            <NuxtLink
              to="/learn-lighthouse/lcp/client-side-rendering"
              class="group p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700 transition-all"
            >
              <div class="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <span class="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-violet-300 shrink-0" />
                <span class="text-xs sm:text-sm font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">CSR Delay</span>
              </div>
              <p class="text-[10px] sm:text-xs text-gray-500 leading-relaxed">
                JS must execute before LCP renders
              </p>
            </NuxtLink>

            <NuxtLink
              to="/learn-lighthouse/cls/web-fonts-causing-foit"
              class="group p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700 transition-all"
            >
              <div class="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <span class="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-orange-400 shrink-0" />
                <span class="text-xs sm:text-sm font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Custom Fonts</span>
              </div>
              <p class="text-[10px] sm:text-xs text-gray-500 leading-relaxed">
                Web fonts delay text LCP
              </p>
            </NuxtLink>
          </div>
        </div>

        <!-- Quick Fixes Checklist -->
        <div class="mb-12">
          <div class="flex items-center gap-3 mb-5">
            <div class="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/10 ring-1 ring-green-500/20">
              <UIcon name="i-heroicons-rocket-launch" class="w-4 h-4 text-green-500" />
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-bold tracking-tight">
                Quick LCP Fixes
              </h3>
              <p class="text-xs text-gray-500">
                High-impact optimizations you can implement today
              </p>
            </div>
          </div>

          <div class="grid sm:grid-cols-2 gap-3 sm:gap-4">
            <div class="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-gray-900 border border-green-200 dark:border-green-900/50">
              <h4 class="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                <UIcon name="i-heroicons-photo" class="w-4 h-4 text-green-500" />
                For Image LCP
              </h4>
              <ul class="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs text-gray-600 dark:text-gray-400">
                <li class="flex items-start gap-1.5 sm:gap-2">
                  <UIcon name="i-heroicons-check-circle" class="w-3.5 sm:w-4 h-3.5 sm:h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Add <code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] sm:text-[10px]">fetchpriority="high"</code></span>
                </li>
                <li class="flex items-start gap-1.5 sm:gap-2">
                  <UIcon name="i-heroicons-check-circle" class="w-3.5 sm:w-4 h-3.5 sm:h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Remove <code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] sm:text-[10px]">loading="lazy"</code></span>
                </li>
                <li class="flex items-start gap-1.5 sm:gap-2">
                  <UIcon name="i-heroicons-check-circle" class="w-3.5 sm:w-4 h-3.5 sm:h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Preload with <code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] sm:text-[10px]">rel="preload"</code></span>
                </li>
                <li class="flex items-start gap-1.5 sm:gap-2">
                  <UIcon name="i-heroicons-check-circle" class="w-3.5 sm:w-4 h-3.5 sm:h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>Use WebP or AVIF formats</span>
                </li>
              </ul>
            </div>

            <div class="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-gray-900 border border-violet-200 dark:border-violet-900/50">
              <h4 class="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                <UIcon name="i-heroicons-code-bracket" class="w-4 h-4 text-violet-500" />
                For Text LCP
              </h4>
              <ul class="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs text-gray-600 dark:text-gray-400">
                <li class="flex items-start gap-1.5 sm:gap-2">
                  <UIcon name="i-heroicons-check-circle" class="w-3.5 sm:w-4 h-3.5 sm:h-4 text-violet-500 shrink-0 mt-0.5" />
                  <span>Preload critical fonts</span>
                </li>
                <li class="flex items-start gap-1.5 sm:gap-2">
                  <UIcon name="i-heroicons-check-circle" class="w-3.5 sm:w-4 h-3.5 sm:h-4 text-violet-500 shrink-0 mt-0.5" />
                  <span>Use <code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] sm:text-[10px]">font-display: optional</code></span>
                </li>
                <li class="flex items-start gap-1.5 sm:gap-2">
                  <UIcon name="i-heroicons-check-circle" class="w-3.5 sm:w-4 h-3.5 sm:h-4 text-violet-500 shrink-0 mt-0.5" />
                  <span>Inline critical CSS</span>
                </li>
                <li class="flex items-start gap-1.5 sm:gap-2">
                  <UIcon name="i-heroicons-check-circle" class="w-3.5 sm:w-4 h-3.5 sm:h-4 text-violet-500 shrink-0 mt-0.5" />
                  <span>Remove render-blocking scripts</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- CTA Section -->
        <div class="relative rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 p-4 sm:p-6 overflow-hidden">
          <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div class="relative flex flex-col items-center text-center sm:text-left sm:flex-row sm:justify-between gap-4">
            <div>
              <h3 class="text-base sm:text-lg font-bold text-white mb-1">
                Check LCP Across Your Entire Site
              </h3>
              <p class="text-xs sm:text-sm text-violet-200 max-w-md">
                Your homepage might be fast, but what about product pages, blog posts, and landing pages?
              </p>
            </div>
            <div class="flex flex-wrap gap-2 justify-center sm:justify-end">
              <UButton to="/guide/getting-started/unlighthouse-cli" variant="solid" size="sm">
                Get Started
              </UButton>
              <UButton to="/learn-lighthouse/lcp" variant="outline" size="sm">
                LCP Deep Dive
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Floating Loading Indicator -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4"
      >
        <div
          v-if="showFloatingLoader"
          class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-full bg-white dark:bg-gray-800 shadow-xl ring-1 ring-gray-200 dark:ring-gray-700"
        >
          <div class="relative">
            <div class="w-5 h-5 rounded-full border-2 border-violet-200 dark:border-violet-800" />
            <div class="absolute inset-0 w-5 h-5 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
          </div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ loadingMessage }}</span>
          <span class="text-xs text-gray-400">~2 min</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 1s ease-in-out infinite;
}
</style>
