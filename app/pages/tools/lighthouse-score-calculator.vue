<script setup lang="ts">
import type { MetricId } from '~/composables/useLighthouseScoring'
import { motion } from 'motion-v'
import { useLighthouseCalculator } from '~/composables/useLighthouseScoring'

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
  title: 'Lighthouse Score Calculator - How Performance Scores Work',
  description: 'Interactive Lighthouse performance score calculator. Understand how FCP, LCP, TBT, CLS, and Speed Index weights and thresholds determine your score.',
  faqs,
})

const calc = useLighthouseCalculator()

// Track tool usage
const hasTrackedView = ref(false)
const hasTrackedUse = ref(false)

// Sync from URL on mount
onMounted(() => {
  calc.syncFromHash()

  // Listen for hash changes
  window.addEventListener('hashchange', calc.syncFromHash)

  // Track view
  if (!hasTrackedView.value) {
    hasTrackedView.value = true
    $fetch('/api/tools/track', {
      method: 'POST',
      body: { tool: 'lighthouse-score-calculator', action: 'view' },
    }).catch(() => {})
  }
})

onUnmounted(() => {
  if (import.meta.client)
    window.removeEventListener('hashchange', calc.syncFromHash)
})

// Sync to URL on changes (debounced)
const syncTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
watch([calc.device, calc.values], () => {
  if (syncTimeout.value)
    clearTimeout(syncTimeout.value)
  syncTimeout.value = setTimeout(calc.syncToHash, 300)

  // Track first use
  if (!hasTrackedUse.value) {
    hasTrackedUse.value = true
    $fetch('/api/tools/track', {
      method: 'POST',
      body: { tool: 'lighthouse-score-calculator', action: 'use' },
    }).catch(() => {})
  }
}, { deep: true })

// Metric contributions for gauge
const metricContributions = computed(() =>
  calc.metrics.value.map(m => ({
    id: m.id,
    color: m.color,
    weight: m.weight,
    score: calc.metricScores.value[m.id] || 0,
  })),
)

function handleMetricUpdate(id: MetricId, value: number) {
  calc.setMetricValue(id, value)
}
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
            Lighthouse Score
            <span class="text-violet-600 dark:text-violet-400">Calculator</span>
          </motion.h1>
          <motion.p
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.4, delay: 0.1 }"
            class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto"
          >
            See exactly how each metric contributes to your performance score.
          </motion.p>
          <template #fallback>
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.1] text-gray-900 dark:text-white mb-3">
              Lighthouse Score
              <span class="text-violet-600 dark:text-violet-400">Calculator</span>
            </h1>
            <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              See exactly how each metric contributes to your performance score.
            </p>
          </template>
        </ClientOnly>
      </div>
    </section>

    <!-- Calculator -->
    <section class="px-3 sm:px-6 lg:px-8 pb-12">
      <div class="max-w-5xl mx-auto">
        <div class="relative">
          <!-- Glow effect -->
          <div class="absolute -inset-4 bg-gradient-to-b from-violet-500/10 via-violet-500/5 to-transparent rounded-3xl blur-3xl pointer-events-none" />

          <div class="relative bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
            <!-- Device toggle header -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-device-phone-mobile" class="w-4 h-4 text-violet-500" />
                <span class="text-sm font-semibold">Lighthouse v10+ Scoring</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="inline-flex rounded-md border border-(--ui-border) overflow-hidden">
                  <UButton
                    :color="calc.device.value === 'mobile' ? 'primary' : 'neutral'"
                    :variant="calc.device.value === 'mobile' ? 'solid' : 'ghost'"
                    size="xs"
                    :ui="{ rounded: 'rounded-none' }"
                    @click="calc.device.value = 'mobile'"
                  >
                    <UIcon name="i-heroicons-device-phone-mobile" class="w-3.5 h-3.5 mr-1" />
                    Mobile
                  </UButton>
                  <UButton
                    :color="calc.device.value === 'desktop' ? 'primary' : 'neutral'"
                    :variant="calc.device.value === 'desktop' ? 'solid' : 'ghost'"
                    size="xs"
                    :ui="{ rounded: 'rounded-none' }"
                    @click="calc.device.value = 'desktop'"
                  >
                    <UIcon name="i-heroicons-computer-desktop" class="w-3.5 h-3.5 mr-1" />
                    Desktop
                  </UButton>
                </div>
                <UButton variant="ghost" color="neutral" size="xs" @click="calc.reset()">
                  Reset
                </UButton>
              </div>
            </div>

            <div class="grid lg:grid-cols-2 gap-0">
              <!-- Score Gauge -->
              <div class="p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <LighthouseGauge
                  :score="calc.overallScore.value"
                  :metrics="metricContributions"
                />
              </div>

              <!-- Metric Sliders -->
              <div class="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5">
                <LighthouseMetricSlider
                  v-for="metric in calc.metrics.value"
                  :key="metric.id"
                  :metric="metric"
                  :value="calc.values.value[metric.id]"
                  :score="calc.metricScores.value[metric.id]"
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
                    v-for="metric in calc.metrics.value"
                    :key="metric.id"
                    class="flex items-center gap-1 shrink-0"
                  >
                    <span
                      class="size-2 rounded-full"
                      :style="{ backgroundColor: metric.color }"
                    />
                    <span class="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">{{ metric.id }}</span>
                    <span class="text-[10px] sm:text-xs font-mono font-semibold" :style="{ color: metric.color }">
                      +{{ Math.round(metric.weight * (calc.metricScores.value[metric.id] || 0) * 100) }}
                    </span>
                  </div>
                </div>

                <!-- Total score -->
                <div class="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <span class="text-[10px] sm:text-xs text-gray-500">=</span>
                  <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <span class="text-sm font-bold tabular-nums">{{ Math.round(calc.overallScore.value * 100) }}</span>
                    <span class="text-[10px] sm:text-xs text-gray-500">/ 100</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Share URL -->
            <div class="px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
              <div class="flex items-center gap-1.5 sm:gap-2">
                <UIcon name="i-heroicons-link" class="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span class="text-[10px] sm:text-xs text-gray-500 shrink-0">Share:</span>
                <ClientOnly>
                  <code class="flex-1 font-mono text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-500 truncate">
                    {{ typeof window !== 'undefined' ? window.location.href : '' }}
                  </code>
                  <template #fallback>
                    <span class="text-[10px] text-gray-400">Loading...</span>
                  </template>
                </ClientOnly>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Educational Content -->
    <section class="px-3 sm:px-6 lg:px-8 pb-12">
      <div class="max-w-6xl mx-auto">
        <!-- How Lighthouse Calculates - Two Column Layout -->
        <div class="mb-10 grid lg:grid-cols-[1fr_500px] gap-6 lg:gap-14 items-start">
          <!-- Left: Text Content -->
          <div>
            <h2 class="text-xl sm:text-2xl font-bold mb-3 text-gray-900 dark:text-white">
              How Lighthouse Calculates Your Performance Score
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              Lighthouse calculates your performance score using a <strong class="text-gray-900 dark:text-white">weighted average</strong> of five key metrics.
              Each metric is scored from 0-100 using a <a href="https://developer.chrome.com/docs/lighthouse/performance/performance-scoring" target="_blank" class="text-violet-600 dark:text-violet-400 hover:underline">log-normal distribution</a> based on real-world performance data from the <a href="https://httparchive.org/" target="_blank" class="text-violet-600 dark:text-violet-400 hover:underline">HTTP Archive</a>.
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              The scoring algorithm converts raw metric values (like milliseconds or unitless shift scores) into a 0-100 score using statistical curves.
              A metric value at the <strong class="text-gray-900 dark:text-white">10th percentile</strong> of all sites scores 90 (good), while the <strong class="text-gray-900 dark:text-white">median</strong> scores 50. This means your score reflects how your site compares to others on the web.
            </p>
          </div>

          <!-- Right: Score Weights Visualization -->
          <div class="relative bg-gray-900 rounded-xl p-4 overflow-hidden">
            <!-- Background glow effects -->
            <div class="absolute top-0 left-1/4 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl" />
            <div class="absolute bottom-0 right-1/4 w-24 h-24 bg-violet-600/15 rounded-full blur-2xl" />

            <div class="relative">
              <h3 class="text-xs font-semibold text-white mb-3 flex items-center gap-1.5">
                <UIcon name="i-heroicons-chart-bar" class="w-3.5 h-3.5 text-violet-400" />
                v10+ Score Weights
              </h3>

              <!-- Weight bars -->
              <div class="space-y-2.5">
                <!-- TBT - 30% -->
                <div class="group">
                  <div class="flex items-center justify-between mb-0.5">
                    <div class="flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-violet-700" />
                      <span class="text-[10px] text-white font-medium">TBT</span>
                    </div>
                    <span class="text-[10px] text-violet-300 font-mono font-bold">30%</span>
                  </div>
                  <div class="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-violet-700 to-violet-500 rounded-full" style="width: 100%" />
                  </div>
                </div>

                <!-- LCP - 25% -->
                <div class="group">
                  <div class="flex items-center justify-between mb-0.5">
                    <div class="flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-violet-600" />
                      <span class="text-[10px] text-white font-medium">LCP</span>
                      <span class="px-0.5 text-[8px] font-medium bg-violet-500/20 text-violet-300 rounded">CWV</span>
                    </div>
                    <span class="text-[10px] text-violet-300 font-mono font-bold">25%</span>
                  </div>
                  <div class="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full" style="width: 83%" />
                  </div>
                </div>

                <!-- CLS - 25% -->
                <div class="group">
                  <div class="flex items-center justify-between mb-0.5">
                    <div class="flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-violet-300" />
                      <span class="text-[10px] text-white font-medium">CLS</span>
                      <span class="px-0.5 text-[8px] font-medium bg-violet-500/20 text-violet-300 rounded">CWV</span>
                    </div>
                    <span class="text-[10px] text-violet-300 font-mono font-bold">25%</span>
                  </div>
                  <div class="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-violet-400 to-violet-300 rounded-full" style="width: 83%" />
                  </div>
                </div>

                <!-- FCP - 10% -->
                <div class="group">
                  <div class="flex items-center justify-between mb-0.5">
                    <div class="flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      <span class="text-[10px] text-white font-medium">FCP</span>
                    </div>
                    <span class="text-[10px] text-violet-300 font-mono font-bold">10%</span>
                  </div>
                  <div class="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full" style="width: 33%" />
                  </div>
                </div>

                <!-- SI - 10% -->
                <div class="group">
                  <div class="flex items-center justify-between mb-0.5">
                    <div class="flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      <span class="text-[10px] text-white font-medium">SI</span>
                    </div>
                    <span class="text-[10px] text-violet-300 font-mono font-bold">10%</span>
                  </div>
                  <div class="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-violet-500 to-violet-300 rounded-full" style="width: 33%" />
                  </div>
                </div>
              </div>

              <!-- Key insight -->
              <div class="mt-3 pt-2.5 border-t border-gray-800">
                <p class="text-[10px] text-gray-400">
                  <strong class="text-white">80%</strong> of your score comes from TBT, LCP, and CLS.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Scoring Algorithm Explanation -->
        <div class="mb-12 p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <h3 class="text-base font-bold mb-3 flex items-center gap-2">
            <UIcon name="i-heroicons-calculator" class="w-4 h-4 text-violet-500" />
            The Log-Normal Scoring Algorithm
          </h3>

          <div class="grid lg:grid-cols-2 gap-5">
            <!-- Explanation -->
            <div class="space-y-3 text-xs text-gray-600 dark:text-gray-400">
              <p>
                Lighthouse doesn't use simple linear scoring. Instead, it applies a <strong class="text-gray-900 dark:text-white">log-normal distribution</strong> to convert raw metric values into scores. This statistical approach means:
              </p>
              <ul class="list-disc list-inside space-y-1.5 ml-2">
                <li>
                  <strong class="text-gray-900 dark:text-white">Diminishing returns</strong> — Improving from 95 to 100 requires more effort than 50 to 55
                </li>
                <li>
                  <strong class="text-gray-900 dark:text-white">Based on real data</strong> — Curves calibrated against millions of real websites
                </li>
                <li>
                  <strong class="text-gray-900 dark:text-white">Percentile-based</strong> — Score of 90 means better than 90% of sites
                </li>
              </ul>
              <p>
                Each metric has two key control points: the <strong class="text-gray-900 dark:text-white">p10 value</strong> (scores 90) and the <strong class="text-gray-900 dark:text-white">median</strong> (scores 50).
              </p>
            </div>

            <!-- Scoring Curve Graph -->
            <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">
                LCP Scoring Curve (Example)
              </div>
              <svg viewBox="0 0 300 180" class="w-full h-auto">
                <!-- Grid lines -->
                <defs>
                  <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#22c55e" />
                    <stop offset="40%" stop-color="#f59e0b" />
                    <stop offset="100%" stop-color="#ef4444" />
                  </linearGradient>
                </defs>

                <!-- Background zones -->
                <rect x="40" y="10" width="75" height="140" fill="#22c55e" fill-opacity="0.1" />
                <rect x="115" y="10" width="55" height="140" fill="#f59e0b" fill-opacity="0.1" />
                <rect x="170" y="10" width="120" height="140" fill="#ef4444" fill-opacity="0.1" />

                <!-- Axes -->
                <line x1="40" y1="150" x2="290" y2="150" stroke="currentColor" class="text-gray-300 dark:text-gray-600" stroke-width="1" />
                <line x1="40" y1="10" x2="40" y2="150" stroke="currentColor" class="text-gray-300 dark:text-gray-600" stroke-width="1" />

                <!-- Y-axis labels (Score) -->
                <text x="35" y="15" text-anchor="end" class="text-[9px] fill-gray-500">100</text>
                <text x="35" y="38" text-anchor="end" class="text-[9px] fill-gray-500">90</text>
                <text x="35" y="80" text-anchor="end" class="text-[9px] fill-gray-500">50</text>
                <text x="35" y="150" text-anchor="end" class="text-[9px] fill-gray-500">0</text>

                <!-- X-axis labels (LCP in seconds) -->
                <text x="40" y="165" text-anchor="middle" class="text-[9px] fill-gray-500">0s</text>
                <text x="115" y="165" text-anchor="middle" class="text-[9px] fill-green-600 font-medium">2.5s</text>
                <text x="170" y="165" text-anchor="middle" class="text-[9px] fill-orange-500 font-medium">4.0s</text>
                <text x="250" y="165" text-anchor="middle" class="text-[9px] fill-gray-500">8s</text>

                <!-- Scoring curve (log-normal shape) -->
                <path
                  d="M 40 12 Q 60 12 75 18 Q 90 25 105 35 Q 115 42 130 65 Q 145 88 160 105 Q 180 125 210 138 Q 250 147 290 149"
                  fill="none"
                  stroke="url(#curveGradient)"
                  stroke-width="3"
                  stroke-linecap="round"
                />

                <!-- p10 marker (score 90) -->
                <circle cx="115" cy="35" r="4" fill="#22c55e" />
                <line x1="115" y1="35" x2="115" y2="150" stroke="#22c55e" stroke-width="1" stroke-dasharray="4,4" />
                <text x="115" y="178" text-anchor="middle" class="text-[8px] fill-green-600 font-medium">p10 = 90</text>

                <!-- Median marker (score 50) -->
                <circle cx="170" cy="80" r="4" fill="#f59e0b" />
                <line x1="170" y1="80" x2="170" y2="150" stroke="#f59e0b" stroke-width="1" stroke-dasharray="4,4" />
                <line x1="40" y1="80" x2="170" y2="80" stroke="#f59e0b" stroke-width="1" stroke-dasharray="4,4" />

                <!-- Axis labels -->
                <text x="165" y="8" text-anchor="middle" class="text-[10px] fill-gray-600 dark:fill-gray-400 font-medium">Score</text>
                <text x="290" y="178" text-anchor="end" class="text-[10px] fill-gray-600 dark:fill-gray-400 font-medium">Metric Value →</text>
              </svg>
              <div class="flex justify-center gap-4 mt-2 text-[10px]">
                <span class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-green-500" />
                  Good
                </span>
                <span class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-orange-500" />
                  Needs Work
                </span>
                <span class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-red-500" />
                  Poor
                </span>
              </div>
            </div>
          </div>

          <p class="text-[11px] text-gray-500 dark:text-gray-500 pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
            Source: <a href="https://developer.chrome.com/docs/lighthouse/performance/performance-scoring" target="_blank" class="text-violet-600 dark:text-violet-400 hover:underline">Chrome Developers - Lighthouse Performance Scoring</a>
          </p>
        </div>

        <!-- Core Web Vitals Section -->
        <div class="mb-16">
          <div class="flex items-center gap-3 mb-5">
            <div class="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-600/10 ring-1 ring-violet-500/20">
              <UIcon name="i-heroicons-heart" class="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <h3 class="text-lg font-bold tracking-tight">
                Core Web Vitals
              </h3>
              <p class="text-xs text-gray-500">
                Google's essential metrics for page experience ranking
              </p>
            </div>
          </div>

          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-3xl leading-relaxed">
            Core Web Vitals are Google's official metrics that affect your search rankings. As of March 2024, they consist of <strong class="text-gray-900 dark:text-white">LCP</strong>, <strong class="text-gray-900 dark:text-white">CLS</strong>, and <strong class="text-gray-900 dark:text-white">INP</strong> (which replaced FID). To pass, 75% of page visits must meet the "good" threshold for all three.
          </p>

          <!-- Stacked CWV Cards -->
          <div class="space-y-4">
            <!-- LCP -->
            <div class="group relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden hover:border-violet-500/30 transition-all duration-300">
              <div class="absolute inset-0 bg-gradient-to-r from-violet-500/3 to-transparent" />
              <div class="relative p-4 sm:p-5">
                <div class="flex flex-col sm:flex-row sm:items-start gap-4">
                  <!-- Left: Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="w-3 h-3 rounded-full bg-violet-600 ring-2 ring-violet-500/20" />
                      <span class="text-lg font-bold text-violet-600 dark:text-violet-400">LCP</span>
                      <span class="px-1.5 py-0.5 text-[10px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">25%</span>
                    </div>
                    <h4 class="text-sm font-semibold mb-1">
                      Largest Contentful Paint
                    </h4>
                    <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Time for the largest visible element to render—when users perceive the page as "loaded."
                    </p>
                  </div>
                  <!-- Right: Threshold -->
                  <div class="sm:w-48 shrink-0">
                    <div class="text-[10px] font-medium text-gray-500 mb-1.5">
                      Thresholds
                    </div>
                    <div class="flex h-2 rounded-full overflow-hidden shadow-inner">
                      <div class="flex-[2.5] bg-gradient-to-r from-green-400 to-green-500" />
                      <div class="flex-[1.5] bg-gradient-to-r from-orange-400 to-orange-500" />
                      <div class="flex-[2] bg-gradient-to-r from-red-400 to-red-500" />
                    </div>
                    <div class="flex justify-between mt-1 text-[10px] text-gray-500">
                      <span>0s</span>
                      <span class="text-green-600 font-medium">≤2.5s</span>
                      <span class="text-orange-500">4.0s</span>
                      <span>6s+</span>
                    </div>
                  </div>
                </div>
                <!-- What affects LCP -->
                <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div class="text-[10px] font-medium text-gray-500 mb-2">
                    What affects LCP
                  </div>
                  <div class="grid sm:grid-cols-2 gap-x-3 gap-y-1">
                    <NuxtLink to="/learn-lighthouse/lcp/slow-server-response" class="text-xs text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                      → Slow server response
                    </NuxtLink>
                    <NuxtLink to="/learn-lighthouse/lcp/render-blocking-resources" class="text-xs text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                      → Render-blocking resources
                    </NuxtLink>
                    <NuxtLink to="/learn-lighthouse/lcp/large-images" class="text-xs text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                      → Large unoptimized images
                    </NuxtLink>
                    <NuxtLink to="/learn-lighthouse/lcp/client-side-rendering" class="text-xs text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                      → Client-side rendering
                    </NuxtLink>
                  </div>
                  <NuxtLink to="/learn-lighthouse/lcp" class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
                    Complete LCP Guide
                    <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
                  </NuxtLink>
                </div>
              </div>
            </div>

            <!-- CLS -->
            <div class="group relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden hover:border-violet-500/30 transition-all duration-300">
              <div class="absolute inset-0 bg-gradient-to-r from-violet-500/3 to-transparent" />
              <div class="relative p-4 sm:p-5">
                <div class="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="w-3 h-3 rounded-full bg-violet-400 ring-2 ring-violet-400/20" />
                      <span class="text-lg font-bold text-violet-600 dark:text-violet-400">CLS</span>
                      <span class="px-1.5 py-0.5 text-[10px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">25%</span>
                    </div>
                    <h4 class="text-sm font-semibold mb-1">
                      Cumulative Layout Shift
                    </h4>
                    <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Visual stability—how much elements move unexpectedly as the page loads.
                    </p>
                  </div>
                  <div class="sm:w-48 shrink-0">
                    <div class="text-[10px] font-medium text-gray-500 mb-1.5">
                      Thresholds
                    </div>
                    <div class="flex h-2 rounded-full overflow-hidden shadow-inner">
                      <div class="flex-[1] bg-gradient-to-r from-green-400 to-green-500" />
                      <div class="flex-[1.5] bg-gradient-to-r from-orange-400 to-orange-500" />
                      <div class="flex-[2.5] bg-gradient-to-r from-red-400 to-red-500" />
                    </div>
                    <div class="flex justify-between mt-1 text-[10px] text-gray-500">
                      <span>0</span>
                      <span class="text-green-600 font-medium">≤0.1</span>
                      <span class="text-orange-500">0.25</span>
                      <span>0.5+</span>
                    </div>
                  </div>
                </div>
                <!-- What affects CLS -->
                <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div class="text-[10px] font-medium text-gray-500 mb-2">
                    What affects CLS
                  </div>
                  <div class="grid sm:grid-cols-2 gap-x-3 gap-y-1">
                    <NuxtLink to="/learn-lighthouse/cls/unsized-images" class="text-xs text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                      → Unsized images
                    </NuxtLink>
                    <NuxtLink to="/learn-lighthouse/cls/ads-embeds-iframes" class="text-xs text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                      → Ads/embeds/iframes
                    </NuxtLink>
                    <NuxtLink to="/learn-lighthouse/cls/dynamic-content-injection" class="text-xs text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                      → Dynamic content injection
                    </NuxtLink>
                    <NuxtLink to="/learn-lighthouse/cls/web-fonts-causing-foit" class="text-xs text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                      → Web fonts causing FOIT
                    </NuxtLink>
                  </div>
                  <NuxtLink to="/learn-lighthouse/cls" class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
                    Complete CLS Guide
                    <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
                  </NuxtLink>
                </div>
              </div>
            </div>

            <!-- INP -->
            <div class="group relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden hover:border-violet-500/30 transition-all duration-300">
              <div class="absolute inset-0 bg-gradient-to-r from-violet-500/3 to-transparent" />
              <div class="relative p-4 sm:p-5">
                <div class="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="w-3 h-3 rounded-full bg-violet-700 ring-2 ring-violet-600/20" />
                      <span class="text-lg font-bold text-violet-600 dark:text-violet-400">INP</span>
                      <span class="px-1.5 py-0.5 text-[10px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">via TBT</span>
                    </div>
                    <h4 class="text-sm font-semibold mb-1">
                      Interaction to Next Paint
                    </h4>
                    <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Responsiveness—delay between user interactions and visual response. Lighthouse uses TBT as a proxy.
                    </p>
                  </div>
                  <div class="sm:w-48 shrink-0">
                    <div class="text-[10px] font-medium text-gray-500 mb-1.5">
                      Thresholds
                    </div>
                    <div class="flex h-2 rounded-full overflow-hidden shadow-inner">
                      <div class="flex-[2] bg-gradient-to-r from-green-400 to-green-500" />
                      <div class="flex-[3] bg-gradient-to-r from-orange-400 to-orange-500" />
                      <div class="flex-[3] bg-gradient-to-r from-red-400 to-red-500" />
                    </div>
                    <div class="flex justify-between mt-1 text-[10px] text-gray-500">
                      <span>0ms</span>
                      <span class="text-green-600 font-medium">≤200ms</span>
                      <span class="text-orange-500">500ms</span>
                      <span>800ms+</span>
                    </div>
                  </div>
                </div>
                <!-- What affects INP -->
                <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div class="text-[10px] font-medium text-gray-500 mb-2">
                    What affects INP
                  </div>
                  <div class="grid sm:grid-cols-2 gap-x-3 gap-y-1">
                    <NuxtLink to="/learn-lighthouse/inp/long-running-javascript" class="text-xs text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                      → Long-running JavaScript
                    </NuxtLink>
                    <NuxtLink to="/learn-lighthouse/inp/event-handler-delays" class="text-xs text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                      → Event handler delays
                    </NuxtLink>
                    <NuxtLink to="/learn-lighthouse/inp/dom-size" class="text-xs text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                      → Large DOM size
                    </NuxtLink>
                    <NuxtLink to="/learn-lighthouse/inp/third-party-scripts" class="text-xs text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                      → Third-party scripts
                    </NuxtLink>
                  </div>
                  <NuxtLink to="/learn-lighthouse/inp" class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
                    Complete INP Guide
                    <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Other Performance Metrics Section -->
        <div class="mb-16">
          <div class="flex items-center gap-3 mb-5">
            <div class="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-600/10 ring-1 ring-violet-500/20">
              <UIcon name="i-heroicons-chart-bar-square" class="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <h3 class="text-lg font-bold tracking-tight">
                Other Performance Metrics
              </h3>
              <p class="text-xs text-gray-500">
                Additional metrics that affect your Lighthouse score
              </p>
            </div>
          </div>

          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-3xl leading-relaxed">
            Beyond Core Web Vitals, Lighthouse measures additional metrics. <strong class="text-gray-900 dark:text-white">TBT carries the highest weight (30%)</strong> because it directly correlates with how responsive your page feels.
          </p>

          <!-- Compact metric list -->
          <div class="space-y-3">
            <!-- TBT - Featured (highest weight) -->
            <div class="relative rounded-xl border-2 border-violet-200 dark:border-violet-900/50 bg-gradient-to-r from-violet-50 to-white dark:from-violet-950/20 dark:to-gray-900 p-4">
              <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                <div class="flex items-center gap-2 sm:w-36 shrink-0">
                  <span class="w-3 h-3 rounded-full bg-violet-700 ring-2 ring-violet-500/20" />
                  <span class="text-base font-bold text-violet-600 dark:text-violet-400">TBT</span>
                  <span class="px-1.5 py-0.5 text-[10px] font-bold bg-violet-600 text-white rounded-full">30%</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium mb-0.5">
                    Total Blocking Time
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    Main thread blocking time &gt;50ms. Lab proxy for INP.
                  </p>
                </div>
                <div class="sm:w-40 shrink-0">
                  <div class="flex h-2 rounded-full overflow-hidden shadow-inner">
                    <div class="flex-[2] bg-gradient-to-r from-green-400 to-green-500" />
                    <div class="flex-[4] bg-gradient-to-r from-orange-400 to-orange-500" />
                    <div class="flex-[4] bg-gradient-to-r from-red-400 to-red-500" />
                  </div>
                  <div class="flex justify-between mt-0.5 text-[9px] text-gray-500">
                    <span>0</span>
                    <span class="text-green-600">≤200ms</span>
                    <span>600ms</span>
                    <span>1s+</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- FCP -->
            <div class="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                <div class="flex items-center gap-2 sm:w-36 shrink-0">
                  <span class="w-2.5 h-2.5 rounded-full bg-violet-500" />
                  <span class="text-sm font-bold text-violet-600 dark:text-violet-400">FCP</span>
                  <span class="px-1.5 py-0.5 text-[10px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">10%</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium mb-0.5">
                    First Contentful Paint
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    First text or image rendered.
                  </p>
                </div>
                <div class="sm:w-40 shrink-0">
                  <div class="flex h-1.5 rounded-full overflow-hidden">
                    <div class="flex-[1.8] bg-green-500" />
                    <div class="flex-[1.2] bg-orange-500" />
                    <div class="flex-[2] bg-red-500" />
                  </div>
                  <div class="flex justify-between mt-0.5 text-[9px] text-gray-500">
                    <span>0</span>
                    <span class="text-green-600">≤1.8s</span>
                    <span>3s</span>
                    <span>5s+</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- SI -->
            <div class="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                <div class="flex items-center gap-2 sm:w-36 shrink-0">
                  <span class="w-2.5 h-2.5 rounded-full bg-violet-400" />
                  <span class="text-sm font-bold text-violet-600 dark:text-violet-400">SI</span>
                  <span class="px-1.5 py-0.5 text-[10px] font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">10%</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium mb-0.5">
                    Speed Index
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    How quickly visible content is populated.
                  </p>
                </div>
                <div class="sm:w-40 shrink-0">
                  <div class="flex h-1.5 rounded-full overflow-hidden">
                    <div class="flex-[3.4] bg-green-500" />
                    <div class="flex-[2.4] bg-orange-500" />
                    <div class="flex-[4.2] bg-red-500" />
                  </div>
                  <div class="flex justify-between mt-0.5 text-[9px] text-gray-500">
                    <span>0</span>
                    <span class="text-green-600">≤3.4s</span>
                    <span>5.8s</span>
                    <span>10s+</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- TTFB (diagnostic) -->
            <div class="relative rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 p-4">
              <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                <div class="flex items-center gap-2 sm:w-36 shrink-0">
                  <span class="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  <span class="text-sm font-bold text-gray-500 dark:text-gray-400">TTFB</span>
                  <span class="px-1.5 py-0.5 text-[10px] font-medium bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">diagnostic</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium mb-0.5 text-gray-700 dark:text-gray-300">
                    Time to First Byte
                  </div>
                  <p class="text-xs text-gray-500">
                    Server response time—not scored but delays all metrics.
                  </p>
                </div>
                <div class="sm:w-40 shrink-0">
                  <div class="flex h-1.5 rounded-full overflow-hidden opacity-70">
                    <div class="flex-[2] bg-green-500" />
                    <div class="flex-[4] bg-orange-500" />
                    <div class="flex-[4] bg-red-500" />
                  </div>
                  <div class="flex justify-between mt-0.5 text-[9px] text-gray-400">
                    <span>0</span>
                    <span>≤200ms</span>
                    <span>600ms</span>
                    <span>1s+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Score Thresholds -->
        <div class="mb-12">
          <h3 class="text-base font-bold mb-2">
            Understanding Score Thresholds
          </h3>
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-4 max-w-2xl">
            Lighthouse assigns color-coded ratings based on your final weighted score.
          </p>
          <div class="grid sm:grid-cols-3 gap-3">
            <div class="flex items-center gap-2.5 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div class="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                90+
              </div>
              <div>
                <div class="text-sm font-semibold text-green-700 dark:text-green-400">
                  Good
                </div>
                <div class="text-[11px] text-green-600 dark:text-green-500">
                  Performs well for most users
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2.5 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <div class="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                50-89
              </div>
              <div>
                <div class="text-sm font-semibold text-orange-700 dark:text-orange-400">
                  Needs Work
                </div>
                <div class="text-[11px] text-orange-600 dark:text-orange-500">
                  Some users may experience delays
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div class="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                0-49
              </div>
              <div>
                <div class="text-sm font-semibold text-red-700 dark:text-red-400">
                  Poor
                </div>
                <div class="text-[11px] text-red-600 dark:text-red-500">
                  Most users will have issues
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FAQ Section -->
        <ToolFaq :faqs="faqs" color="violet" />

        <!-- CTA Section -->
        <div class="relative rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 p-6 overflow-hidden mt-12">
          <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div class="relative flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 class="text-lg font-bold text-white mb-1">
                Test Your Entire Site
              </h3>
              <p class="text-sm text-violet-200 max-w-md">
                Your homepage might score 100, but what about the rest? Scan every page to find issues site-wide.
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <UButton to="/guide/getting-started/installation" color="white" size="sm">
                Get Started
              </UButton>
              <UButton to="/learn-lighthouse/core-web-vitals" variant="outline" color="white" size="sm">
                Learn more about Core Web Vitals
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
