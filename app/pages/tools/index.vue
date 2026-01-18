<script setup lang="ts">
definePageMeta({
  breadcrumb: {
    icon: 'i-heroicons-wrench-screwdriver',
    ariaLabel: 'Tools',
  },
})

useSeoMeta({
  title: 'Performance Tools - Lighthouse Calculators & Analyzers',
  description: 'Free web performance tools: Lighthouse score calculator, Core Web Vitals analyzers, and more.',
})

defineOgImageComponent('NuxtSeo', {
  title: 'Performance Tools',
  description: 'Free Lighthouse calculators and analyzers',
  theme: '#a855f7',
})

const tools = [
  {
    title: 'Lighthouse Score Calculator',
    description: 'Calculate your performance score interactively. Adjust metrics to see how they impact your overall Lighthouse score.',
    icon: 'i-heroicons-calculator',
    to: '/tools/lighthouse-score-calculator',
    color: 'violet',
    metrics: ['FCP', 'SI', 'LCP', 'TBT', 'CLS'],
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
            class="group relative p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 transition-all hover:shadow-lg"
          >
            <div class="flex items-start gap-4">
              <div class="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                <UIcon :name="tool.icon" class="w-6 h-6" />
              </div>
              <div class="flex-1">
                <h2 class="text-xl font-semibold mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
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
              <UIcon name="i-heroicons-arrow-right" class="w-5 h-5 text-gray-400 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
