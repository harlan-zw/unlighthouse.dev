<script setup lang="ts">
definePageMeta({
  breadcrumb: {
    icon: 'i-heroicons-wrench-screwdriver',
    ariaLabel: 'Tools',
  },
})

useSeoMeta({
  title: 'Free Lighthouse & Core Web Vitals Tools',
  description: 'Free bulk Core Web Vitals checker, Lighthouse score calculator, CLS debugger, LCP finder, and more. Test multiple pages at once with no signup.',
})

defineOgImage('NuxtSeo', {
  title: 'Free Lighthouse & CWV Tools',
  description: 'Bulk testing, score calculators, and CWV analyzers',
  theme: '#a855f7',
})

const tools = [
  {
    title: 'Bulk PageSpeed Test',
    description: 'Test up to 10 URLs at once with PageSpeed Insights. Get performance scores for multiple pages in one batch.',
    icon: 'i-heroicons-squares-2x2',
    to: '/tools/bulk-pagespeed',
    color: 'amber',
    metrics: ['Batch Testing', 'Performance', 'Core Web Vitals'],
  },
  {
    title: 'Core Web Vitals Checker',
    description: 'Check if your page passes Google\'s Core Web Vitals. Test LCP, CLS, and INP with lab and real user data.',
    icon: 'i-heroicons-check-badge',
    to: '/tools/cwv-checker',
    color: 'emerald',
    metrics: ['LCP', 'CLS', 'INP', 'Core Web Vitals'],
  },
  {
    title: 'Core Web Vitals History',
    description: 'Track real user performance over 25 weeks. See how your LCP, CLS, and INP trends change over time with CrUX data.',
    icon: 'i-heroicons-chart-bar',
    to: '/tools/cwv-history',
    color: 'indigo',
    metrics: ['Field Data', 'Trends', 'CrUX'],
  },
  {
    title: 'TTFB Checker',
    description: 'Test Time to First Byte with real Chrome user data. Compare field vs lab TTFB and track server response trends.',
    icon: 'i-heroicons-clock',
    to: '/tools/ttfb-checker',
    color: 'sky',
    metrics: ['TTFB', 'Server Response', 'CrUX'],
  },
  {
    title: 'CWV Compare',
    description: 'Compare Core Web Vitals across multiple websites. Benchmark your site against competitors with real Chrome user data.',
    icon: 'i-heroicons-scale',
    to: '/tools/cwv-compare',
    color: 'orange',
    metrics: ['Competitor Analysis', 'CrUX', 'Benchmarking'],
  },
  {
    title: 'Lighthouse Report Viewer',
    description: 'Upload your Lighthouse JSON report to visualize scores, metrics, and audits interactively.',
    icon: 'i-heroicons-document-chart-bar',
    to: '/tools/lighthouse-report-viewer',
    color: 'violet',
    metrics: ['All Categories', 'Audits', 'Metrics'],
  },
  {
    title: 'Lighthouse Score Calculator',
    description: 'Calculate your performance score interactively. Adjust metrics to see how they impact your overall Lighthouse score.',
    icon: 'i-heroicons-calculator',
    to: '/tools/lighthouse-score-calculator',
    color: 'violet',
    metrics: ['FCP', 'SI', 'LCP', 'TBT', 'CLS'],
  },
  {
    title: 'LCP Element Finder',
    description: 'Identify which element is your Largest Contentful Paint and get actionable recommendations to improve it.',
    icon: 'i-heroicons-photo',
    to: '/tools/lcp-finder',
    color: 'violet',
    metrics: ['LCP', 'Core Web Vital'],
  },
  {
    title: 'INP Analyzer',
    description: 'Analyze Interaction to Next Paint issues. Find slow event handlers and optimize responsiveness.',
    icon: 'i-heroicons-cursor-arrow-rays',
    to: '/tools/inp-analyzer',
    color: 'violet',
    metrics: ['INP', 'Core Web Vital'],
  },
  {
    title: 'CLS Debugger',
    description: 'Debug Cumulative Layout Shift issues. Identify elements causing unexpected layout shifts.',
    icon: 'i-heroicons-arrows-pointing-out',
    to: '/tools/cls-debugger',
    color: 'violet',
    metrics: ['CLS', 'Core Web Vital'],
  },
  {
    title: 'PageSpeed Insights Performance',
    description: 'Get detailed PageSpeed Insights performance data with field and lab metrics.',
    icon: 'i-heroicons-chart-bar',
    to: '/tools/pagespeed-insights-performance',
    color: 'violet',
    metrics: ['Performance', 'Field Data'],
  },
]
</script>

<template>
  <div class="min-h-screen">
    <!-- Hero -->
    <section class="relative pt-12 pb-8 lg:pt-16 lg:pb-12">
      <div class="max-w-4xl mx-auto px-6 text-center">
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-gray-900 dark:text-white mb-4">
          Performance
          <span class="text-violet-600 dark:text-violet-400">Tools</span>
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Free interactive tools to understand and improve your Lighthouse scores.
        </p>
      </div>
    </section>

    <!-- Tools Grid -->
    <section class="px-4 sm:px-6 lg:px-8 pb-16">
      <div class="max-w-4xl mx-auto">
        <div class="grid gap-6">
          <NuxtLink
            v-for="tool in tools"
            :key="tool.to"
            :to="tool.to"
            class="group relative p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 transition-all hover:shadow-lg"
            :class="{
              'hover:border-amber-300 dark:hover:border-amber-700': tool.color === 'amber',
              'hover:border-emerald-300 dark:hover:border-emerald-700': tool.color === 'emerald',
              'hover:border-indigo-300 dark:hover:border-indigo-700': tool.color === 'indigo',
              'hover:border-sky-300 dark:hover:border-sky-700': tool.color === 'sky',
              'hover:border-orange-300 dark:hover:border-orange-700': tool.color === 'orange',
              'hover:border-violet-300 dark:hover:border-violet-700': tool.color === 'violet' || !tool.color,
            }"
          >
            <div class="flex items-start gap-4">
              <div
                class="p-3 rounded-xl"
                :class="{
                  'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400': tool.color === 'amber',
                  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400': tool.color === 'emerald',
                  'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400': tool.color === 'indigo',
                  'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400': tool.color === 'sky',
                  'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400': tool.color === 'orange',
                  'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400': tool.color === 'violet' || !tool.color,
                }"
              >
                <UIcon :name="tool.icon" class="w-6 h-6" />
              </div>
              <div class="flex-1">
                <h2
                  class="text-xl font-semibold mb-2 transition-colors"
                  :class="{
                    'group-hover:text-amber-600 dark:group-hover:text-amber-400': tool.color === 'amber',
                    'group-hover:text-emerald-600 dark:group-hover:text-emerald-400': tool.color === 'emerald',
                    'group-hover:text-indigo-600 dark:group-hover:text-indigo-400': tool.color === 'indigo',
                    'group-hover:text-sky-600 dark:group-hover:text-sky-400': tool.color === 'sky',
                    'group-hover:text-orange-600 dark:group-hover:text-orange-400': tool.color === 'orange',
                    'group-hover:text-violet-600 dark:group-hover:text-violet-400': tool.color === 'violet' || !tool.color,
                  }"
                >
                  {{ tool.title }}
                </h2>
                <p class="text-gray-600 dark:text-gray-400 mb-3">
                  {{ tool.description }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="metric in tool.metrics"
                    :key="metric"
                    class="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  >
                    {{ metric }}
                  </span>
                </div>
              </div>
              <UIcon
                name="i-heroicons-arrow-right"
                class="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-all"
                :class="{
                  'group-hover:text-amber-500': tool.color === 'amber',
                  'group-hover:text-emerald-500': tool.color === 'emerald',
                  'group-hover:text-indigo-500': tool.color === 'indigo',
                  'group-hover:text-sky-500': tool.color === 'sky',
                  'group-hover:text-orange-500': tool.color === 'orange',
                  'group-hover:text-violet-500': tool.color === 'violet' || !tool.color,
                }"
              />
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
