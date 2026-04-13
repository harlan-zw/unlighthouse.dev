<script setup lang="ts">
import type { ParsedHarEntry } from '../../composables/useToolHarReport'

definePageMeta({
  breadcrumb: {
    icon: 'i-heroicons-document-magnifying-glass',
    ariaLabel: 'HAR File Viewer',
  },
})

const faqs = [
  {
    question: 'What is a HAR file?',
    answer: 'A HAR (HTTP Archive) file is a JSON-formatted log of all HTTP transactions between a browser and a website. It records every request and response, including URLs, headers, timing data, status codes, and response sizes. HAR files are used to diagnose network performance issues, debug API calls, and analyze page load behavior.',
  },
  {
    question: 'How do I export a HAR file from Chrome?',
    answer: 'Open Chrome DevTools (F12), go to the Network tab, load your page, then right-click the request list and select "Save all as HAR with content." Alternatively, click the download arrow icon in the Network toolbar. Make sure to check "Preserve log" if you need to capture redirects.',
  },
  {
    question: 'How do I export a HAR file from Firefox?',
    answer: 'Open Firefox DevTools (F12), go to the Network tab, load your page, then click the gear icon and select "Save All As HAR." Firefox HAR exports include the same timing and header data as Chrome exports.',
  },
  {
    question: 'Is my data safe when using this HAR viewer?',
    answer: 'Yes. This viewer runs entirely in your browser — your HAR file is never uploaded to any server. However, OWASP warns that HAR files pose a major security risk as they capture full request payloads, including plaintext passwords in postData and active Cookie session tokens. Never share raw HAR files publicly without first sanitizing sensitive headers.',
  },
  {
    question: 'How do I read a waterfall chart?',
    answer: 'Each horizontal bar represents one HTTP request. The bar is divided into colored phases. A "Staircase" pattern indicates sequential loading, while a "Wall" pattern suggests HTTP/2 or HTTP/3 (QUIC) multiplexing. Long "waiting" (TTFB) bars point to backend bottlenecks, and long "receiving" bars indicate large unoptimized assets. Note that with HTTP/3, connect and SSL phases often collapse into a single 1-RTT event.',
  },
  {
    question: 'Why is my HAR file so large?',
    answer: 'HAR files include full response bodies by default, with binary content (images, fonts) base64-encoded. A typical page load can produce a 5-50MB HAR file. To reduce size, some tools offer options to export without response bodies.',
  },
]

useToolSeo({
  title: 'HAR File Viewer - Analyze HTTP Archive Files Online Free',
  description: 'Free HAR file viewer and network analyzer. Upload HAR files to visualize waterfall charts, request timing, resource breakdown, and protocol analysis. Entirely client-side, no data uploaded.',
  faqs,
})

const { report, error, loading, loadFromFile, loadFromText, clear } = useToolHarReport()

const { trackUse } = useToolTracking('har-viewer')
watch(report, (r) => {
  if (r)
    trackUse()
})

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const pasteText = ref('')
const showPasteModal = ref(false)
const sortKey = ref<'time' | 'size' | 'status' | 'url'>('time')
const sortAsc = ref(false)
const expandedEntry = ref<number | null>(null)

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file)
    loadFromFile(file)
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file)
    loadFromFile(file)
}

function handlePaste() {
  if (pasteText.value.trim()) {
    loadFromText(pasteText.value)
    showPasteModal.value = false
    pasteText.value = ''
  }
}

function loadSample() {
  loading.value = true
  $fetch('/har-sample.json')
    .then((data) => {
      loadFromText(JSON.stringify(data))
    })
    .catch(() => {
      error.value = 'Failed to load sample HAR file'
      loading.value = false
    })
}

function truncateUrl(url: string, maxLen = 60): string {
  const u = new URL(url)
  const path = u.pathname + u.search
  if (path.length <= maxLen)
    return path
  return `${path.slice(0, maxLen - 3)}...`
}

function getStatusBadgeClass(status: number): string {
  if (status >= 200 && status < 300)
    return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
  if (status >= 300 && status < 400)
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  if (status >= 400 && status < 500)
    return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
  if (status >= 500)
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
  return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
}

const timingColors: Record<string, string> = {
  blocked: 'bg-gray-400',
  dns: 'bg-teal-500',
  connect: 'bg-orange-500',
  ssl: 'bg-purple-500',
  send: 'bg-green-500',
  wait: 'bg-blue-500',
  receive: 'bg-cyan-500',
}

const resourceColors: Record<string, string> = {
  script: 'bg-amber-500',
  font: 'bg-purple-500',
  stylesheet: 'bg-blue-500',
  document: 'bg-green-500',
  image: 'bg-pink-500',
  other: 'bg-gray-400',
  media: 'bg-cyan-500',
}

const sortedEntries = computed(() => {
  if (!report.value)
    return []
  const entries = [...report.value.entries]
  const key = sortKey.value
  const asc = sortAsc.value

  entries.sort((a, b) => {
    let cmp = 0
    if (key === 'time')
      cmp = a.time - b.time
    else if (key === 'size')
      cmp = a.transferSize - b.transferSize
    else if (key === 'status')
      cmp = a.status - b.status
    else if (key === 'url')
      cmp = a.url.localeCompare(b.url)
    return asc ? cmp : -cmp
  })
  return entries
})

function toggleSort(key: typeof sortKey.value) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  }
  else {
    sortKey.value = key
    sortAsc.value = key === 'url'
  }
}

function getSortIcon(key: string) {
  if (sortKey.value !== key)
    return 'i-heroicons-arrows-up-down'
  return sortAsc.value ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
}

// Waterfall: show top 100 entries by start time
const waterfallEntries = computed(() => {
  if (!report.value)
    return []
  return [...report.value.entries]
    .sort((a, b) => a.startedDateTime - b.startedDateTime)
    .slice(0, 100)
})

function getTimingBarStyle(entry: ParsedHarEntry) {
  if (!report.value)
    return {}
  const total = report.value.totalTime || 1
  const left = (entry.startedDateTime / total) * 100
  const width = Math.max((entry.time / total) * 100, 0.3)
  return { left: `${left}%`, width: `${width}%` }
}

function getTimingPhaseWidths(entry: ParsedHarEntry) {
  const total = entry.time || 1
  return Object.entries(entry.timings)
    .filter(([_, v]) => v > 0)
    .map(([phase, v]) => ({
      phase,
      width: `${(v / total) * 100}%`,
      color: timingColors[phase] || 'bg-gray-300',
    }))
}
</script>

<template>
  <div class="min-h-screen">
    <ToolPageHero title="HAR File" accent="Viewer" description="Upload a HAR file to analyze network requests, waterfall timing, and resource breakdown. Entirely client-side." color="teal" />

    <ToolCard icon="i-heroicons-document-magnifying-glass" title="HAR File Analyzer" color="teal" max-width="max-w-5xl">
      <div v-if="report" class="flex items-center justify-end gap-1 sm:gap-2 px-4 sm:px-6 py-2">
        <span class="px-2 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
          HAR {{ report.version }}
        </span>
        <span class="px-2 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
          {{ report.totalRequests }} requests
        </span>
        <UButton variant="ghost" color="neutral" size="xs" @click="clear">
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          <span class="hidden sm:inline">Clear</span>
        </UButton>
      </div>

      <!-- Upload Zone -->
      <div v-if="!report && !loading" class="p-6">
        <div
          class="relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer"
          :class="isDragging
            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-teal-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="fileInput?.click()"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".har,.json,application/json"
            class="hidden"
            @change="handleFileSelect"
          >

          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-4">
              <UIcon name="i-heroicons-arrow-up-tray" class="w-8 h-8 text-teal-500" />
            </div>
            <p class="text-base font-medium text-gray-900 dark:text-white mb-2">
              Drop your HAR file here
            </p>
            <p class="text-sm text-gray-500 mb-4">
              or click to browse files
            </p>
            <div class="flex flex-wrap justify-center gap-2">
              <UButton variant="soft" size="sm" color="primary" @click.stop="showPasteModal = true">
                <UIcon name="i-heroicons-clipboard-document" class="w-4 h-4 mr-1" />
                Paste JSON
              </UButton>
              <UButton variant="soft" size="sm" color="neutral" @click.stop="loadSample">
                <UIcon name="i-heroicons-beaker" class="w-4 h-4 mr-1" />
                Load Sample
              </UButton>
            </div>
          </div>
        </div>

        <div class="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <p class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            How to export a HAR file:
          </p>
          <ol class="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
            <li>Open Chrome DevTools (F12) → Network tab</li>
            <li>Reload the page to capture all requests</li>
            <li>Right-click the request list → "Save all as HAR with content"</li>
          </ol>
        </div>
      </div>

      <ToolLoadingPill v-if="loading" message="Parsing HAR file..." color="teal" />

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
      <div v-if="report" class="p-4 sm:p-6 space-y-6">
        <!-- Page Info -->
        <div v-if="report?.pages?.length" class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div class="flex items-center gap-2 min-w-0">
            <UIcon name="i-heroicons-globe-alt" class="w-4 h-4 text-gray-400 shrink-0" />
            <span class="text-sm text-gray-700 dark:text-gray-300 truncate">{{ report.pages[0]?.title }}</span>
          </div>
        </div>

        <!-- Summary Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ report?.totalRequests }}
            </p>
            <p class="text-xs text-gray-500">
              Requests
            </p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ formatBytes(report?.totalTransferSize || 0) }}
            </p>
            <p class="text-xs text-gray-500">
              Transfer Size
            </p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ formatMs(report?.totalTime || 0) }}
            </p>
            <p class="text-xs text-gray-500">
              Total Time
            </p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ report?.domainBreakdown?.length }}
            </p>
            <p class="text-xs text-gray-500">
              Domains
            </p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ (report.cacheStats.hitRate * 100).toFixed(0) }}%
            </p>
            <p class="text-xs text-gray-500">
              Cache Hit Rate
            </p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ formatBytes(report.totalSize) }}
            </p>
            <p class="text-xs text-gray-500">
              Uncompressed
            </p>
          </div>
        </div>

        <!-- Waterfall Chart -->
        <div>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-bars-3" class="w-4 h-4 text-teal-500" />
            Network Waterfall
            <span class="text-xs font-normal text-gray-500">(first {{ waterfallEntries.length }} requests)</span>
          </h2>

          <!-- Timing legend -->
          <div class="flex flex-wrap gap-3 mb-3">
            <div v-for="(color, phase) in timingColors" :key="phase" class="flex items-center gap-1">
              <div class="w-3 h-2 rounded-sm" :class="[color]" />
              <span class="text-[10px] text-gray-500 capitalize">{{ phase === 'wait' ? 'TTFB' : phase }}</span>
            </div>
          </div>

          <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <div class="min-w-[700px]">
              <div
                v-for="(entry, idx) in waterfallEntries"
                :key="idx"
                class="flex items-center gap-2 px-3 py-1 border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 text-xs"
              >
                <!-- URL + status -->
                <div class="w-[280px] shrink-0 flex items-center gap-2 min-w-0">
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0" :class="[getStatusBadgeClass(entry.status)]">
                    {{ entry.status }}
                  </span>
                  <span class="truncate text-gray-700 dark:text-gray-300 font-mono" :title="entry.url">
                    {{ truncateUrl(entry.url, 40) }}
                  </span>
                </div>

                <!-- Timing bar -->
                <div class="flex-1 h-5 relative bg-gray-100 dark:bg-gray-800 rounded-sm overflow-hidden">
                  <div
                    class="absolute top-0 h-full flex rounded-sm overflow-hidden"
                    :style="getTimingBarStyle(entry)"
                  >
                    <div
                      v-for="phase in getTimingPhaseWidths(entry)"
                      :key="phase.phase"
                      :class="phase.color"
                      :style="{ width: phase.width }"
                      class="h-full"
                    />
                  </div>
                </div>

                <!-- Time -->
                <div class="w-[60px] shrink-0 text-right text-gray-500 font-mono">
                  {{ formatMs(entry.time) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Resource Breakdown -->
        <div>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-chart-pie" class="w-4 h-4 text-teal-500" />
            Resource Breakdown
          </h2>

          <!-- Stacked bar -->
          <div class="h-4 rounded-full overflow-hidden flex mb-4">
            <div
              v-for="res in report.resourceBreakdown"
              :key="res.type"
              :class="resourceColors[res.type] || 'bg-gray-400'"
              :style="{ width: `${(res.size / report.totalTransferSize) * 100}%` }"
              class="h-full"
              :title="`${res.label}: ${formatBytes(res.size)}`"
            />
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div
              v-for="res in report.resourceBreakdown"
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
                {{ res.count }} {{ res.count === 1 ? 'request' : 'requests' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Request Table -->
        <div>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-table-cells" class="w-4 h-4 text-teal-500" />
            All Requests
          </h2>

          <div class="rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th class="text-left p-2 font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white" @click="toggleSort('url')">
                    <span class="flex items-center gap-1">URL <UIcon :name="getSortIcon('url')" class="w-3 h-3" /></span>
                  </th>
                  <th class="text-left p-2 font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white w-16" @click="toggleSort('status')">
                    <span class="flex items-center gap-1">Status <UIcon :name="getSortIcon('status')" class="w-3 h-3" /></span>
                  </th>
                  <th class="text-left p-2 font-medium text-gray-600 dark:text-gray-400 w-20">
                    Type
                  </th>
                  <th class="text-right p-2 font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white w-20" @click="toggleSort('size')">
                    <span class="flex items-center justify-end gap-1">Size <UIcon :name="getSortIcon('size')" class="w-3 h-3" /></span>
                  </th>
                  <th class="text-right p-2 font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white w-20" @click="toggleSort('time')">
                    <span class="flex items-center justify-end gap-1">Time <UIcon :name="getSortIcon('time')" class="w-3 h-3" /></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(entry, idx) in sortedEntries" :key="idx">
                  <tr
                    class="border-t border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer"
                    @click="expandedEntry = expandedEntry === idx ? null : idx"
                  >
                    <td class="p-2 font-mono truncate max-w-[300px]" :title="entry.url">
                      <div class="flex items-center gap-1">
                        <UIcon
                          :name="expandedEntry === idx ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                          class="w-3 h-3 shrink-0 text-gray-400"
                        />
                        <span class="truncate">{{ truncateUrl(entry.url, 50) }}</span>
                      </div>
                    </td>
                    <td class="p-2">
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-mono" :class="[getStatusBadgeClass(entry.status)]">
                        {{ entry.status }}
                      </span>
                    </td>
                    <td class="p-2">
                      <span class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                        {{ entry.type }}
                      </span>
                    </td>
                    <td class="p-2 text-right font-mono text-gray-600 dark:text-gray-400">
                      {{ formatBytes(entry.transferSize) }}
                    </td>
                    <td class="p-2 text-right font-mono text-gray-600 dark:text-gray-400">
                      {{ formatMs(entry.time) }}
                    </td>
                  </tr>

                  <!-- Expanded details -->
                  <tr v-if="expandedEntry === idx" class="bg-gray-50 dark:bg-gray-800/30">
                    <td colspan="5" class="p-3">
                      <div class="space-y-3">
                        <!-- Full URL -->
                        <div>
                          <p class="text-[10px] font-medium text-gray-500 mb-1">
                            Full URL
                          </p>
                          <p class="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                            {{ entry.url }}
                          </p>
                        </div>

                        <!-- Timing breakdown -->
                        <div>
                          <p class="text-[10px] font-medium text-gray-500 mb-1">
                            Timing
                          </p>
                          <div class="flex flex-wrap gap-2">
                            <span
                              v-for="(val, phase) in entry.timings"
                              :key="phase"
                              class="px-2 py-0.5 rounded text-[10px] font-mono"
                              :class="val > 0 ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' : 'text-gray-400'"
                            >
                              {{ phase }}: {{ formatMs(val) }}
                            </span>
                          </div>
                        </div>

                        <!-- Info row -->
                        <div class="flex flex-wrap gap-4 text-[10px] text-gray-500">
                          <span>Method: <strong class="text-gray-700 dark:text-gray-300">{{ entry.method }}</strong></span>
                          <span>Protocol: <strong class="text-gray-700 dark:text-gray-300">{{ entry.protocol }}</strong></span>
                          <span>Domain: <strong class="text-gray-700 dark:text-gray-300">{{ entry.domain }}</strong></span>
                          <span v-if="entry.fromCache" class="text-green-600 dark:text-green-400">From Cache</span>
                          <span>Uncompressed: <strong class="text-gray-700 dark:text-gray-300">{{ formatBytes(entry.size) }}</strong></span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Domain Breakdown -->
        <div>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-server-stack" class="w-4 h-4 text-teal-500" />
            Domain Breakdown
          </h2>
          <div class="space-y-2">
            <div
              v-for="domain in report.domainBreakdown.slice(0, 10)"
              :key="domain.domain"
              class="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-gray-900 dark:text-white truncate">
                  {{ domain.domain }}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <div class="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      class="h-full rounded-full bg-teal-500"
                      :style="{ width: `${report.domainBreakdown[0] ? (domain.size / report.domainBreakdown[0].size) * 100 : 0}%` }"
                    />
                  </div>
                </div>
              </div>
              <div class="text-right shrink-0">
                <p class="text-xs font-bold text-gray-900 dark:text-white">
                  {{ formatBytes(domain.size) }}
                </p>
                <p class="text-[10px] text-gray-500">
                  {{ domain.count }} reqs
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Protocol Breakdown -->
        <div>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-signal" class="w-4 h-4 text-teal-500" />
            Protocol Distribution
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              v-for="proto in report.protocolBreakdown"
              :key="proto.protocol"
              class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-center"
            >
              <p class="text-sm font-bold text-gray-900 dark:text-white uppercase">
                {{ proto.protocol }}
              </p>
              <p class="text-lg font-bold text-teal-600 dark:text-teal-400">
                {{ proto.count }}
              </p>
              <p class="text-[10px] text-gray-500">
                {{ ((proto.count / report.totalRequests) * 100).toFixed(0) }}% of requests
              </p>
            </div>
          </div>
        </div>

        <!-- Related Tools CTA -->
        <div class="p-4 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border border-teal-200 dark:border-teal-800">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="text-center sm:text-left">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Want to analyze performance further?
              </p>
              <p class="text-xs text-gray-500">
                Use our Lighthouse tools for deeper performance insights
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <UButton to="/tools/pagespeed-insights-performance" variant="outline" size="sm">
                PageSpeed Insights
              </UButton>
              <UButton to="/tools/lighthouse-report-viewer" variant="outline" size="sm">
                Lighthouse Viewer
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </ToolCard>

    <!-- Educational Content -->
    <section class="px-3 sm:px-6 lg:px-8 pb-12">
      <div class="max-w-6xl mx-auto">
        <!-- How to Read a HAR File -->
        <div class="mb-10 grid lg:grid-cols-2 gap-6 items-start">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold mb-3 text-gray-900 dark:text-white">
              How to Read a HAR File
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              A HAR file logs every HTTP request your browser makes when loading a page. Each entry captures the
              <strong class="text-gray-900 dark:text-white">URL, method, status code, headers, timing data, and response size</strong>.
              The waterfall chart visualizes the sequence and overlap of these requests.
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Focus on requests with long <strong class="text-gray-900 dark:text-white">wait times (TTFB)</strong> — these indicate slow server responses.
              Large <strong class="text-gray-900 dark:text-white">receive phases</strong> point to oversized assets that need compression or optimization.
            </p>
          </div>

          <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Timing Phases Explained
            </h3>
            <div class="space-y-2">
              <div v-for="(color, phase) in timingColors" :key="phase" class="flex items-center gap-3">
                <div class="w-8 h-3 rounded" :class="[color]" />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {{ phase === 'wait' ? 'Waiting (TTFB)' : phase === 'ssl' ? 'SSL/TLS' : phase === 'dns' ? 'DNS Lookup' : phase }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{
                      phase === 'blocked' ? 'Time spent queued before the request could be sent'
                      : phase === 'dns' ? 'Time to resolve the domain name to an IP address'
                        : phase === 'connect' ? 'Time to establish a TCP connection'
                          : phase === 'ssl' ? 'Time for the TLS/SSL handshake'
                            : phase === 'send' ? 'Time to send the HTTP request to the server'
                              : phase === 'wait' ? 'Time waiting for the server to respond (Time to First Byte)'
                                : 'Time to download the response body'
                    }}
                  </p>
                </div>
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
              What to Look For in HAR Files
            </h2>

            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Slow TTFB
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Wait times over 200ms for the main document suggest server-side bottlenecks — slow databases, no caching, or distant servers.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Too Many Requests
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Pages with 80+ requests are above median. Combine scripts, use sprites, and lazy-load below-fold assets.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Missing Compression
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  If transfer size equals uncompressed size for text files, Brotli or Gzip compression isn't enabled on your server.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  HTTP/1.1 Bottlenecks
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Staircase waterfall patterns indicate HTTP/1.1 connection limits. Upgrade to HTTP/2 or HTTP/3 for multiplexing.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Third-Party Bloat
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Check the domain breakdown — third-party scripts (analytics, ads) often account for 30-50% of total page weight.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Low Cache Hit Rate
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  A rate below 30% means most assets aren't cached. Set proper Cache-Control headers for static resources.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Feedback -->
        <ToolFeedback tool-id="har-viewer" :context="{ hasReport: !!report }" />

        <!-- FAQ -->
        <ToolFaq :faqs="faqs" color="cyan" />

        <!-- Related Tools -->
        <div class="text-center mt-12">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Explore more performance tools
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <UButton to="/tools/lighthouse-report-viewer" variant="outline" size="sm" class="gap-2">
              <UIcon name="i-heroicons-document-chart-bar" class="w-4 h-4" />
              Lighthouse Viewer
            </UButton>
            <UButton to="/tools/pagespeed-insights-performance" variant="outline" size="sm" class="gap-2">
              <UIcon name="i-heroicons-chart-bar" class="w-4 h-4" />
              PageSpeed Insights
            </UButton>
            <UButton to="/tools/cwv-checker" variant="outline" size="sm" class="gap-2">
              <UIcon name="i-heroicons-check-badge" class="w-4 h-4" />
              CWV Checker
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Show feedback/FAQ after results too -->
    <section v-if="report" class="px-3 sm:px-6 lg:px-8 pb-12">
      <div class="max-w-6xl mx-auto">
        <ToolFeedback tool-id="har-viewer" :context="{ hasReport: true }" />
        <ToolFaq :faqs="faqs" color="cyan" />
      </div>
    </section>

    <!-- Paste Modal -->
    <UModal v-model:open="showPasteModal">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">
            Paste HAR JSON
          </h3>
          <UTextarea
            v-model="pasteText"
            placeholder="Paste your HAR JSON here..."
            :rows="10"
            :ui="{ root: 'w-full', base: 'font-mono text-xs' }"
          />
          <div class="flex justify-end gap-2 mt-4">
            <UButton variant="ghost" @click="showPasteModal = false">
              Cancel
            </UButton>
            <UButton @click="handlePaste">
              Load HAR
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
