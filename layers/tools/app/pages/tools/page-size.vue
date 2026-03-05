<script setup lang="ts">
definePageMeta({
  breadcrumb: {
    icon: 'i-heroicons-scale',
    ariaLabel: 'Page Size Checker',
  },
})

const faqs = [
  {
    question: 'What is a good page size?',
    answer: 'Under 1 MB total transfer size is excellent. 1-2 MB is acceptable for content-rich pages. 2-3 MB is heavy and will impact mobile users. Over 3 MB is considered poor — the median web page is around 2.5 MB on mobile, but that doesn\'t mean it\'s good. Aim to be in the bottom 25th percentile.',
  },
  {
    question: 'How does page size affect performance?',
    answer: 'Larger pages take longer to download (hurting LCP) and require more CPU to parse JavaScript (hurting TBT and INP). 50% of mobile sites take over 14s to become interactive, with a median mobile Total Blocking Time (TBT) of 1,916ms. Every 100 KB of JavaScript costs roughly 100ms of parse time on mid-range phones. Images are less CPU-expensive than JavaScript byte-for-byte.',
  },
  {
    question: 'What is the average web page size in 2026?',
    answer: 'According to HTTP Archive data, the median mobile page weighs about 2,559 KB (~2.5 MB), growing roughly 10% year-over-year. Desktop median is about 2,862 KB. At the 90th percentile, pages exceed 8 MB. JavaScript and images are the two largest contributors.',
  },
  {
    question: 'Does page size affect SEO?',
    answer: 'Indirectly, yes. Page size impacts Core Web Vitals (LCP, INP, CLS). While only 48% of mobile sites pass all CWVs and speed has a weak direct correlation to organic rank, a 1-second delay can lead to a 7% drop in conversions. Very large pages also affect crawl budget and have a larger carbon footprint — a median 2.5MB page correlates linearly with higher energy use in data transfer.',
  },
  {
    question: 'What is the difference between transfer size and uncompressed size?',
    answer: 'Transfer size is the actual bytes sent over the network after gzip or brotli compression. Uncompressed size is the raw content before compression. Text-based resources (HTML, CSS, JS, JSON) typically compress 3-5x. Images are already compressed so transfer and uncompressed sizes are similar.',
  },
  {
    question: 'How do I reduce my page size?',
    answer: 'Compress images with AVIF/WebP (30-50% savings over JPEG). Tree-shake and code-split JavaScript. Remove unused CSS. Enable brotli compression on your server. Lazy-load images below the fold. Audit third-party scripts — they often account for 30-50% of total page weight.',
  },
]

useToolSeo({
  title: 'Page Size Checker - Test Page Weight & Resource Breakdown Free',
  description: 'Free page size checker. Analyze total page weight, resource breakdown by type, third-party script weight, unused code, and compression efficiency. Compare against HTTP Archive percentiles.',
  faqs,
})

const { trackUse } = useToolTracking('page-size')

const { current: loadingMessage, progress: loadingProgress, start: startMessages, stop: stopMessages } = useLoadingMessages([
  'Connecting to PageSpeed Insights API...',
  'Tip: The median page weighs 2.5 MB on mobile',
  'Running Lighthouse audit on your page...',
  'Tip: JavaScript costs more than images per byte',
  'Analyzing resource breakdown...',
  'Tip: Enable brotli compression for best savings',
  'Measuring total page weight...',
  'Tip: Third parties often account for 30-50% of weight',
  'Checking compression efficiency...',
  'Tip: AVIF images save 50% over JPEG',
  'Scanning for unused code...',
  'Generating page size report...',
], 3000)

// State
const urlInput = ref('')
const strategy = ref<'mobile' | 'desktop'>('mobile')
const { loading, error, result, run: runBg } = useToolBackgroundRequest<PageSizeResult>('page-size', {
  title: 'Page Size',
  path: '/tools/page-size',
})
const loadingContainerRef = ref<HTMLElement | null>(null)

interface PageSizeResult {
  url: string
  fetchedUrl: string
  timestamp: number
  strategy: 'mobile' | 'desktop'
  performanceScore: number
  totalSize: number
  totalUncompressedSize: number
  totalRequests: number
  compressionRatio: number
  resources: Array<{ type: string, label: string, count: number, size: number }>
  largestResources: Array<{ url: string, size: number }>
  thirdPartySize: number
  thirdPartyPercent: number
  thirdPartyDomains: Array<{ entity: string, size: number, mainThreadTime: number }>
  unusedBytes: number
  unusedPercent: number
  screenshot: { data: string, width: number, height: number } | null
}

const { showFloatingLoader } = useToolFloatingLoader(loading, loadingContainerRef)
const { syncParam } = useToolUrlSync(urlInput, {
  extraParams: { strategy: strategy as Ref<string> },
  onReady: () => analyze(),
})
syncParam('strategy', strategy as Ref<string>, 'mobile')

watch(loading, isLoading => isLoading ? startMessages() : stopMessages())

function analyze() {
  if (!urlInput.value.trim() || loading.value)
    return

  runBg(
    () => $fetch<PageSizeResult>('/api/tools/page-size', {
      query: { url: urlInput.value, strategy: strategy.value },
    }),
    urlInput.value,
    () => trackUse(),
  )
}

function getWeightColor(bytes: number): string {
  if (bytes < 1048576)
    return 'text-green-500' // < 1MB
  if (bytes < 3145728)
    return 'text-orange-500' // < 3MB
  return 'text-red-500'
}

function getWeightBg(bytes: number): string {
  if (bytes < 1048576)
    return 'bg-green-500'
  if (bytes < 3145728)
    return 'bg-orange-500'
  return 'bg-red-500'
}

function getWeightLabel(bytes: number): string {
  if (bytes < 1048576)
    return 'Lightweight'
  if (bytes < 2097152)
    return 'Average'
  if (bytes < 3145728)
    return 'Heavy'
  return 'Very Heavy'
}

// HTTP Archive percentiles (2025-2026 mobile data, in KB)
const httpArchivePercentiles = [
  { label: 'P10', kb: 489 },
  { label: 'P25', kb: 1024 },
  { label: 'P50', kb: 2559 },
  { label: 'P75', kb: 5120 },
  { label: 'P90', kb: 8300 },
]

function getPercentilePosition(bytes: number): { percentile: string, position: number } {
  const kb = bytes / 1024
  // Interpolate between percentile breakpoints for smooth marker positioning
  const breakpoints = [
    { pct: 0, kb: 0 },
    { pct: 10, kb: 489 },
    { pct: 25, kb: 1024 },
    { pct: 50, kb: 2559 },
    { pct: 75, kb: 5120 },
    { pct: 90, kb: 8300 },
    { pct: 100, kb: 12000 },
  ]

  let position = 95
  for (let i = 1; i < breakpoints.length; i++) {
    if (kb <= breakpoints[i].kb) {
      const prev = breakpoints[i - 1]
      const curr = breakpoints[i]
      const ratio = (kb - prev.kb) / (curr.kb - prev.kb)
      position = prev.pct + ratio * (curr.pct - prev.pct)
      break
    }
  }

  let percentile: string
  if (position <= 10)
    percentile = 'top 10%'
  else if (position <= 25)
    percentile = 'top 25%'
  else if (position <= 50)
    percentile = 'top 50%'
  else if (position <= 75)
    percentile = 'top 75%'
  else
    percentile = 'bottom 10%'

  return { percentile, position: Math.min(position, 95) }
}

function truncateUrl(url: string, maxLen = 60): string {
  try {
    const u = new URL(url)
    const path = u.pathname + u.search
    if (path.length <= maxLen)
      return path
    return `${path.slice(0, maxLen - 3)}...`
  }
  catch {
    return url.length <= maxLen ? url : `${url.slice(0, maxLen - 3)}...`
  }
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
}

const visualResources = computed(() => {
  if (!result.value)
    return []
  return result.value.resources.filter(r => r.type !== 'total' && r.type !== 'third-party' && r.size > 0)
})
</script>

<template>
  <div class="min-h-screen">
    <ToolFloatingLoader :show="loading && showFloatingLoader" :message="loadingMessage" />

    <ToolPageHero
      title="Page Size"
      accent="Checker"
      description="Analyze page weight, resource breakdown, third-party scripts, and unused code with real Lighthouse data."
      color="green"
    />

    <ToolCard icon="i-heroicons-scale" title="Page Size Analysis" color="green" max-width="max-w-5xl">
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
            <ToolDeviceToggle v-model="strategy" :disabled="loading" />
            <UButton type="submit" :loading="loading" color="primary" size="sm">
              <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 mr-1" />
              Check Size
            </UButton>
          </div>
        </form>
      </div>

      <!-- Loading -->
      <ToolLoadingPill v-if="loading" ref="loadingContainerRef" :progress="loadingProgress" :message="loadingMessage" color="green" hint="This can take up to 2 minutes. The API runs a full Lighthouse audit." />

      <!-- Error -->
      <ToolError :error="error" />

      <!-- Empty State -->
      <ToolEmptyState v-if="!result && !loading && !error" icon="i-heroicons-scale" message="Enter a URL to check page size" />

      <!-- Results -->
      <div v-if="result" class="p-4 sm:p-6 space-y-6">
        <!-- URL info -->
        <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2 min-w-0">
          <UIcon name="i-heroicons-globe-alt" class="w-4 h-4 text-gray-400 shrink-0" />
          <span class="text-sm text-gray-700 dark:text-gray-300 truncate">{{ result.fetchedUrl }}</span>
          <span class="px-2 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full shrink-0">
            {{ result.strategy }}
          </span>
        </div>

        <!-- Hero Stat: Total Page Weight -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.3 }"
          class="text-center p-6 rounded-xl bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 border border-gray-200 dark:border-gray-800"
        >
          <p class="text-5xl sm:text-6xl font-black tracking-tight" :class="getWeightColor(result.totalSize)">
            {{ formatBytes(result.totalSize) }}
          </p>
          <p class="text-sm text-gray-500 mt-2">
            Total Transfer Size
          </p>
          <div class="mt-3 inline-flex items-center gap-2">
            <span
              class="px-3 py-1 rounded-full text-xs font-semibold text-white"
              :class="getWeightBg(result.totalSize)"
            >
              {{ getWeightLabel(result.totalSize) }}
            </span>
            <span class="text-xs text-gray-500">
              {{ getPercentilePosition(result.totalSize).percentile }} of all websites
            </span>
          </div>
        </div>

        <!-- Percentile Comparison -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.3, delay: 0.1 }"
        >
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-cyan-500" />
            HTTP Archive Comparison
          </h2>
          <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <!-- Percentile scale -->
            <div class="relative h-6 mb-2">
              <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-green-400 via-orange-400 to-red-500" />
              <!-- Your position marker -->
              <div
                class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-gray-900 dark:border-white shadow-md z-10"
                :style="{ left: `${Math.min(getPercentilePosition(result.totalSize).position, 95)}%` }"
              />
            </div>
            <div class="flex justify-between text-[10px] text-gray-500 mt-1">
              <span v-for="p in httpArchivePercentiles" :key="p.label" class="text-center">
                <span class="block font-medium">{{ p.label }}</span>
                <span>{{ formatBytes(p.kb * 1024) }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Summary Stats -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.3, delay: 0.15 }"
          class="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ result.totalRequests }}
            </p>
            <p class="text-xs text-gray-500">
              Requests
            </p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ formatBytes(result.totalUncompressedSize) }}
            </p>
            <p class="text-xs text-gray-500">
              Uncompressed
            </p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ result.compressionRatio.toFixed(1) }}x
            </p>
            <p class="text-xs text-gray-500">
              Compression Ratio
            </p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
            <p class="text-lg font-bold" :class="result.performanceScore >= 90 ? 'text-green-500' : result.performanceScore >= 50 ? 'text-orange-500' : 'text-red-500'">
              {{ result.performanceScore }}
            </p>
            <p class="text-xs text-gray-500">
              Perf Score
            </p>
          </div>
        </div>

        <!-- Resource Breakdown -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.3, delay: 0.2 }"
        >
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-chart-pie" class="w-4 h-4 text-cyan-500" />
            Resource Breakdown
          </h2>

          <!-- Stacked bar -->
          <div class="h-4 rounded-full overflow-hidden flex mb-4">
            <div
              v-for="res in visualResources"
              :key="res.type"
              :class="resourceColors[res.type] || 'bg-gray-400'"
              :style="{ width: `${(res.size / result.totalSize) * 100}%` }"
              class="h-full"
              :title="`${res.label}: ${formatBytes(res.size)}`"
            />
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div
              v-for="res in visualResources"
              :key="res.type"
              class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
            >
              <div class="flex items-center gap-2 mb-1">
                <div class="w-2.5 h-2.5 rounded-full" :class="[resourceColors[res.type] || 'bg-gray-400']" />
                <span class="text-xs font-medium text-gray-900 dark:text-white">{{ res.label }}</span>
              </div>
              <p class="text-sm font-bold text-gray-900 dark:text-white">
                {{ formatBytes(res.size) }}
              </p>
              <p class="text-[10px] text-gray-500">
                {{ res.count }} {{ res.count === 1 ? 'request' : 'requests' }} · {{ result.totalSize > 0 ? ((res.size / result.totalSize) * 100).toFixed(0) : 0 }}%
              </p>
            </div>
          </div>
        </div>

        <!-- Largest Resources -->
        <div
          v-if="result.largestResources.length"
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.3, delay: 0.25 }"
        >
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-arrow-trending-up" class="w-4 h-4 text-cyan-500" />
            Largest Resources
          </h2>
          <div class="rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th class="text-left p-2 font-medium text-gray-600 dark:text-gray-400">
                    URL
                  </th>
                  <th class="text-right p-2 font-medium text-gray-600 dark:text-gray-400 w-24">
                    Size
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(res, idx) in result.largestResources"
                  :key="idx"
                  class="border-t border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td class="p-2 font-mono truncate max-w-[400px]" :title="res.url">
                    {{ truncateUrl(res.url) }}
                  </td>
                  <td class="p-2 text-right font-mono text-gray-600 dark:text-gray-400">
                    {{ formatBytes(res.size) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Third-Party Weight -->
        <div
          v-if="result.thirdPartyDomains.length"
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.3, delay: 0.3 }"
        >
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-server-stack" class="w-4 h-4 text-cyan-500" />
            Third-Party Weight
            <span class="text-xs font-normal text-gray-500">{{ result.thirdPartyPercent.toFixed(0) }}% of total</span>
          </h2>
          <div class="space-y-2">
            <div
              v-for="tp in result.thirdPartyDomains"
              :key="tp.entity"
              class="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-gray-900 dark:text-white truncate">
                  {{ tp.entity }}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <div class="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      class="h-full rounded-full bg-red-400"
                      :style="{ width: `${result.thirdPartyDomains[0].size > 0 ? (tp.size / result.thirdPartyDomains[0].size) * 100 : 0}%` }"
                    />
                  </div>
                </div>
              </div>
              <div class="text-right shrink-0">
                <p class="text-xs font-bold text-gray-900 dark:text-white">
                  {{ formatBytes(tp.size) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Unused Code -->
        <div
          v-if="result.unusedBytes > 0"
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.3, delay: 0.35 }"
          class="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
        >
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-amber-900 dark:text-amber-200">
                {{ formatBytes(result.unusedBytes) }} of unused code shipped ({{ result.unusedPercent.toFixed(0) }}% of transfer)
              </p>
              <p class="text-xs text-amber-700 dark:text-amber-400 mt-1">
                Unused JavaScript and CSS are downloaded, parsed, and compiled but never executed on initial page load. Use code splitting, tree shaking, and dynamic imports to reduce this overhead.
              </p>
            </div>
          </div>
        </div>

        <!-- Compression Efficiency -->
        <div
          v-if="result.compressionRatio > 1"
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.3, delay: 0.4 }"
          class="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
        >
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-archive-box-arrow-down" class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-blue-900 dark:text-blue-200">
                Compression saving {{ formatBytes(result.totalUncompressedSize - result.totalSize) }} ({{ result.compressionRatio.toFixed(1) }}x ratio)
              </p>
              <p class="text-xs text-blue-700 dark:text-blue-400 mt-1">
                {{ result.compressionRatio >= 3 ? 'Good compression ratio. Your server is using gzip or brotli effectively.' : 'Low compression ratio. Ensure your server enables brotli or gzip for text-based resources (HTML, CSS, JS, JSON).' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Related Tools CTA -->
        <div class="p-4 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border border-cyan-200 dark:border-cyan-800">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="text-center sm:text-left">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Dive deeper into performance
              </p>
              <p class="text-xs text-gray-500">
                Analyze LCP, network requests, and full Lighthouse reports
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <UButton to="/tools/pagespeed-insights-performance" variant="outline" size="sm">
                Full PSI Report
              </UButton>
              <UButton to="/tools/har-viewer" variant="outline" size="sm">
                HAR Viewer
              </UButton>
              <UButton to="/tools/json-size" variant="outline" size="sm">
                JSON Size
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </ToolCard>

    <!-- Educational Content -->
    <section class="px-3 sm:px-6 lg:px-8 pb-12">
      <div class="max-w-6xl mx-auto">
        <div class="mb-10 grid lg:grid-cols-2 gap-6 items-start">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold mb-3 text-gray-900 dark:text-white">
              Why Page Weight Matters
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              Page weight directly impacts
              <strong class="text-gray-900 dark:text-white">Largest Contentful Paint (LCP)</strong> and
              <strong class="text-gray-900 dark:text-white">Time to Interactive</strong>.
              The median mobile page now weighs 2.5 MB, growing ~10% per year. But median doesn't mean good — sites in the
              <strong class="text-gray-900 dark:text-white">bottom 25th percentile</strong> (under 1 MB) consistently score higher on Core Web Vitals.
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              JavaScript is the most expensive resource type: every 50 KB of JS costs ~100ms of parse/compile time on mid-range phones.
              Images are cheaper byte-for-byte since they don't block the main thread, but unoptimized images are the largest contributor to total page weight.
            </p>
          </div>

          <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Page Weight Benchmarks (Mobile)
            </h3>
            <div class="space-y-3">
              <div v-for="p in httpArchivePercentiles" :key="p.label" class="flex items-center gap-3">
                <div class="w-10 text-xs font-mono font-bold text-gray-500">
                  {{ p.label }}
                </div>
                <div class="flex-1 h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    class="h-full rounded-full"
                    :class="p.kb < 1024 ? 'bg-green-400' : p.kb < 3000 ? 'bg-orange-400' : 'bg-red-400'"
                    :style="{ width: `${Math.min((p.kb / 8300) * 100, 100)}%` }"
                  />
                </div>
                <span class="text-xs font-mono text-gray-500 w-16 text-right">{{ formatBytes(p.kb * 1024) }}</span>
              </div>
            </div>
            <p class="mt-3 text-[10px] text-gray-400">
              Source: HTTP Archive, 2025-2026 mobile data
            </p>
          </div>
        </div>

        <!-- Tips -->
        <div class="mb-12 relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div class="p-5 sm:p-6">
            <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-600">
                <UIcon name="i-heroicons-light-bulb" class="w-4 h-4 text-white" />
              </span>
              How to Reduce Page Weight
            </h2>

            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Optimize Images
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Use AVIF (50% savings over JPEG) or WebP (30% savings). Serve responsive sizes with srcset. Lazy-load below-fold images.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Trim JavaScript
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Tree-shake unused code. Code-split routes. Audit npm dependencies — many bundles ship 30-50% unused code.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Enable Brotli
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Brotli compresses 15-25% better than gzip for text resources. Most CDNs and reverse proxies support it out of the box.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Audit Third Parties
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Third-party scripts average 30-50% of total page weight. Remove unused trackers, defer non-essential scripts, and use lightweight alternatives.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Variable Fonts
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Replace multiple font files with a single variable font. Subset to only the characters you need. Use WOFF2 format.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Set Budgets
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Set a performance budget (e.g., 200 KB JS, 500 KB images). Use Lighthouse CI to enforce budgets in your CI pipeline.
                </p>
              </div>
            </div>
          </div>
        </div>

        <ToolFeedback tool-id="page-size" :context="{ hasResult: !!result }" />
        <ToolFaq :faqs="faqs" color="cyan" />

        <!-- Related Tools -->
        <div class="text-center mt-12">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Explore more performance tools
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <UButton to="/tools/pagespeed-insights-performance" variant="outline" size="sm" class="gap-2">
              <UIcon name="i-heroicons-chart-bar" class="w-4 h-4" />
              Full PSI Report
            </UButton>
            <UButton to="/tools/lcp-finder" variant="outline" size="sm" class="gap-2">
              <UIcon name="i-heroicons-photo" class="w-4 h-4" />
              LCP Finder
            </UButton>
            <UButton to="/tools/har-viewer" variant="outline" size="sm" class="gap-2">
              <UIcon name="i-heroicons-document-magnifying-glass" class="w-4 h-4" />
              HAR Viewer
            </UButton>
            <UButton to="/tools/json-size" variant="outline" size="sm" class="gap-2">
              <UIcon name="i-heroicons-code-bracket-square" class="w-4 h-4" />
              JSON Size
            </UButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
