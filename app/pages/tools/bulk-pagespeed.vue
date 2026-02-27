<script setup lang="ts">
definePageMeta({
  breadcrumb: {
    icon: 'i-heroicons-squares-2x2',
    ariaLabel: 'Bulk PageSpeed Test',
  },
})

const faqs = [
  {
    question: 'What is bulk PageSpeed testing?',
    answer: 'Bulk PageSpeed testing lets you analyze multiple URLs simultaneously using the PageSpeed Insights API. Instead of testing pages one at a time, you can submit up to 10 URLs and get Lighthouse performance scores, Core Web Vitals, and audit results for all pages at once.',
  },
  {
    question: 'How do I use the PageSpeed Insights API for bulk testing?',
    answer: 'The PageSpeed Insights API (pagespeedonline/v5/runpagespeed) accepts a URL parameter and returns Lighthouse results as JSON. This tool handles the API calls for you, but for programmatic access you can call the API directly with your own API key for higher rate limits.',
  },
  {
    question: 'Is there a limit to bulk PageSpeed testing?',
    answer: 'This free tool allows testing up to 10 URLs at once. The PageSpeed Insights API has rate limits (400 requests per day for anonymous users, 25,000 with an API key). For scanning entire sites with hundreds of pages, use Unlighthouse CLI instead.',
  },
  {
    question: 'What metrics does bulk PageSpeed testing show?',
    answer: 'Each URL gets a full Lighthouse audit including: Performance score (0-100), Core Web Vitals (LCP, CLS, TBT/INP), First Contentful Paint, Speed Index, and a pass/fail summary. Results help identify which pages need optimization.',
  },
  {
    question: 'When should I use bulk testing vs full site scanning?',
    answer: 'Use bulk testing for quick checks of specific pages like landing pages, product pages, or comparing competitor URLs. For comprehensive site-wide analysis with all pages automatically discovered, use Unlighthouse CLI which crawls your sitemap and tests every page.',
  },
]

useToolSeo({
  title: 'Bulk PageSpeed Insights Test - Test Multiple URLs Free',
  description: 'Free bulk PageSpeed testing tool. Test up to 10 URLs at once with the PageSpeed Insights API. Get Lighthouse scores and Core Web Vitals for multiple pages.',
  faqs,
})

interface MetricResult {
  value: number
  displayValue: string
  rating: 'good' | 'needs-improvement' | 'poor'
}

interface BulkPSIResult {
  url: string
  status: 'queued' | 'processing' | 'success' | 'error'
  performance: number | null
  lcp: MetricResult | null
  cls: MetricResult | null
  fcp: MetricResult | null
  tbt: MetricResult | null
  si: MetricResult | null
  error?: string
}

interface BulkResponse {
  results: BulkPSIResult[]
  summary: {
    totalUrls: number
    successCount: number
    errorCount: number
    avgPerformance: number
    goodCount: number
    needsWorkCount: number
    poorCount: number
  }
  device: 'mobile' | 'desktop'
  timestamp: number
}

// State
const urlInput = ref('')
const device = ref<'mobile' | 'desktop'>('mobile')
const loading = ref(false)
const error = ref<string | null>(null)
const results = ref<BulkPSIResult[]>([])
const summary = ref<BulkResponse['summary'] | null>(null)
const sortColumn = ref<'url' | 'performance' | 'lcp' | 'cls' | 'fcp' | 'tbt'>('performance')
const sortDirection = ref<'asc' | 'desc'>('desc')
let eventSource: EventSource | null = null

// Computed progress stats
const progressStats = computed(() => {
  const total = results.value.length
  const queued = results.value.filter(r => r.status === 'queued').length
  const processing = results.value.filter(r => r.status === 'processing').length
  const completed = results.value.filter(r => r.status === 'success' || r.status === 'error').length
  return { total, queued, processing, completed }
})

const urlCount = computed(() => {
  const urls = urlInput.value.split('\n').map(u => u.trim()).filter(u => u.length > 0)
  return Math.min(urls.length, 10)
})

const sortedResults = computed(() => {
  if (results.value.length === 0)
    return []

  return [...results.value].sort((a, b) => {
    let aVal: number | string = 0
    let bVal: number | string = 0

    if (sortColumn.value === 'url') {
      aVal = a.url
      bVal = b.url
      return sortDirection.value === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }

    if (sortColumn.value === 'performance') {
      aVal = a.performance ?? -1
      bVal = b.performance ?? -1
    }
    else {
      const metric = a[sortColumn.value]
      const metricB = b[sortColumn.value]
      aVal = metric?.value ?? -1
      bVal = metricB?.value ?? -1
    }

    return sortDirection.value === 'asc' ? aVal - bVal : bVal - aVal
  })
})

function toggleSort(column: typeof sortColumn.value) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  }
  else {
    sortColumn.value = column
    sortDirection.value = column === 'url' ? 'asc' : 'desc'
  }
}

function getScoreColor(score: number | null) {
  if (score === null)
    return 'text-gray-400'
  if (score >= 90)
    return 'text-green-500'
  if (score >= 50)
    return 'text-orange-500'
  return 'text-red-500'
}

function getScoreBg(score: number | null) {
  if (score === null)
    return 'bg-gray-200 dark:bg-gray-700'
  if (score >= 90)
    return 'bg-green-500'
  if (score >= 50)
    return 'bg-orange-500'
  return 'bg-red-500'
}

function getRatingColor(rating: string | undefined) {
  if (!rating)
    return 'text-gray-400'
  if (rating === 'good')
    return 'text-green-500'
  if (rating === 'needs-improvement')
    return 'text-orange-500'
  return 'text-red-500'
}

function getRatingDot(rating: string | undefined) {
  if (!rating)
    return 'bg-gray-400'
  if (rating === 'good')
    return 'bg-green-500'
  if (rating === 'needs-improvement')
    return 'bg-orange-500'
  return 'bg-red-500'
}

function formatUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function pasteFromClipboard() {
  if (import.meta.client) {
    navigator.clipboard.readText().then((text) => {
      urlInput.value = text
    })
  }
}

function stopTest() {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
  loading.value = false
}

async function runTest() {
  const urls = urlInput.value
    .split('\n')
    .map(u => u.trim())
    .filter(u => u.length > 0)
    .slice(0, 10)

  if (urls.length === 0) {
    error.value = 'Enter at least one URL'
    return
  }

  // Clean up previous connection
  stopTest()

  loading.value = true
  error.value = null
  results.value = []
  summary.value = null

  // POST to get SSE stream
  // We need to use fetch + ReadableStream since EventSource only supports GET
  const response = await fetch('/api/tools/bulk-pagespeed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls, device: device.value }),
  }).catch((err) => {
    error.value = err.message || 'Failed to connect'
    loading.value = false
    return null
  })

  if (!response?.body) {
    error.value = 'Failed to start bulk test'
    loading.value = false
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const processStream = async () => {
    while (true) {
      const { done, value } = await reader.read()
      if (done)
        break

      buffer += decoder.decode(value, { stream: true })

      // Process complete SSE messages
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))

          if (data.type === 'init') {
            results.value = data.results as BulkPSIResult[]
          }
          else if (data.type === 'status') {
            const current = results.value[data.index]
            if (current) {
              results.value[data.index] = { ...current, status: data.status as BulkPSIResult['status'] }
            }
          }
          else if (data.type === 'result') {
            results.value[data.index] = data.result as BulkPSIResult
          }
          else if (data.type === 'complete') {
            summary.value = data.summary
            loading.value = false
          }
        }
      }
    }
  }

  processStream().catch((err) => {
    error.value = err.message || 'Stream error'
    loading.value = false
  })
}

onUnmounted(() => {
  stopTest()
})

function exportCSV() {
  if (results.value.length === 0)
    return

  const headers = ['URL', 'Performance', 'LCP', 'CLS', 'FCP', 'TBT', 'Status']
  const rows = results.value.map(r => [
    r.url,
    r.performance ?? 'N/A',
    r.lcp?.displayValue ?? 'N/A',
    r.cls?.displayValue ?? 'N/A',
    r.fcp?.displayValue ?? 'N/A',
    r.tbt?.displayValue ?? 'N/A',
    r.status,
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  downloadFile(csv, 'bulk-pagespeed-results.csv', 'text/csv')
}

function exportJSON() {
  if (results.value.length === 0)
    return
  const exportData = { results: results.value, summary: summary.value, device: device.value, timestamp: Date.now() }
  downloadFile(JSON.stringify(exportData, null, 2), 'bulk-pagespeed-results.json', 'application/json')
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <ToolPageLayout color-scheme="amber">
    <!-- Hero Section -->
    <ToolHero
      title="Bulk PageSpeed Test"
      description="Test up to 10 URLs at once with Google's PageSpeed Insights API. Get Lighthouse performance scores, Core Web Vitals, and optimization insights for multiple pages simultaneously."
      prefix="$ unlighthouse bulk-test"
      color-scheme="amber"
    />

    <!-- Input Section -->
    <ToolInputGlow :loading="loading" color-scheme="amber">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter URLs <span class="text-gray-400">(one per line, max 10)</span>
          </label>
          <UTextarea
            v-model="urlInput"
            :rows="10"
            placeholder="https://example.com
https://example.com/about
https://example.com/products
https://example.com/contact
https://example.com/blog
https://example.com/pricing"
            class="font-mono text-sm min-h-[200px]"
            :disabled="loading"
            autoresize
          />
          <div class="mt-2 flex items-center justify-between">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ urlCount }}/10 URLs
            </span>
            <div class="flex gap-2">
              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                icon="i-heroicons-clipboard-document"
                :disabled="loading"
                @click="pasteFromClipboard"
              >
                Paste
              </UButton>
              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                icon="i-heroicons-x-mark"
                :disabled="loading || !urlInput"
                @click="urlInput = ''"
              >
                Clear
              </UButton>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">Device:</span>
            <div class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-100 dark:bg-gray-800">
              <button
                type="button"
                class="px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5"
                :class="[device === 'mobile' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']"
                :disabled="loading"
                @click="device = 'mobile'"
              >
                <UIcon name="i-heroicons-device-phone-mobile" class="w-4 h-4" />
                Mobile
              </button>
              <button
                type="button"
                class="px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5"
                :class="[device === 'desktop' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']"
                :disabled="loading"
                @click="device = 'desktop'"
              >
                <UIcon name="i-heroicons-computer-desktop" class="w-4 h-4" />
                Desktop
              </button>
            </div>
          </div>

          <UButton
            size="lg"
            :loading="loading"
            :disabled="urlCount === 0 || loading"
            class="bg-amber-600 hover:bg-amber-500 text-white font-medium w-full sm:w-auto"
            @click="runTest"
          >
            <UIcon name="i-heroicons-bolt" class="w-4 h-4" />
            Run Bulk Test
          </UButton>
        </div>
      </div>
    </ToolInputGlow>

    <!-- Progress State -->
    <div v-if="loading && results.length > 0" class="max-w-4xl">
      <div
        v-motion
        :initial="{ opacity: 0, y: 10 }"
        :animate="{ opacity: 1, y: 0 }"
        class="p-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
      >
        <!-- Progress bar -->
        <div class="mb-4">
          <div class="flex justify-between text-sm mb-2">
            <span class="font-medium text-amber-900 dark:text-amber-100">
              Testing {{ progressStats.total }} URLs
            </span>
            <span class="text-amber-700 dark:text-amber-300">
              {{ progressStats.completed }}/{{ progressStats.total }} complete
            </span>
          </div>
          <div class="h-2 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-amber-500 transition-all duration-300"
              :style="{ width: `${(progressStats.completed / progressStats.total) * 100}%` }"
            />
          </div>
        </div>

        <!-- Status breakdown -->
        <div class="flex flex-wrap gap-4 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span class="text-amber-700 dark:text-amber-300">{{ progressStats.processing }} processing</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-gray-400" />
            <span class="text-gray-600 dark:text-gray-400">{{ progressStats.queued }} queued</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-green-500" />
            <span class="text-gray-600 dark:text-gray-400">{{ progressStats.completed }} done</span>
          </div>
        </div>

        <p class="mt-4 text-xs text-amber-600 dark:text-amber-400">
          Processing 3 URLs at a time. Each URL takes up to 2 minutes for a full Lighthouse audit.
        </p>
      </div>
    </div>

    <!-- Initial Loading State (before results arrive) -->
    <div v-else-if="loading" class="max-w-4xl">
      <div
        v-motion
        :initial="{ opacity: 0, y: 10 }"
        :animate="{ opacity: 1, y: 0 }"
        class="p-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
      >
        <div class="flex items-center gap-4">
          <div class="relative">
            <div class="w-12 h-12 rounded-full border-4 border-amber-200 dark:border-amber-800" />
            <div class="absolute inset-0 w-12 h-12 rounded-full border-4 border-t-amber-500 animate-spin" />
          </div>
          <div class="flex-1">
            <p class="font-medium text-amber-900 dark:text-amber-100">
              Starting bulk test...
            </p>
            <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Connecting to PageSpeed Insights API
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      icon="i-heroicons-exclamation-circle"
      class="max-w-4xl"
      :title="error"
    />

    <!-- Results Section -->
    <div v-if="results.length > 0" class="max-w-5xl space-y-6">
      <!-- Summary Cards (only show when complete) -->
      <div
        v-if="summary"
        v-motion
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        class="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center">
          <div class="text-3xl font-bold tabular-nums" :class="getScoreColor(summary.avgPerformance)">
            {{ summary.avgPerformance }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Avg. Performance
          </div>
        </div>
        <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center">
          <div class="text-3xl font-bold text-green-500 tabular-nums">
            {{ summary.goodCount }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Good (90+)
          </div>
        </div>
        <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center">
          <div class="text-3xl font-bold text-orange-500 tabular-nums">
            {{ summary.needsWorkCount }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Needs Work (50-89)
          </div>
        </div>
        <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center">
          <div class="text-3xl font-bold text-red-500 tabular-nums">
            {{ summary.poorCount }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Poor (&lt;50)
          </div>
        </div>
      </div>

      <!-- Results Table -->
      <div
        v-motion
        :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: 0.1 }"
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <th
                  class="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  @click="toggleSort('url')"
                >
                  <div class="flex items-center gap-1">
                    URL
                    <UIcon
                      v-if="sortColumn === 'url'"
                      :name="sortDirection === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                      class="w-3 h-3"
                    />
                  </div>
                </th>
                <th
                  class="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  @click="toggleSort('performance')"
                >
                  <div class="flex items-center justify-center gap-1">
                    Perf
                    <UIcon
                      v-if="sortColumn === 'performance'"
                      :name="sortDirection === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                      class="w-3 h-3"
                    />
                  </div>
                </th>
                <th
                  class="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden sm:table-cell"
                  @click="toggleSort('lcp')"
                >
                  <div class="flex items-center justify-center gap-1">
                    LCP
                    <UIcon
                      v-if="sortColumn === 'lcp'"
                      :name="sortDirection === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                      class="w-3 h-3"
                    />
                  </div>
                </th>
                <th
                  class="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden sm:table-cell"
                  @click="toggleSort('cls')"
                >
                  <div class="flex items-center justify-center gap-1">
                    CLS
                    <UIcon
                      v-if="sortColumn === 'cls'"
                      :name="sortDirection === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                      class="w-3 h-3"
                    />
                  </div>
                </th>
                <th
                  class="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:table-cell"
                  @click="toggleSort('fcp')"
                >
                  <div class="flex items-center justify-center gap-1">
                    FCP
                    <UIcon
                      v-if="sortColumn === 'fcp'"
                      :name="sortDirection === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                      class="w-3 h-3"
                    />
                  </div>
                </th>
                <th
                  class="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:table-cell"
                  @click="toggleSort('tbt')"
                >
                  <div class="flex items-center justify-center gap-1">
                    TBT
                    <UIcon
                      v-if="sortColumn === 'tbt'"
                      :name="sortDirection === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                      class="w-3 h-3"
                    />
                  </div>
                </th>
                <th class="text-center px-3 py-3 font-medium text-gray-700 dark:text-gray-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(result, idx) in sortedResults"
                :key="result.url"
                v-motion
                :initial="{ opacity: 0, x: -10 }"
                :animate="{ opacity: 1, x: 0 }"
                :transition="{ delay: idx * 0.05 }"
                class="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <td class="px-4 py-3">
                  <a
                    :href="result.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-amber-600 dark:text-amber-400 hover:underline font-mono text-xs truncate block max-w-[200px] md:max-w-[300px]"
                    :title="result.url"
                  >
                    {{ formatUrl(result.url) }}
                  </a>
                </td>
                <td class="px-3 py-3 text-center">
                  <div
                    v-if="result.status === 'success' && result.performance !== null"
                    class="inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-white text-sm"
                    :class="getScoreBg(result.performance)"
                  >
                    {{ result.performance }}
                  </div>
                  <div
                    v-else-if="result.status === 'processing'"
                    class="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-amber-300 dark:border-amber-700"
                  >
                    <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-amber-500 animate-spin" />
                  </div>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-3 py-3 text-center hidden sm:table-cell">
                  <div v-if="result.lcp" class="flex items-center justify-center gap-1">
                    <span :class="getRatingDot(result.lcp.rating)" class="w-1.5 h-1.5 rounded-full" />
                    <span :class="getRatingColor(result.lcp.rating)" class="text-xs tabular-nums">
                      {{ result.lcp.displayValue }}
                    </span>
                  </div>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-3 py-3 text-center hidden sm:table-cell">
                  <div v-if="result.cls" class="flex items-center justify-center gap-1">
                    <span :class="getRatingDot(result.cls.rating)" class="w-1.5 h-1.5 rounded-full" />
                    <span :class="getRatingColor(result.cls.rating)" class="text-xs tabular-nums">
                      {{ result.cls.displayValue }}
                    </span>
                  </div>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-3 py-3 text-center hidden md:table-cell">
                  <div v-if="result.fcp" class="flex items-center justify-center gap-1">
                    <span :class="getRatingDot(result.fcp.rating)" class="w-1.5 h-1.5 rounded-full" />
                    <span :class="getRatingColor(result.fcp.rating)" class="text-xs tabular-nums">
                      {{ result.fcp.displayValue }}
                    </span>
                  </div>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-3 py-3 text-center hidden md:table-cell">
                  <div v-if="result.tbt" class="flex items-center justify-center gap-1">
                    <span :class="getRatingDot(result.tbt.rating)" class="w-1.5 h-1.5 rounded-full" />
                    <span :class="getRatingColor(result.tbt.rating)" class="text-xs tabular-nums">
                      {{ result.tbt.displayValue }}
                    </span>
                  </div>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-3 py-3 text-center">
                  <!-- Queued -->
                  <span
                    v-if="result.status === 'queued'"
                    class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
                  >
                    <span class="w-2 h-2 rounded-full bg-gray-400" />
                    Queued
                  </span>
                  <!-- Processing -->
                  <span
                    v-else-if="result.status === 'processing'"
                    class="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
                  >
                    <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                    Testing
                  </span>
                  <!-- Success -->
                  <UIcon
                    v-else-if="result.status === 'success'"
                    name="i-heroicons-check-circle"
                    class="w-5 h-5 text-green-500"
                  />
                  <!-- Error -->
                  <UTooltip v-else :text="result.error || 'Failed'">
                    <UIcon
                      name="i-heroicons-x-circle"
                      class="w-5 h-5 text-red-500"
                    />
                  </UTooltip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Export Actions -->
        <div class="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-2">
          <UButton
            size="sm"
            variant="outline"
            color="neutral"
            icon="i-heroicons-document-arrow-down"
            @click="exportCSV"
          >
            Export CSV
          </UButton>
          <UButton
            size="sm"
            variant="outline"
            color="neutral"
            icon="i-heroicons-code-bracket"
            @click="exportJSON"
          >
            Export JSON
          </UButton>
          <UButton
            size="sm"
            variant="outline"
            color="neutral"
            icon="i-heroicons-arrow-path"
            @click="runTest"
          >
            Re-test
          </UButton>
        </div>
      </div>

      <!-- Feedback -->
      <ToolsToolFeedback v-if="summary" tool-id="bulk-pagespeed" :context="{ device, urlCount: summary.totalUrls }" />
    </div>

    <!-- FAQ Section -->
    <div class="max-w-4xl mt-12">
      <ToolFaq :faqs="faqs" color="amber" />
    </div>

    <!-- Upsell Section -->
    <div
      v-motion
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ delay: 0.2 }"
      class="max-w-4xl mt-12"
    >
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200 dark:border-amber-800/50 p-6 md:p-8">
        <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-3xl -mr-32 -mt-32" />

        <div class="relative">
          <div class="flex items-center gap-2 mb-4">
            <div class="p-2 rounded-lg bg-amber-500/20">
              <UIcon name="i-heroicons-rocket-launch" class="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">
              Need to scan your entire site?
            </h3>
          </div>

          <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-xl">
            Unlighthouse automatically discovers and audits hundreds of pages on your site. Get comprehensive performance insights with a single command.
          </p>

          <div class="bg-gray-900 dark:bg-black rounded-lg p-4 mb-6 font-mono text-sm">
            <span class="text-gray-500">$</span>
            <span class="text-amber-400"> npx</span>
            <span class="text-white"> unlighthouse</span>
            <span class="text-green-400"> --site</span>
            <span class="text-cyan-400"> example.com</span>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <UButton
              to="/guide/getting-started"
              size="lg"
              class="bg-amber-600 hover:bg-amber-500 text-white w-full sm:w-auto justify-center"
              trailing-icon="i-heroicons-arrow-right"
            >
              Try Unlighthouse CLI (Free)
            </UButton>
            <UButton
              to="/cloud"
              size="lg"
              variant="outline"
              color="neutral"
              class="w-full sm:w-auto justify-center"
            >
              <UIcon name="i-heroicons-cloud" class="w-4 h-4" />
              Schedule with Cloud
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </ToolPageLayout>
</template>
