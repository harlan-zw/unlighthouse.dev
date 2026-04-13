<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { MetricId } from '../../composables/useToolLighthouseScoring'
import { useToolLighthouseCalculator } from '../../composables/useToolLighthouseScoring'

definePageMeta({
  breadcrumb: {
    icon: 'i-heroicons-calculator',
    ariaLabel: 'Lighthouse Score Calculator',
  },
})

const faqs = [
  {
    question: 'How does Lighthouse calculate the performance score?',
    answer: 'Lighthouse calculates performance score as a weighted average of six metrics: First Contentful Paint (10%), Speed Index (10%), Largest Contentful Paint (25%), Total Blocking Time (30%), and Cumulative Layout Shift (25%). Each metric is scored 0-100 using log-normal curves based on real-world data from HTTPArchive.',
  },
  {
    question: 'Why do my Lighthouse scores vary between runs?',
    answer: 'Lighthouse scores can vary 5-10 points between runs due to: network conditions, server response time variations, third-party script loading, background processes on your device, and variability in JavaScript execution. Run multiple tests and use the median score for accuracy.',
  },
  {
    question: 'What is a good Lighthouse performance score?',
    answer: 'A score of 90-100 is considered good (green), 50-89 needs improvement (orange), and 0-49 is poor (red). Focus on reaching 90+ but don\'t obsess over perfect 100—the last few points have diminishing returns and normal variance makes it impractical.',
  },
  {
    question: 'Which metrics have the biggest impact on Lighthouse score?',
    answer: 'Total Blocking Time (30%) and Largest Contentful Paint (25%) together account for 55% of your score. CLS adds another 25%. To improve your score quickly, focus on reducing JavaScript execution time (TBT) and optimizing your largest above-the-fold element (LCP).',
  },
  {
    question: 'Why is my PageSpeed Insights score different from Chrome DevTools?',
    answer: 'PageSpeed Insights tests from Google\'s servers with a simulated mobile device, while Chrome DevTools uses your local machine and network. PSI also shows field data from real Chrome users (CrUX) which reflects actual user experience and may differ significantly from lab results.',
  },
]

useToolSeo({
  title: 'Lighthouse Scoring Calculator - Calculate Performance Scores',
  description: 'Free interactive Lighthouse scoring calculator. See how FCP, LCP, TBT, CLS, and Speed Index weights and thresholds determine your Lighthouse performance score. Enter your metrics to calculate your score.',
  faqs,
})

const {
  device,
  values,
  metrics,
  overallScore,
  metricScores,
  reset,
  setMetricValue,
  syncToHash,
  syncFromHash,
} = useToolLighthouseCalculator()

const { trackUse } = useToolTracking('lighthouse-score-calculator')

// Sync from URL on mount
onMounted(() => {
  syncFromHash()
  updateShareUrl()
  window.addEventListener('hashchange', syncFromHash)
})

onUnmounted(() => {
  if (import.meta.client)
    window.removeEventListener('hashchange', syncFromHash)
})

// Sync to URL on changes (debounced)
const syncTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
watch([device, values], () => {
  if (syncTimeout.value)
    clearTimeout(syncTimeout.value)
  syncTimeout.value = setTimeout(() => {
    syncToHash()
    updateShareUrl()
  }, 300)

  trackUse()
}, { deep: true })

// Metric contributions for gauge
const metricContributions = computed(() =>
  metrics.value.map(m => ({
    id: m.id,
    color: m.color,
    weight: m.weight,
    score: metricScores.value[m.id] || 0,
  })),
)

// Reactive share URL
const shareUrl = ref('')
function updateShareUrl() {
  if (import.meta.client)
    shareUrl.value = window.location.href
}

function handleMetricUpdate(id: MetricId, value: number) {
  setMetricValue(id, value)
}

// URL testing
const urlInput = ref('')
const fetchLoading = ref(false)
const fetchError = ref<string | null>(null)
const testedUrl = ref<string | null>(null)

const { current: loadingMessage, progress: loadingProgress, start: startMessages, stop: stopMessages } = useLoadingMessages([
  'Running Lighthouse audit...',
  'Measuring First Contentful Paint...',
  'Analyzing Largest Contentful Paint...',
  'Calculating Total Blocking Time...',
  'Checking Cumulative Layout Shift...',
  'Computing performance score...',
], 2500)

const loadingContainerRef = ref<HTMLElement | ComponentPublicInstance | null>(null)
const { showFloatingLoader } = useToolFloatingLoader(fetchLoading, loadingContainerRef)

const PSI_METRIC_MAP: Record<string, MetricId> = {
  fcp: 'FCP',
  si: 'SI',
  lcp: 'LCP',
  tbt: 'TBT',
  cls: 'CLS',
}

function fetchFromUrl() {
  const url = urlInput.value.trim()
  if (!url || fetchLoading.value)
    return
  fetchError.value = null
  fetchLoading.value = true
  testedUrl.value = null
  startMessages()

  $fetch('/api/tools/pagespeed-insights', {
    query: { url, strategy: device.value },
  })
    .then((result: Record<string, any>) => {
      for (const metric of result.metrics) {
        const calcId = PSI_METRIC_MAP[metric.id]
        if (calcId)
          setMetricValue(calcId, metric.numericValue)
      }
      testedUrl.value = result.fetchedUrl || result.url
      trackUse()
    })
    .catch((err: any) => {
      fetchError.value = err?.data?.message || err.message || 'Failed to fetch PageSpeed data'
    })
    .finally(() => {
      fetchLoading.value = false
      stopMessages()
    })
}
</script>

<template>
  <div class="min-h-screen">
    <ToolFloatingLoader :show="fetchLoading && showFloatingLoader" :message="loadingMessage" />

    <ToolPageHero title="Lighthouse Score" accent="Calculator" description="See exactly how each metric contributes to your performance score." color="violet" />

    <!-- Calculator -->
    <section class="px-3 sm:px-6 lg:px-8 pb-12">
      <div class="max-w-4xl mx-auto">
        <div class="space-y-6 sm:space-y-8">
          <!-- URL test -->
          <div class="p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <UIcon name="i-heroicons-globe-alt" class="w-4 h-4 text-violet-500" />
              Import from PageSpeed Insights
            </h2>
            <form class="flex flex-col sm:flex-row gap-3" @submit.prevent="fetchFromUrl">
              <UInput
                v-model="urlInput"
                placeholder="Enter URL to fetch real metrics..."
                size="lg"
                class="flex-1"
                icon="i-heroicons-link"
                :disabled="fetchLoading"
              />
              <UButton
                type="submit"
                :loading="fetchLoading"
                color="primary"
                size="lg"
                class="sm:w-auto"
              >
                Fetch Metrics
              </UButton>
            </form>
            <ToolLoadingPill v-if="fetchLoading" ref="loadingContainerRef" :progress="loadingProgress" :message="loadingMessage" color="violet" hint="Fetching real metrics from PageSpeed Insights." />

            <p v-if="fetchError" class="mt-2 text-xs text-red-500 pl-1">
              {{ fetchError }}
            </p>

            <!-- Tested URL indicator -->
            <Transition
              enter-active-class="transition-all duration-300"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
            >
              <p v-if="testedUrl && !fetchLoading" class="mt-2 flex items-center gap-1.5 text-xs text-gray-500 pl-1">
                <UIcon name="i-heroicons-check-circle-solid" class="w-3.5 h-3.5 text-green-500 shrink-0" />
                Loaded from <span class="font-medium text-gray-700 dark:text-gray-300 truncate">{{ testedUrl }}</span>
                <span class="text-gray-400">&mdash; adjust sliders to explore what-if scenarios</span>
              </p>
            </Transition>
          </div>

          <div class="relative bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl ring-1 transition-all duration-500" :class="fetchLoading ? 'ring-violet-500/40' : 'ring-gray-200 dark:ring-gray-800'">
            <!-- Device toggle header -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-device-phone-mobile" class="w-4 h-4 text-violet-500" />
                <span class="text-sm font-semibold">Lighthouse v13 Scoring</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="inline-flex rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <UButton
                    :color="device === 'mobile' ? 'primary' : 'neutral'"
                    :variant="device === 'mobile' ? 'solid' : 'ghost'"
                    size="xs"
                    rounded="none"
                    @click="device = 'mobile'"
                  >
                    <UIcon name="i-heroicons-device-phone-mobile" class="w-3.5 h-3.5 mr-1" />
                    Mobile
                  </UButton>
                  <UButton
                    :color="device === 'desktop' ? 'primary' : 'neutral'"
                    :variant="device === 'desktop' ? 'solid' : 'ghost'"
                    size="xs"
                    rounded="none"
                    @click="device = 'desktop'"
                  >
                    <UIcon name="i-heroicons-computer-desktop" class="w-3.5 h-3.5 mr-1" />
                    Desktop
                  </UButton>
                </div>
                <UButton variant="ghost" color="neutral" size="xs" @click="reset()">
                  Reset
                </UButton>
              </div>
            </div>

            <div class="grid lg:grid-cols-2 gap-0">
              <!-- Score Gauge -->
              <div class="p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <ToolLighthouseGauge
                  :score="overallScore"
                  :metrics="metricContributions"
                />
              </div>

              <!-- Metric Sliders -->
              <div class="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5">
                <ToolLighthouseMetricSlider
                  v-for="metric in metrics"
                  :key="metric.id"
                  :metric="metric"
                  :value="values[metric.id]"
                  :score="metricScores[metric.id]"
                  @update:value="(v) => handleMetricUpdate(metric.id, v)"
                />
              </div>
            </div>

            <!-- Score Breakdown Bar -->
            <div class="px-3 sm:px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <!-- Metric contributions -->
                <div class="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0">
                  <div
                    v-for="metric in metrics"
                    :key="metric.id"
                    class="flex items-center gap-1 shrink-0"
                  >
                    <span
                      class="size-2 rounded-full"
                      :style="{ backgroundColor: metric.color }"
                    />
                    <span class="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">{{ metric.id }}</span>
                    <span class="text-[10px] sm:text-xs font-mono font-semibold" :style="{ color: metric.color }">
                      +{{ Math.round(metric.weight * (metricScores[metric.id] || 0) * 100) }}
                    </span>
                  </div>
                </div>

                <!-- Total score -->
                <div class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <span class="text-[10px] sm:text-xs text-gray-500">=</span>
                  <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <span class="text-sm font-bold tabular-nums">{{ Math.round(overallScore * 100) }}</span>
                    <span class="text-[10px] sm:text-xs text-gray-500">/ 100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Metric Documentation -->
        <div class="mt-12 sm:mt-16 space-y-8 sm:space-y-12">
          <div class="text-center max-w-2xl mx-auto">
            <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Understanding the Metrics
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              Lighthouse performance score is a weighted average of these five key metrics. Improving any of them will raise your overall score.
            </p>
          </div>

          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div
              v-for="metric in metrics"
              :key="metric.id"
              class="p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            >
              <div class="flex items-center gap-3 mb-4">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  :style="{ backgroundColor: metric.color }"
                >
                  {{ metric.id }}
                </div>
                <div>
                  <h3 class="font-bold text-gray-900 dark:text-white">
                    {{ metric.name }}
                  </h3>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      Weight: {{ Math.round(metric.weight * 100) }}%
                    </span>
                    <span v-if="metric.isCWV" class="text-[10px] font-bold tracking-wider uppercase text-violet-600 dark:text-violet-400">
                      Core Web Vital
                    </span>
                  </div>
                </div>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {{ metric.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- FAQ -->
        <div class="mt-16 sm:mt-24 pt-12 border-t border-gray-200 dark:border-gray-800">
          <div class="max-w-3xl mx-auto">
            <h2 class="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">
              Frequently Asked Questions
            </h2>
            <div class="space-y-6">
              <div v-for="(faq, i) in faqs" :key="i" class="space-y-2">
                <h3 class="font-bold text-gray-900 dark:text-white flex items-start gap-2">
                  <UIcon name="i-heroicons-question-mark-circle" class="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                  {{ faq.question }}
                </h3>
                <p class="text-gray-600 dark:text-gray-400 pl-7 text-sm sm:text-base leading-relaxed">
                  {{ faq.answer }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- CTAs -->
        <div class="mt-16 sm:mt-24 p-6 sm:p-10 rounded-3xl bg-violet-600 text-white text-center">
          <h2 class="text-2xl sm:text-3xl font-bold mb-4">
            Optimize Your Real-World Scores
          </h2>
          <p class="text-violet-100 max-w-xl mx-auto mb-8">
            Lighthouse is a lab test. For production sites, use our free tools to check your real Chrome User Experience data.
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <UButton to="/guide/getting-started/installation" color="neutral" variant="subtle" size="sm">
              Setup Unlighthouse
            </UButton>
            <UButton to="/learn-lighthouse/core-web-vitals" variant="outline" color="neutral" size="sm">
              Learn Web Vitals
            </UButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
