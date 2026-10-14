<script setup lang="ts">
definePageMeta({
  breadcrumb: {
    icon: 'i-heroicons-solid-home',
    ariaLabel: 'Home',
  },
})

useSeoMeta({
  title: 'Unlighthouse: Site-Wide Google Lighthouse Audits',
  description: 'Scan every page of your site with Google Lighthouse. Unlighthouse discovers URLs, runs audits in parallel, and combines results in one report.',
})

defineOgImage('NuxtSeoSatori', {
  title: 'Unlighthouse',
  description: 'Like Google Lighthouse, but it scans every single page.',
  theme: '#a855f7',
})

const { data: stats } = await useFetch('/api/stats/summary.json', {
  key: 'stats-summary',
})

const { data: sponsors } = await useGitHubSponsors()

const shouldLoadDemoFrame = ref(false)
const demoFrame = ref<HTMLIFrameElement>()

async function loadDemo() {
  shouldLoadDemoFrame.value = true
  await nextTick()
  demoFrame.value?.focus()
}

const exploreLinks = [
  {
    title: 'Performance Tools',
    description: 'Test Core Web Vitals, inspect reports, and diagnose page weight.',
    icon: 'i-carbon-tool-box',
    to: '/tools',
  },
  {
    title: 'Learn Lighthouse',
    description: 'Understand Lighthouse audits, metrics, and practical fixes.',
    icon: 'i-ph-books-duotone',
    to: '/learn-lighthouse',
  },
  {
    title: 'Integrations',
    description: 'Run the v1 beta from the CLI, CI, or an AI agent.',
    icon: 'i-carbon-connection-signal',
    to: '/v1/integrations/cli',
  },
  {
    title: 'Web Performance Glossary',
    description: 'Look up Core Web Vitals and Lighthouse terminology.',
    icon: 'i-carbon-book',
    to: '/glossary',
  },
] as const

const betaFeatures = [
  {
    title: 'Parallel audits',
    description: 'Run performance audits one at a time or in parallel.',
    to: '/v1/guide/guides/config',
  },
  {
    title: 'URL discovery',
    description: 'Crawl server-rendered links, use sitemaps, or supply explicit URLs.',
    to: '/v1/guide/guides/url-discovery',
  },
  {
    title: 'Mobile and desktop',
    description: 'Scan mobile and desktop in one run, with separate results for each.',
    to: '/v1/guide/guides/device',
  },
  {
    title: 'Scan history',
    description: 'Reopen scans saved on your machine without starting another scan.',
    to: '/v1/guide/getting-started/installation#ci-and-history',
  },
  {
    title: 'CI reports',
    description: 'Export JSON or CSV reports and check performance budgets in CI.',
    to: '/v1/integrations/ci',
  },
  {
    title: 'MCP for AI agents',
    description: 'Connect your AI agent through MCP to run scans and read results.',
    to: '/v1/integrations/mcp',
  },
] as const
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative pt-16 pb-8 lg:pt-24 lg:pb-12">
      <div class="max-w-4xl mx-auto px-6 text-center">
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-neutral-900 dark:text-white mb-6">
          Lighthouse for your
          <span class="text-violet-600 dark:text-violet-400"> entire site</span>
        </h1>
        <p class="text-lg lg:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-8">
          Unlighthouse finds your pages and runs Google Lighthouse across your site. Review the results in one dashboard. Free and open source.
        </p>

        <!-- Terminal + CTAs inline -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <div class="max-w-full rounded-lg bg-muted px-4 py-3 font-mono text-sm border border-default text-highlighted">
            <code class="break-words">pnpm dlx unlighthouse@beta --site https://example.com</code>
          </div>
          <div class="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <UButton size="lg" class="min-h-11" to="/v1/guide/getting-started/installation">
              Try v1 beta
            </UButton>
            <UButton size="lg" class="min-h-11" variant="outline" color="neutral" to="/guide/getting-started/installation">
              Use 0.x stable
            </UButton>
          </div>
        </div>
        <p class="text-sm text-muted">
          v1 beta requires Node.js 24.13.1+. MIT licensed.
        </p>
        <p class="mt-2 text-sm text-muted">
          If you use 0.x, <NuxtLink to="/v1/guide/guides/migrating-to-v1" class="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            read the migration guide
          </NuxtLink> before upgrading.
        </p>
      </div>
    </section>

    <!-- Demo - Full width showcase -->
    <section class="px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24">
      <div class="max-w-7xl mx-auto">
        <div class="relative">
          <!-- Glow effect -->
          <div class="absolute -inset-4 bg-gradient-to-b from-violet-500/10 via-violet-500/5 to-transparent rounded-3xl blur-3xl" />

          <!-- Browser frame -->
          <div class="relative bg-neutral-100 dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-neutral-200 dark:ring-white/10">
            <!-- Browser chrome -->
            <div class="flex items-center gap-3 px-4 py-3 bg-neutral-200/80 dark:bg-neutral-800/80 border-b border-neutral-300/50 dark:border-neutral-700/50">
              <div class="flex gap-2">
                <div class="w-3 h-3 rounded-full bg-red-500/90" />
                <div class="w-3 h-3 rounded-full bg-amber-400/90" />
                <div class="w-3 h-3 rounded-full bg-emerald-500/90" />
              </div>
              <div class="flex-1 min-w-0 max-w-md mx-auto">
                <div class="bg-neutral-300/50 dark:bg-neutral-700/50 rounded-lg px-4 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 font-mono text-center truncate">
                  localhost:5678
                </div>
              </div>
              <NuxtLink to="https://unlighthouse-demo.netlify.app/" external target="_blank" class="shrink-0 text-sm text-neutral-700 dark:text-neutral-300 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600">
                Open 0.x demo
              </NuxtLink>
            </div>

            <!-- Demo iframe -->
            <div class="block w-full h-[70vh] min-h-[500px] bg-neutral-50 dark:bg-neutral-950">
              <iframe
                v-if="shouldLoadDemoFrame"
                ref="demoFrame"
                src="https://unlighthouse-demo.netlify.app/"
                tabindex="0"
                class="block w-full h-full bg-white"
                title="Unlighthouse 0.x demo report"
              />
              <div v-else class="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
                <UIcon name="i-carbon-dashboard" class="size-12 text-violet-600 dark:text-violet-400" />
                <h2 class="text-2xl font-bold text-neutral-900 dark:text-white">
                  Unlighthouse 0.x demo report
                </h2>
                <UButton size="xl" @click="loadDemo">
                  Load 0.x demo
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <!-- Features -->
    <section class="px-5 py-16 lg:py-20 bg-neutral-50/50 dark:bg-neutral-900/30">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-2xl font-bold mb-8 text-center">
          Explore v1 beta
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NuxtLink
            v-for="feature in betaFeatures"
            :key="feature.to"
            :to="feature.to"
            class="group p-5 rounded-xl bg-default border border-default hover:border-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <h3 class="font-semibold mb-2 text-highlighted group-hover:text-primary">
              {{ feature.title }}
            </h3>
            <p class="text-muted">
              {{ feature.description }}
            </p>
          </NuxtLink>
        </div>
        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
          <UButton to="/v1/guide/guides/migrating-to-v1" variant="outline" color="neutral" class="min-h-11">
            Migrate from 0.x
          </UButton>
          <UButton to="https://github.com/harlan-zw/unlighthouse/issues/new/choose" target="_blank" variant="ghost" color="neutral" class="min-h-11">
            Report a beta issue
          </UButton>
        </div>
      </div>
    </section>

    <!-- Explore -->
    <section class="px-5 py-16 lg:py-20" aria-labelledby="explore-heading">
      <div class="max-w-6xl mx-auto">
        <div class="max-w-2xl mb-8">
          <h2 id="explore-heading" class="text-2xl font-bold mb-3">
            Improve every page
          </h2>
          <p class="text-neutral-600 dark:text-neutral-400">
            Go from a site-wide audit to the tools and guidance needed to understand and fix each result.
          </p>
        </div>
        <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <li v-for="link in exploreLinks" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="group flex h-full items-start gap-4 p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-violet-400 dark:hover:border-violet-500 transition-colors"
            >
              <UIcon :name="link.icon" class="w-6 h-6 mt-0.5 text-violet-600 dark:text-violet-400 shrink-0" aria-hidden="true" />
              <span>
                <span class="block font-semibold mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {{ link.title }}
                </span>
                <span class="block text-sm text-neutral-600 dark:text-neutral-400">
                  {{ link.description }}
                </span>
              </span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>

    <!-- Stats -->
    <section class="px-5 py-16 lg:py-20">
      <div class="max-w-6xl mx-auto">
        <div class="flex flex-col lg:flex-row items-center justify-between gap-10 mb-10">
          <div class="text-center lg:text-left">
            <div class="text-4xl lg:text-5xl font-bold mb-2">
              {{ humanNumber(stats?.downloads?.averageDownloads30 || 0) }}
            </div>
            <p class="text-neutral-500 dark:text-neutral-400">
              downloads per day
            </p>
          </div>
          <div class="flex gap-10 lg:gap-16">
            <div class="text-center">
              <div class="text-3xl lg:text-4xl font-light flex items-center gap-2">
                <UIcon name="i-carbon-chart-line-smooth" class="w-8 h-8 text-violet-500" />
                {{ humanNumber(stats?.downloads?.totalDownloads30 || 0) }}
              </div>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                monthly downloads
              </p>
            </div>
            <div class="text-center">
              <div class="text-3xl lg:text-4xl font-light flex items-center gap-2">
                <UIcon name="i-carbon-star" class="w-8 h-8 text-amber-500" />
                {{ humanNumber(stats?.stars?.stars || 0) }}
              </div>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                GitHub stars
              </p>
            </div>
          </div>
        </div>
        <LazyUnlighthouseDownloads hydrate-on-visible class="rounded-xl mx-auto max-w-2xl w-full overflow-hidden" />
      </div>
    </section>

    <!-- Sponsors -->
    <section class="px-5 py-16 lg:py-20 bg-neutral-50/50 dark:bg-neutral-900/30">
      <div class="max-w-6xl mx-auto">
        <div class="lg:grid grid-cols-2 gap-12">
          <div class="mb-10 lg:mb-0">
            <h2 class="text-3xl lg:text-4xl font-bold mb-4">
              Community Funded
            </h2>
            <p class="text-neutral-600 dark:text-neutral-400 text-lg mb-6 max-w-md">
              Unlighthouse is free and open-source thanks to generous community sponsors.
            </p>
            <UButton size="lg" to="https://github.com/sponsors/harlan-zw">
              Become a sponsor
            </UButton>
          </div>
          <div v-if="sponsors?._tag === 'available'">
            <div v-if="sponsors.tiers.top?.length" class="mb-6">
              <h3 class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">
                Top Sponsors
              </h3>
              <div class="flex flex-wrap gap-4">
                <NuxtLink v-for="entry in sponsors.tiers.top" :key="entry.login" :to="entry.websiteUrl || entry.profileUrl" class="flex items-center gap-2 hover:opacity-80 transition">
                  <NuxtImg loading="lazy" :alt="entry.name" width="40" height="40" :src="entry.avatarUrl" class="w-10 h-10 rounded-full" />
                  <span class="font-medium">{{ entry.name }}</span>
                </NuxtLink>
              </div>
            </div>
            <div v-if="sponsors.tiers.gold?.length" class="mb-6">
              <h3 class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">
                Gold Sponsors
              </h3>
              <div class="flex flex-wrap gap-3">
                <NuxtLink v-for="entry in sponsors.tiers.gold" :key="entry.login" :to="entry.websiteUrl || entry.profileUrl" class="hover:opacity-80 transition">
                  <NuxtImg loading="lazy" :alt="entry.name || entry.login" width="36" height="36" :src="entry.avatarUrl" class="w-9 h-9 rounded-full" />
                </NuxtLink>
              </div>
            </div>
            <div v-if="sponsors.ungrouped.length">
              <h3 class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">
                Backers
              </h3>
              <div class="flex flex-wrap gap-2">
                <UTooltip v-for="entry in sponsors.ungrouped" :key="entry.login" :text="entry.name || entry.login">
                  <NuxtLink :to="(entry.monthlyDollars > 5 ? entry.websiteUrl : entry.profileUrl) || entry.profileUrl" class="hover:opacity-80 transition">
                    <NuxtImg loading="lazy" :alt="entry.name || entry.login" width="32" height="32" :src="entry.avatarUrl" class="w-8 h-8 rounded-full" :class="entry.monthlyDollars > 5 ? ['ring-green-500 ring-2'] : []" />
                  </NuxtLink>
                </UTooltip>
              </div>
            </div>
          </div>
          <div v-else-if="sponsors?._tag === 'unavailable'" class="text-neutral-600 dark:text-neutral-400">
            The sponsor list is unavailable right now. See it on
            <NuxtLink to="https://github.com/sponsors/harlan-zw" class="underline">
              GitHub Sponsors
            </NuxtLink>.
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
