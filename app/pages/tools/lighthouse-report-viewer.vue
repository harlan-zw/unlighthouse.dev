<script setup lang="ts">
import { useLighthouseReport } from '~/composables/useLighthouseReport'

definePageMeta({
  breadcrumb: {
    icon: 'i-heroicons-document-chart-bar',
    ariaLabel: 'Lighthouse Report Viewer',
  },
})

const faqs = [
  {
    question: 'How do I view a Lighthouse JSON report?',
    answer: 'Upload your Lighthouse JSON file by dragging and dropping it onto this page, clicking the upload area, or pasting the JSON content directly. The viewer will parse and display your performance scores, metrics, and audit results in an interactive format.',
  },
  {
    question: 'How do I export a Lighthouse report as JSON?',
    answer: 'In Chrome DevTools, run a Lighthouse audit then click "Save as JSON" in the report header. From the command line, run: npx lighthouse <url> --output=json --output-path=report.json. The PageSpeed Insights API also returns JSON that works with this viewer.',
  },
  {
    question: 'What information does a Lighthouse JSON report contain?',
    answer: 'Lighthouse reports include performance scores (0-100), Core Web Vitals metrics (LCP, CLS, TBT), detailed audit results for performance, accessibility, best practices, SEO, and PWA categories, plus timing data, screenshots, and optimization opportunities.',
  },
  {
    question: 'Can I compare multiple Lighthouse reports?',
    answer: 'This viewer shows one report at a time. For comparing reports over time, consider Lighthouse CI which stores historical data, or export multiple JSON reports and compare the metrics manually. The Unlighthouse CLI can scan your entire site and track changes.',
  },
  {
    question: 'Why use a Lighthouse report viewer instead of the HTML report?',
    answer: 'JSON reports are smaller, easier to store, and work better with automation. This viewer provides the same visual experience as HTML reports, with additional features like dark mode, better mobile support, and the ability to quickly inspect specific audits.',
  },
]

useToolSeo({
  title: 'Lighthouse Report Viewer - Upload & Analyze JSON Reports',
  description: 'Free Lighthouse JSON report viewer. Upload and visualize your Lighthouse audit results with interactive scores, metrics, and detailed breakdowns.',
  faqs,
})

const { report, error, loading, loadFromFile, loadFromText, clear } = useLighthouseReport()

// Track tool usage
const hasTrackedView = ref(false)
onMounted(() => {
  if (!hasTrackedView.value) {
    hasTrackedView.value = true
    $fetch('/api/tools/track', {
      method: 'POST',
      body: { tool: 'lighthouse-report-viewer', action: 'view' },
    }).catch(() => {})
  }
})

// Track when a report is loaded
watch(report, (newReport) => {
  if (newReport) {
    $fetch('/api/tools/track', {
      method: 'POST',
      body: { tool: 'lighthouse-report-viewer', action: 'use' },
    }).catch(() => {})
  }
})

const dropzone = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const pasteText = ref('')
const showPasteModal = ref(false)

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file && file.type === 'application/json') {
    loadFromFile(file)
  }
  else if (file) {
    error.value = 'Please upload a JSON file'
  }
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    loadFromFile(file)
  }
}

function handlePaste() {
  if (pasteText.value.trim()) {
    loadFromText(pasteText.value)
    showPasteModal.value = false
    pasteText.value = ''
  }
}

// Category data for display
const categoryDisplayData = computed(() => {
  if (!report.value)
    return []

  return [
    { id: 'performance', label: 'Performance', icon: 'i-heroicons-bolt', category: report.value.categories.performance },
    { id: 'accessibility', label: 'Accessibility', icon: 'i-heroicons-eye', category: report.value.categories.accessibility },
    { id: 'best-practices', label: 'Best Practices', icon: 'i-heroicons-check-badge', category: report.value.categories.bestPractices },
    { id: 'seo', label: 'SEO', icon: 'i-heroicons-magnifying-glass', category: report.value.categories.seo },
    { id: 'pwa', label: 'PWA', icon: 'i-heroicons-device-phone-mobile', category: report.value.categories.pwa },
  ].filter(c => c.category !== null)
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
            Lighthouse Report
            <span class="text-violet-600 dark:text-violet-400">Viewer</span>
          </h1>
          <p
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4, delay: 0.1 }"
            class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto"
          >
            Upload a Lighthouse JSON report to explore scores, metrics, and audits interactively.
          </p>
          <template #fallback>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.1] text-gray-900 dark:text-white mb-3">
              Lighthouse Report
              <span class="text-violet-600 dark:text-violet-400">Viewer</span>
            </h1>
            <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Upload a Lighthouse JSON report to explore scores, metrics, and audits interactively.
            </p>
          </template>
        </ClientOnly>
      </div>
    </section>

    <!-- Upload / Results Section -->
    <section class="px-3 sm:px-6 lg:px-8 pb-12">
      <div class="max-w-5xl mx-auto">
        <div class="relative">
          <!-- Glow effect -->
          <div class="absolute -inset-4 bg-gradient-to-b from-violet-500/10 via-violet-500/5 to-transparent rounded-3xl blur-3xl pointer-events-none" />

          <div class="relative bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
            <!-- Header -->
            <div class="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-document-chart-bar" class="w-4 h-4 text-violet-500" />
                <span class="text-sm font-semibold">Report Viewer</span>
              </div>
              <div v-if="report" class="flex items-center gap-1 sm:gap-2">
                <span class="hidden sm:inline px-2 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                  v{{ report.version }}
                </span>
                <span class="px-2 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full capitalize">
                  {{ report.device }}
                </span>
                <UButton variant="ghost" color="neutral" size="xs" @click="clear">
                  <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                  <span class="hidden sm:inline">Clear</span>
                </UButton>
              </div>
            </div>

            <!-- Upload Zone (when no report) -->
            <div v-if="!report && !loading" class="p-6">
              <!-- Dropzone -->
              <div
                ref="dropzone"
                class="relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer"
                :class="isDragging
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-gray-300 dark:border-gray-700 hover:border-violet-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleDrop"
                @click="fileInput?.click()"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept=".json,application/json"
                  class="hidden"
                  @change="handleFileSelect"
                >

                <div class="flex flex-col items-center">
                  <div class="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                    <UIcon name="i-heroicons-arrow-up-tray" class="w-8 h-8 text-violet-500" />
                  </div>
                  <p class="text-base font-medium text-gray-900 dark:text-white mb-2">
                    Drop your Lighthouse JSON here
                  </p>
                  <p class="text-sm text-gray-500 mb-4">
                    or click to browse files
                  </p>
                  <div class="flex flex-wrap justify-center gap-2">
                    <UButton variant="soft" size="sm" color="neutral" @click.stop="showPasteModal = true">
                      <UIcon name="i-heroicons-clipboard-document" class="w-4 h-4 mr-1" />
                      Paste JSON
                    </UButton>
                  </div>
                </div>
              </div>

              <!-- How to get JSON -->
              <div class="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <p class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  How to export Lighthouse JSON:
                </p>
                <ol class="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Open Chrome DevTools (F12)</li>
                  <li>Go to the Lighthouse tab</li>
                  <li>Run an audit</li>
                  <li>Click "Export" → "Save as JSON"</li>
                </ol>
              </div>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="p-12 text-center">
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-violet-500 animate-spin mx-auto mb-4" />
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Parsing report...
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
            <div v-if="report" class="p-4 sm:p-6 space-y-6">
              <!-- URL & Time -->
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div class="flex items-center gap-2 min-w-0">
                  <UIcon name="i-heroicons-globe-alt" class="w-4 h-4 text-gray-400 shrink-0" />
                  <a :href="report.url" target="_blank" class="text-sm text-violet-600 dark:text-violet-400 hover:underline truncate">
                    {{ report.url }}
                  </a>
                </div>
                <div class="text-xs text-gray-500 shrink-0">
                  {{ report.fetchTime.toLocaleString() }}
                </div>
              </div>

              <!-- Category Scores -->
              <div>
                <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <UIcon name="i-heroicons-chart-pie" class="w-4 h-4 text-violet-500" />
                  Category Scores
                </h2>
                <CategoryScores :categories="categoryDisplayData" />
              </div>

              <!-- Performance Metrics -->
              <div v-if="report.performanceMetrics.length">
                <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <UIcon name="i-heroicons-clock" class="w-4 h-4 text-violet-500" />
                  Performance Metrics
                </h2>
                <MetricsPanel :metrics="report.performanceMetrics" />
              </div>

              <!-- Opportunities -->
              <div v-if="report.opportunities.length">
                <AuditList
                  :audits="report.opportunities"
                  title="Opportunities"
                  icon="i-heroicons-light-bulb"
                  empty-message="No optimization opportunities found"
                />
              </div>

              <!-- Diagnostics -->
              <div v-if="report.diagnostics.length">
                <AuditList
                  :audits="report.diagnostics"
                  title="Diagnostics"
                  icon="i-heroicons-wrench-screwdriver"
                  empty-message="No diagnostic issues found"
                />
              </div>

              <!-- Passed Audits -->
              <div v-if="report.passedAudits.length">
                <AuditList
                  :audits="report.passedAudits"
                  title="Passed Audits"
                  icon="i-heroicons-check-circle"
                  empty-message="No passed audits"
                />
              </div>

              <!-- Screenshot -->
              <div v-if="report.screenshot" class="pt-4 border-t border-gray-200 dark:border-gray-800">
                <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <UIcon name="i-heroicons-photo" class="w-4 h-4 text-violet-500" />
                  Page Screenshot
                </h2>
                <div class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 max-h-[400px] overflow-y-auto">
                  <img
                    :src="report.screenshot.data"
                    :width="report.screenshot.width"
                    :height="report.screenshot.height"
                    alt="Page screenshot"
                    class="w-full h-auto"
                  >
                </div>
              </div>

              <!-- Related Tools CTA -->
              <div class="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800">
                <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div class="text-center sm:text-left">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      Want to investigate specific issues?
                    </p>
                    <p class="text-xs text-gray-500">
                      Use our specialized tools for deeper analysis
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <UButton to="/tools/lcp-finder" variant="outline" size="sm">
                      LCP Finder
                    </UButton>
                    <UButton to="/tools/cls-debugger" variant="outline" size="sm">
                      CLS Debugger
                    </UButton>
                    <UButton to="/tools/lighthouse-score-calculator" variant="outline" size="sm">
                      Score Calculator
                    </UButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Educational Content -->
    <section class="px-3 sm:px-6 lg:px-8 pb-12">
      <div class="max-w-6xl mx-auto">
        <!-- How to Read -->
        <div class="mb-10 grid lg:grid-cols-2 gap-6 items-start">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold mb-3 text-gray-900 dark:text-white">
              How to Read a Lighthouse Report
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              Lighthouse audits your page across five categories. Each category receives a score from 0-100, with
              <strong class="text-gray-900 dark:text-white">90+</strong> being good,
              <strong class="text-gray-900 dark:text-white">50-89</strong> needing improvement, and
              <strong class="text-gray-900 dark:text-white">below 50</strong> being poor.
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Focus on <strong class="text-gray-900 dark:text-white">Performance</strong> first—it directly impacts user experience and SEO.
              Within Performance, prioritize the <strong class="text-gray-900 dark:text-white">Opportunities</strong> section,
              which shows specific improvements with estimated savings.
            </p>
          </div>

          <!-- Categories Quick Reference -->
          <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Category Quick Reference
            </h3>
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <UIcon name="i-heroicons-bolt" class="w-4 h-4 text-violet-500" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    Performance
                  </p>
                  <p class="text-xs text-gray-500">
                    Loading speed, interactivity, visual stability
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <UIcon name="i-heroicons-eye" class="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    Accessibility
                  </p>
                  <p class="text-xs text-gray-500">
                    Screen readers, contrast, keyboard navigation
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <UIcon name="i-heroicons-check-badge" class="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    Best Practices
                  </p>
                  <p class="text-xs text-gray-500">
                    Security, modern APIs, image optimization
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    SEO
                  </p>
                  <p class="text-xs text-gray-500">
                    Meta tags, crawlability, mobile-friendliness
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                  <UIcon name="i-heroicons-device-phone-mobile" class="w-4 h-4 text-pink-500" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    PWA
                  </p>
                  <p class="text-xs text-gray-500">
                    Installability, offline support, app-like experience
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tips Section -->
        <div class="mb-12 relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div class="p-5 sm:p-6">
            <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600">
                <UIcon name="i-heroicons-light-bulb" class="w-4 h-4 text-white" />
              </span>
              Pro Tips for Improving Your Score
            </h2>

            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Start with Quick Wins
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Focus on opportunities with the highest estimated savings first. Image optimization and unused code are often easy fixes.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Test Multiple Times
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Lighthouse scores can vary between runs. Test 3-5 times and average the results for a more accurate picture.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Prioritize Core Web Vitals
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  LCP, CLS, and INP directly affect search rankings. Focus on getting these green before other optimizations.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Test on Mobile
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Google uses mobile-first indexing. Your mobile score matters more than desktop for SEO.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Check Field Data
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Lab data (Lighthouse) is synthetic. Check Chrome UX Report for real-world user experience data.
                </p>
              </div>

              <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Don't Chase 100
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  Diminishing returns after 90. A score of 90+ is excellent—spend time on features, not micro-optimizations.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- FAQ Section -->
        <ToolFaq :faqs="faqs" color="purple" />

        <!-- Related Tools -->
        <div class="text-center mt-12">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Explore more Lighthouse tools
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <UButton to="/tools/lighthouse-score-calculator" variant="outline" size="sm" class="gap-2">
              <UIcon name="i-heroicons-calculator" class="w-4 h-4" />
              Score Calculator
            </UButton>
            <UButton to="/tools/pagespeed-insights-performance" variant="outline" size="sm" class="gap-2">
              <UIcon name="i-heroicons-chart-bar" class="w-4 h-4" />
              PageSpeed Insights
            </UButton>
            <UButton to="/learn-lighthouse" variant="outline" size="sm" class="gap-2">
              <UIcon name="i-heroicons-academic-cap" class="w-4 h-4" />
              Learn Lighthouse
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Paste Modal -->
    <UModal v-model:open="showPasteModal">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">
            Paste Lighthouse JSON
          </h3>
          <UTextarea
            v-model="pasteText"
            placeholder="Paste your Lighthouse JSON here..."
            :rows="10"
            class="font-mono text-xs"
          />
          <div class="flex justify-end gap-2 mt-4">
            <UButton variant="ghost" @click="showPasteModal = false">
              Cancel
            </UButton>
            <UButton @click="handlePaste">
              Load Report
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
