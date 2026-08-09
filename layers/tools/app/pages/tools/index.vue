<script setup lang="ts">
import { toolCatalog } from '~~/shared/tool-catalog'

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

defineOgImage('NuxtSeoSatori', {
  title: 'Free Lighthouse & CWV Tools',
  description: 'Bulk testing, score calculators, and CWV analyzers',
  theme: '#a855f7',
})
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
            v-for="tool in toolCatalog"
            :key="tool.to"
            :to="tool.to"
            class="group relative p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 transition-all hover:shadow-lg"
            :class="{
              'hover:border-amber-300 dark:hover:border-amber-700': tool.color === 'amber',
              'hover:border-emerald-300 dark:hover:border-emerald-700': tool.color === 'emerald',
              'hover:border-indigo-300 dark:hover:border-indigo-700': tool.color === 'indigo',
              'hover:border-sky-300 dark:hover:border-sky-700': tool.color === 'sky',
              'hover:border-teal-300 dark:hover:border-teal-700': tool.color === 'teal',
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
                  'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400': tool.color === 'teal',
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
                    'group-hover:text-teal-600 dark:group-hover:text-teal-400': tool.color === 'teal',
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
                  'group-hover:text-teal-500': tool.color === 'teal',
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
