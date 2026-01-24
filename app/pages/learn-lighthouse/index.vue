<script setup lang="ts">
definePageMeta({
  layout: 'learn',
})

useSeoMeta({
  title: 'Learn Lighthouse & Core Web Vitals',
  description: 'Guides and tutorials for improving your site\'s Core Web Vitals and performance. Master LCP, CLS, and INP with actionable fixes.',
})

defineOgImage('Docs', {
  title: 'Learn Lighthouse',
  description: 'Master Core Web Vitals with actionable guides',
  headline: 'Learn',
})

const metrics = [
  {
    title: 'Largest Contentful Paint (LCP)',
    description: 'Improve loading performance. Only 59% of mobile sites pass.',
    icon: 'i-heroicons-photo',
    to: '/learn-lighthouse/lcp',
    color: 'text-green-500',
    stat: '59%',
    statLabel: 'mobile pass rate',
  },
  {
    title: 'Cumulative Layout Shift (CLS)',
    description: 'Eliminate layout shifts. 79% of mobile sites pass.',
    icon: 'i-heroicons-arrows-pointing-in',
    to: '/learn-lighthouse/cls',
    color: 'text-blue-500',
    stat: '79%',
    statLabel: 'mobile pass rate',
  },
  {
    title: 'Interaction to Next Paint (INP)',
    description: 'Make interactions responsive. Replaced FID in March 2024.',
    icon: 'i-heroicons-cursor-arrow-ripple',
    to: '/learn-lighthouse/inp',
    color: 'text-purple-500',
    stat: 'New',
    statLabel: 'replaced FID',
  },
]

const guides = [
  {
    title: 'Core Web Vitals Overview',
    description: 'What they measure, why they matter, and how to test them.',
    icon: 'i-heroicons-chart-bar',
    to: '/learn-lighthouse/core-web-vitals',
  },
  {
    title: 'Bulk Lighthouse Testing',
    description: 'Test every page, not just the homepage.',
    icon: 'i-heroicons-document-magnifying-glass',
    to: '/learn-lighthouse/bulk-lighthouse-testing',
  },
]
</script>

<template>
  <div class="py-8">
    <UPageHeader
      title="Learn Lighthouse"
      description="Guides and tutorials for improving your site's Core Web Vitals and performance. All guides include authoritative citations from Google and real-world statistics."
      :ui="{ title: 'text-3xl', description: 'text-lg max-w-2xl' }"
    />

    <div class="mt-12">
      <h2 class="text-xl font-semibold mb-6">
        Core Web Vitals
      </h2>
      <p class="text-[var(--ui-text-muted)] mb-8">
        Core Web Vitals are <a href="https://developers.google.com/search/docs/appearance/core-web-vitals" target="_blank" class="text-[var(--ui-text)] underline underline-offset-2">Google's ranking factor</a> for measuring user experience. Only <a href="https://almanac.httparchive.org/en/2024/performance" target="_blank" class="text-[var(--ui-text)] underline underline-offset-2">48% of mobile sites</a> currently pass all three metrics.
      </p>

      <div class="grid md:grid-cols-3 gap-6">
        <NuxtLink
          v-for="metric in metrics"
          :key="metric.title"
          :to="metric.to"
          class="group relative overflow-hidden rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-6 hover:border-[var(--ui-border-accented)] transition-all hover:shadow-lg"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="p-2 rounded-lg bg-current/10" :class="[metric.color]">
              <UIcon :name="metric.icon" class="size-6" :class="metric.color" />
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold" :class="metric.color">
                {{ metric.stat }}
              </div>
              <div class="text-xs text-[var(--ui-text-dimmed)]">
                {{ metric.statLabel }}
              </div>
            </div>
          </div>
          <h3 class="font-semibold mb-2 group-hover:text-[var(--ui-primary)] transition-colors">
            {{ metric.title }}
          </h3>
          <p class="text-sm text-[var(--ui-text-muted)]">
            {{ metric.description }}
          </p>
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-20 transition-opacity" :class="metric.color" />
        </NuxtLink>
      </div>
    </div>

    <div class="mt-16">
      <h2 class="text-xl font-semibold mb-6">
        Additional Guides
      </h2>

      <div class="grid md:grid-cols-2 gap-6">
        <NuxtLink
          v-for="guide in guides"
          :key="guide.title"
          :to="guide.to"
          class="group flex items-start gap-4 p-6 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] hover:border-[var(--ui-border-accented)] transition-all"
        >
          <div class="p-2 rounded-lg bg-amber-500/10">
            <UIcon :name="guide.icon" class="size-5 text-amber-500" />
          </div>
          <div>
            <h3 class="font-semibold mb-1 group-hover:text-[var(--ui-primary)] transition-colors">
              {{ guide.title }}
            </h3>
            <p class="text-sm text-[var(--ui-text-muted)]">
              {{ guide.description }}
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>

    <div class="mt-16 p-8 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20">
      <div class="flex flex-col md:flex-row items-start md:items-center gap-6">
        <div class="flex-1">
          <h3 class="text-lg font-semibold mb-2">
            Test Your Entire Site
          </h3>
          <p class="text-[var(--ui-text-muted)]">
            Most tools only test one page at a time. Unlighthouse scans your entire site and shows scores for every page.
          </p>
        </div>
        <NuxtLink
          to="/guide/getting-started/unlighthouse-cli"
          class="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors whitespace-nowrap"
        >
          Get Started
          <UIcon name="i-heroicons-arrow-right" class="size-4" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
