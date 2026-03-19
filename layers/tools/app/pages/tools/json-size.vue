<script setup lang="ts">
definePageMeta({
  breadcrumb: {
    icon: 'i-heroicons-code-bracket-square',
    ariaLabel: 'JSON Size Analyzer',
  },
})

const faqs = [
  {
    question: 'How is JSON size calculated?',
    answer: 'Raw size is measured in UTF-8 bytes using the Blob API. Minified size is computed by parsing the JSON and re-serializing with JSON.stringify (no whitespace). The difference between raw and minified is your savings from removing formatting.',
  },
  {
    question: 'How accurate are the gzip and brotli estimates?',
    answer: 'The estimates use typical compression ratios: ~4.5x for gzip and ~5.1x for brotli on JSON data (Brotli offers best density for APIs). Alternatively, Zstandard (Zstd) achieves ~4.5x but is significantly faster. Real compression depends on data entropy and repetition. These estimates are within 10-20% of actual compression.',
  },
  {
    question: 'Why should I optimize JSON size?',
    answer: 'Large JSON payloads hurt performance in two ways: network transfer time and mobile CPU parsing. On mobile devices, native JSON.parse is highly optimized (V8 parses >10KB payloads 1.5x faster than JS literals), but main-thread execution time for massive payloads can block the UI. Additionally, REST API over-fetching often results in 30-50% of returned data being discarded by the client. Optimizing reduces mobile latency and CPU blocking.',
  },
  {
    question: 'What does "duplicate key bytes" mean?',
    answer: 'When you have an array of objects with the same keys (like API responses), the key names are repeated for every object. Duplicate key bytes shows how much space is wasted on repeated key strings. This overhead shrinks dramatically with compression.',
  },
  {
    question: 'Is my JSON data uploaded anywhere?',
    answer: 'No. This tool runs entirely in your browser. Your JSON is never sent to any server. All parsing, analysis, and minification happen client-side using JavaScript.',
  },
  {
    question: 'Why does my JSON fail to parse?',
    answer: 'Common issues include trailing commas (not valid JSON), single quotes instead of double quotes, unquoted keys, comments, or JavaScript expressions like undefined. Use a JSON validator to find the exact error location.',
  },
  {
    question: 'How can I reduce my JSON payload size?',
    answer: 'Minify by removing whitespace. Use shorter key names for large arrays of objects. Remove null/empty fields. Enable gzip or brotli compression on your server. Consider binary formats like MessagePack or Protocol Buffers for very large payloads.',
  },
]

useToolSeo({
  title: 'JSON Size Analyzer - Calculate JSON Object Size Online Free',
  description: 'Free JSON size calculator and analyzer. Measure raw, minified, gzip, and brotli sizes. Analyze key contributions, depth, and duplicate key overhead. Entirely client-side.',
  faqs,
})

const { trackUse, resetUseTracking } = useToolTracking('json-size')

const inputText = ref('')

const charCount = computed(() => inputText.value.length)

interface KeyContribution {
  key: string
  size: number
  percent: number
}

interface Analysis {
  rawSize: number
  minifiedSize: number
  minifiedText: string
  savings: number
  savingsPercent: number
  gzipEstimate: number
  brotliEstimate: number
  keyCount: number
  maxDepth: number
  uniqueKeys: number
  duplicateKeyBytes: number
  topLevelKeys: KeyContribution[]
}

const error = ref('')

watch(inputText, (text) => {
  const trimmed = text.trim()
  if (!trimmed) {
    error.value = ''
    return
  }

  try {
    JSON.parse(trimmed)
    error.value = ''
    trackUse()
  }
  catch {
    error.value = 'Invalid JSON — check for trailing commas, single quotes, or syntax errors.'
  }
}, { immediate: true })

const analysis = computed<Analysis | null>(() => {
  const text = inputText.value.trim()
  if (!text)
    return null

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  }
  catch {
    return null
  }

  const rawSize = new Blob([text]).size
  const minifiedText = JSON.stringify(parsed)
  const minifiedSize = new Blob([minifiedText]).size
  const savings = rawSize - minifiedSize
  const savingsPercent = rawSize > 0 ? (savings / rawSize) * 100 : 0
  const gzipEstimate = Math.round(minifiedSize / 4.5)
  const brotliEstimate = Math.round(minifiedSize / 5.1)

  // Key count & depth
  let keyCount = 0
  let maxDepth = 0
  const allKeys = new Map<string, number>()

  function walk(val: unknown, depth: number) {
    if (depth > maxDepth)
      maxDepth = depth
    if (Array.isArray(val)) {
      for (const item of val) walk(item, depth + 1)
    }
    else if (val !== null && typeof val === 'object') {
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        keyCount++
        allKeys.set(k, (allKeys.get(k) || 0) + 1)
        walk(v, depth + 1)
      }
    }
  }
  walk(parsed, 0)

  const uniqueKeys = allKeys.size

  // Duplicate key bytes: for keys appearing > 1 time, (count - 1) * (key bytes + 3 for "":)
  let duplicateKeyBytes = 0
  for (const [k, count] of allKeys) {
    if (count > 1) {
      const keyBytes = new Blob([k]).size
      duplicateKeyBytes += (count - 1) * (keyBytes + 3) // "key":
    }
  }

  // Top-level key contributions
  const topLevelKeys: KeyContribution[] = []
  if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const keyJson = JSON.stringify({ [k]: v })
      const size = new Blob([keyJson]).size - 2 // subtract {}
      topLevelKeys.push({ key: k, size, percent: 0 })
    }
    const total = topLevelKeys.reduce((s, k) => s + k.size, 0)
    for (const k of topLevelKeys) {
      k.percent = total > 0 ? (k.size / total) * 100 : 0
    }
    topLevelKeys.sort((a, b) => b.size - a.size)
  }

  return {
    rawSize,
    minifiedSize,
    minifiedText,
    savings,
    savingsPercent,
    gzipEstimate,
    brotliEstimate,
    keyCount,
    maxDepth,
    uniqueKeys,
    duplicateKeyBytes,
    topLevelKeys,
  }
})

function clearInput() {
  inputText.value = ''
  error.value = ''
  resetUseTracking()
}

const copied = ref(false)
function copyMinified() {
  if (!analysis.value)
    return
  navigator.clipboard.writeText(analysis.value.minifiedText)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function loadSample() {
  inputText.value = JSON.stringify({
    users: [
      { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', settings: { theme: 'dark', notifications: true, language: 'en' } },
      { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'editor', settings: { theme: 'light', notifications: false, language: 'en' } },
      { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'viewer', settings: { theme: 'dark', notifications: true, language: 'fr' } },
    ],
    metadata: { total: 3, page: 1, perPage: 25, hasMore: false },
    apiVersion: '2.1.0',
  }, null, 2)
}

const keyBarColors = ['bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500', 'bg-green-500']
</script>

<template>
  <div class="min-h-screen">
    <ToolPageHero title="JSON Size" accent="Analyzer" description="Paste JSON to analyze size, minification savings, compression estimates, and key contributions. Entirely client-side." color="teal" />

    <ToolCard icon="i-heroicons-code-bracket-square" title="JSON Size Analysis" color="teal" max-width="max-w-5xl">
      <div class="flex items-center justify-end gap-2 px-4 sm:px-6 py-2">
        <span v-if="charCount > 0" class="px-2 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
          {{ charCount.toLocaleString() }} chars
        </span>
        <UButton v-if="inputText" variant="ghost" color="neutral" size="xs" @click="clearInput">
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          <span class="hidden sm:inline">Clear</span>
        </UButton>
      </div>

      <!-- Input Area -->
      <div class="p-4 sm:p-6">
        <div class="relative">
          <UTextarea
            v-model="inputText"
            placeholder="Paste your JSON here..."
            :rows="8"
            spellcheck="false"
            :ui="{ root: 'w-full', base: 'font-mono text-sm resize-y' }"
          />
          <div v-if="!inputText" class="absolute bottom-4 left-4">
            <UButton variant="soft" size="sm" color="neutral" @click="loadSample">
              <UIcon name="i-heroicons-beaker" class="w-4 h-4 mr-1" />
              Load Sample
            </UButton>
          </div>
        </div>
      </div>

      <!-- Error -->
      <UAlert
        v-if="error && !analysis"
        color="error"
        variant="subtle"
        icon="i-heroicons-exclamation-circle"
        class="mx-4 sm:mx-6 mb-4"
      >
        <template #title>
          {{ error }}
        </template>
      </UAlert>

      <!-- Analysis Results -->
      <div v-if="analysis" class="px-4 sm:px-6 pb-6 space-y-6">
        <!-- Summary Stats Grid -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.3 }"
        >
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-teal-500" />
            Size Summary
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
              <p class="text-lg font-bold text-gray-900 dark:text-white">
                {{ formatBytes(analysis.rawSize) }}
              </p>
              <p class="text-xs text-gray-500">
                Raw Size
              </p>
            </div>
            <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
              <p class="text-lg font-bold text-gray-900 dark:text-white">
                {{ formatBytes(analysis.minifiedSize) }}
              </p>
              <p class="text-xs text-gray-500">
                Minified
              </p>
            </div>
            <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
              <p class="text-lg font-bold text-gray-900 dark:text-white">
                {{ formatBytes(analysis.gzipEstimate) }}
              </p>
              <p class="text-xs text-gray-500">
                Gzip Est.
              </p>
            </div>
            <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
              <p class="text-lg font-bold text-gray-900 dark:text-white">
                {{ formatBytes(analysis.brotliEstimate) }}
              </p>
              <p class="text-xs text-gray-500">
                Brotli Est.
              </p>
            </div>
          </div>
        </div>

        <!-- Savings + Structure -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.3, delay: 0.1 }"
          class="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div class="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
            <p class="text-lg font-bold text-green-700 dark:text-green-400">
              {{ analysis.savingsPercent.toFixed(1) }}%
            </p>
            <p class="text-xs text-green-600 dark:text-green-500">
              Savings
            </p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ analysis.maxDepth }}
            </p>
            <p class="text-xs text-gray-500">
              Max Depth
            </p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ analysis.keyCount.toLocaleString() }}
            </p>
            <p class="text-xs text-gray-500">
              Total Keys
            </p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ analysis.uniqueKeys }}
            </p>
            <p class="text-xs text-gray-500">
              Unique Keys
            </p>
          </div>
        </div>

        <!-- Duplicate key bytes -->
        <div v-if="analysis.duplicateKeyBytes > 0" class="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p class="text-sm text-amber-800 dark:text-amber-300">
              <strong>{{ formatBytes(analysis.duplicateKeyBytes) }}</strong> wasted on duplicate key names across repeated objects
            </p>
          </div>
        </div>

        <!-- Top-Level Key Contributions -->
        <div
          v-if="analysis.topLevelKeys.length > 1"
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.3, delay: 0.2 }"
        >
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-chart-pie" class="w-4 h-4 text-teal-500" />
            Size by Key
          </h2>

          <!-- Stacked bar -->
          <div class="h-4 rounded-full overflow-hidden flex mb-4">
            <div
              v-for="(key, idx) in analysis.topLevelKeys"
              :key="key.key"
              :class="keyBarColors[idx % keyBarColors.length]"
              :style="{ width: `${key.percent}%` }"
              class="h-full"
              :title="`${key.key}: ${formatBytes(key.size)}`"
            />
          </div>

          <!-- Key list -->
          <div class="space-y-2">
            <div
              v-for="(key, idx) in analysis.topLevelKeys"
              :key="key.key"
              class="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              <div class="w-2.5 h-2.5 rounded-full shrink-0" :class="keyBarColors[idx % keyBarColors.length]" />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium font-mono text-gray-900 dark:text-white truncate">
                  {{ key.key }}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <div class="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      class="h-full rounded-full"
                      :class="keyBarColors[idx % keyBarColors.length]"
                      :style="{ width: `${key.percent}%` }"
                    />
                  </div>
                </div>
              </div>
              <div class="text-right shrink-0">
                <p class="text-xs font-bold text-gray-900 dark:text-white">
                  {{ formatBytes(key.size) }}
                </p>
                <p class="text-[10px] text-gray-500">
                  {{ key.percent.toFixed(1) }}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Minified Output -->
        <div
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.3, delay: 0.25 }"
        >
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <UIcon name="i-heroicons-code-bracket" class="w-4 h-4 text-teal-500" />
              Minified Output
            </h2>
            <UButton variant="soft" size="xs" color="primary" @click="copyMinified">
              <UIcon :name="copied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'" class="w-3.5 h-3.5 mr-1" />
              {{ copied ? 'Copied' : 'Copy' }}
            </UButton>
          </div>
          <div class="relative rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <pre class="p-4 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">{{ analysis.minifiedText }}</pre>
          </div>
        </div>

        <!-- Related Tools CTA -->
        <div class="p-4 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border border-teal-200 dark:border-teal-800">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="text-center sm:text-left">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Analyze your full page performance
              </p>
              <p class="text-xs text-gray-500">
                Check how JSON payloads impact your Lighthouse score
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <UButton to="/tools/page-size" variant="outline" size="sm">
                Page Size Checker
              </UButton>
              <UButton to="/tools/har-viewer" variant="outline" size="sm">
                HAR Viewer
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
              Why JSON Size Matters
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              JSON is the most common data format for APIs and configuration files. Large JSON payloads directly impact
              <strong class="text-gray-900 dark:text-white">page load time, Time to First Byte (TTFB), and Largest Contentful Paint (LCP)</strong>.
              Every kilobyte matters on mobile networks.
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Minification removes whitespace and formatting, typically saving
              <strong class="text-gray-900 dark:text-white">10-30%</strong> of raw size.
              Server compression (gzip/brotli) provides another
              <strong class="text-gray-900 dark:text-white">70-85%</strong> reduction on top of that.
            </p>
          </div>

          <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Compression Comparison
            </h3>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-20 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Raw
                </div>
                <div class="flex-1 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span class="text-xs font-mono text-gray-500 w-12 text-right">100%</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-20 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Minified
                </div>
                <div class="flex-1 h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div class="h-full rounded-full bg-teal-400" style="width: 75%" />
                </div>
                <span class="text-xs font-mono text-gray-500 w-12 text-right">~75%</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-20 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Gzip
                </div>
                <div class="flex-1 h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div class="h-full rounded-full bg-blue-400" style="width: 22%" />
                </div>
                <span class="text-xs font-mono text-gray-500 w-12 text-right">~22%</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-20 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Brotli
                </div>
                <div class="flex-1 h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div class="h-full rounded-full bg-purple-400" style="width: 20%" />
                </div>
                <span class="text-xs font-mono text-gray-500 w-12 text-right">~20%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tips -->
        <div class="mb-12 relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div class="p-5 sm:p-6">
            <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-600">
                <UIcon name="i-heroicons-light-bulb" class="w-4 h-4 text-white" />
              </span>
              Tips to Reduce JSON Size
            </h2>

            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Shorten Key Names
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  In arrays of objects, key names repeat for every item. Shorter keys like "n" instead of "name" save bytes multiplied by array length.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Remove Nulls
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Omit null and empty string fields from API responses. The absence of a key is more compact than "key":null.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Enable Compression
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Always serve JSON with Content-Encoding: br (Brotli) or gzip. This is the single biggest size reduction you can apply.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Paginate Large Arrays
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Don't return 1000 items when the client only shows 20. Use cursor-based pagination to keep payloads small.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Use Field Selection
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Implement sparse fieldsets or GraphQL to let clients request only the fields they need, reducing payload size.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Consider Alternatives
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  For very large datasets, consider MessagePack, Protocol Buffers, or streaming JSON (NDJSON) instead of monolithic JSON.
                </p>
              </div>
            </div>
          </div>
        </div>

        <ToolFeedback tool-id="json-size" :context="{ hasAnalysis: !!analysis }" />
        <ToolFaq :faqs="faqs" color="cyan" />

        <!-- Related Tools -->
        <div class="text-center mt-12">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Explore more performance tools
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <UButton to="/tools/har-viewer" variant="outline" size="sm" class="gap-2">
              <UIcon name="i-heroicons-document-magnifying-glass" class="w-4 h-4" />
              HAR Viewer
            </UButton>
            <UButton to="/tools/pagespeed-insights-performance" variant="outline" size="sm" class="gap-2">
              <UIcon name="i-heroicons-chart-bar" class="w-4 h-4" />
              PageSpeed Insights
            </UButton>
            <UButton to="/tools/lighthouse-report-viewer" variant="outline" size="sm" class="gap-2">
              <UIcon name="i-heroicons-document-chart-bar" class="w-4 h-4" />
              Lighthouse Viewer
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Feedback/FAQ after analysis -->
    <section v-if="analysis" class="px-3 sm:px-6 lg:px-8 pb-12">
      <div class="max-w-6xl mx-auto">
        <ToolFeedback tool-id="json-size" :context="{ hasAnalysis: true }" />
        <ToolFaq :faqs="faqs" color="cyan" />
      </div>
    </section>
  </div>
</template>
