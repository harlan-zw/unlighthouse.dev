<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { data: terms } = await useAsyncData('glossary-terms', () =>
  queryCollection('glossary')
    .order('title', 'ASC')
    .all())

useSeoMeta({
  title: 'Web Performance Glossary',
  description: 'Definitions and explanations of Core Web Vitals, Lighthouse metrics, and web performance terminology.',
})

defineOgImageComponent('Docs', {
  title: 'Web Performance Glossary',
  description: 'Core Web Vitals & Lighthouse Metrics',
  headline: 'Glossary',
})

const coreWebVitals = computed(() =>
  terms.value?.filter(t => ['lcp', 'cls', 'inp'].includes(t.path?.split('/').pop() || '')) || [],
)

const lighthouseMetrics = computed(() =>
  terms.value?.filter(t => ['fcp', 'ttfb', 'tbt', 'speed-index'].includes(t.path?.split('/').pop() || '')) || [],
)

const otherTerms = computed(() =>
  terms.value?.filter(t => ['tti'].includes(t.path?.split('/').pop() || '')) || [],
)
</script>

<template>
  <div class="container max-w-5xl mx-auto px-6 py-12 lg:py-16">
    <header class="mb-12">
      <h1 class="text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">
        Web Performance Glossary
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
        Definitions and explanations of Core Web Vitals, Lighthouse metrics, and web performance terminology.
      </p>
    </header>

    <!-- Core Web Vitals -->
    <section class="mb-12">
      <h2 class="text-sm font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-4">
        Core Web Vitals
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        Google's three key metrics that affect search rankings.
      </p>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="term in coreWebVitals"
          :key="term.path"
          :to="term.path"
          class="group p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-violet-400 dark:hover:border-violet-500 transition-colors"
        >
          <h3 class="font-semibold text-lg mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            {{ term.navigation?.title || term.title }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {{ term.description }}
          </p>
        </NuxtLink>
      </div>
    </section>

    <!-- Lighthouse Metrics -->
    <section class="mb-12">
      <h2 class="text-sm font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-4">
        Lighthouse Performance Metrics
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        Additional metrics reported by Lighthouse that contribute to your performance score.
      </p>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="term in lighthouseMetrics"
          :key="term.path"
          :to="term.path"
          class="group p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-violet-400 dark:hover:border-violet-500 transition-colors"
        >
          <h3 class="font-semibold text-lg mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            {{ term.navigation?.title || term.title }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {{ term.description }}
          </p>
        </NuxtLink>
      </div>
    </section>

    <!-- Deprecated -->
    <section v-if="otherTerms?.length" class="mb-12">
      <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Deprecated Metrics
      </h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="term in otherTerms"
          :key="term.path"
          :to="term.path"
          class="group p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors opacity-70"
        >
          <h3 class="font-semibold text-lg mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
            {{ term.navigation?.title || term.title }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {{ term.description }}
          </p>
        </NuxtLink>
      </div>
    </section>

    <!-- CTA -->
    <section class="p-8 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
      <h2 class="text-2xl font-bold mb-3">
        Measure Your Site
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-xl">
        Use Unlighthouse to audit all these metrics across your entire website in a single scan.
      </p>
      <div class="flex flex-wrap items-center gap-4">
        <div class="inline-flex items-center gap-2 bg-gray-900 dark:bg-black/50 rounded-lg px-4 py-2.5 font-mono text-sm border border-gray-800">
          <span class="text-gray-500">$</span>
          <span class="text-emerald-400">npx</span>
          <span class="text-white">unlighthouse</span>
          <span class="text-amber-400">--site</span>
          <span class="text-gray-500">example.com</span>
        </div>
        <UButton to="/guide/getting-started/unlighthouse-cli">
          Get Started
        </UButton>
      </div>
    </section>
  </div>
</template>
