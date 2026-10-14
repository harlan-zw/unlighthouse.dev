<script setup lang="ts">
definePageMeta({
  breadcrumb: {
    icon: 'i-heroicons-solid-home',
    ariaLabel: 'Home',
  },
})

const homepageDescription = 'Unlighthouse finds your pages and runs Lighthouse audits across your site. Review the results in one dashboard. Free and open source.'

useSeoMeta({
  title: 'Unlighthouse: Site-Wide Google Lighthouse Audits',
  description: homepageDescription,
})

defineOgImage('NuxtSeoSatori', {
  title: 'Unlighthouse',
  description: homepageDescription,
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
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative pt-16 pb-8 lg:pt-24 lg:pb-12">
      <div class="max-w-4xl mx-auto px-6 text-center">
        <NuxtLink
          to="/v1/guide/guides/migrating-to-v1"
          class="mb-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-default py-1 pl-1 pr-3 text-sm font-medium ring-1 ring-default hover:ring-accented focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <span class="rounded-full bg-elevated px-2 py-1 text-sm font-bold">NEW</span>
          <img src="/favicon-32x32.png" width="20" height="20" alt="" class="size-5 rounded-sm">
          <span>Unlighthouse v1 beta</span>
          <UIcon name="i-carbon-arrow-right" class="size-4 text-muted" aria-hidden="true" />
        </NuxtLink>
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-neutral-900 dark:text-white mb-6">
          Lighthouse for your
          <span class="text-violet-600 dark:text-violet-400"> entire site</span>
        </h1>
        <p class="text-lg lg:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-8">
          {{ homepageDescription }}
        </p>

        <!-- Terminal + CTAs inline -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <div class="inline-flex max-w-full overflow-x-auto whitespace-nowrap items-center gap-2 bg-neutral-100 dark:bg-neutral-900 rounded-lg px-4 py-3 font-mono text-sm border border-neutral-200 dark:border-neutral-800">
            <span class="text-neutral-500 dark:text-neutral-400">$</span>
            <span class="text-emerald-600 dark:text-emerald-400">npx</span>
            <span class="text-neutral-900 dark:text-white">unlighthouse@beta</span>
            <span class="text-amber-600 dark:text-amber-400">--site</span>
            <span class="text-neutral-500 dark:text-neutral-400">https://example.com</span>
          </div>
          <div class="flex items-center gap-3">
            <UButton size="lg" to="/v1/guide/getting-started/installation">
              Try v1 beta
            </UButton>
            <UButton size="lg" variant="ghost" color="neutral" to="https://github.com/harlan-zw/unlighthouse" target="_blank">
              <UIcon name="i-carbon-logo-github" class="w-5 h-5" />
              GitHub
            </UButton>
          </div>
        </div>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">
          Node.js 24.13.1+ · MIT licensed
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
                  Unlighthouse v1 beta
                </div>
              </div>
              <NuxtLink to="https://unlighthouse-demo.netlify.app/" external target="_blank" class="shrink-0 text-sm text-neutral-700 dark:text-neutral-300 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600">
                Open demo
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
                title="Unlighthouse v1 beta demo"
              />
              <div v-else class="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
                <UIcon name="i-carbon-dashboard" class="size-12 text-violet-600 dark:text-violet-400" />
                <h2 class="text-2xl font-bold text-neutral-900 dark:text-white">
                  Unlighthouse v1 beta demo
                </h2>
                <p class="text-neutral-600 dark:text-neutral-400">
                  Explore a real scan of unlighthouse.dev. This demo is read-only.
                </p>
                <UButton size="xl" @click="loadDemo">
                  Load v1 demo
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
          Why Unlighthouse
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div class="flex items-center gap-3 mb-2">
              <Icon name="noto:high-voltage" class="w-6 h-6" />
              <h3 class="font-semibold">
                Lighthouse audits
              </h3>
            </div>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Run performance audits one at a time or in parallel.
            </p>
          </div>
          <div class="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div class="flex items-center gap-3 mb-2">
              <Icon name="noto:lady-beetle" class="w-6 h-6" />
              <h3 class="font-semibold">
                URL discovery
              </h3>
            </div>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Crawl server-rendered links, use sitemaps, or supply explicit URLs.
            </p>
          </div>
          <div class="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div class="flex items-center gap-3 mb-2">
              <Icon name="noto:sushi" class="w-6 h-6" />
              <h3 class="font-semibold">
                Mobile and desktop
              </h3>
            </div>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Run mobile and desktop audits in one scan, with separate results for each.
            </p>
          </div>
          <div class="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div class="flex items-center gap-3 mb-2">
              <Icon name="noto:rainbow" class="w-6 h-6" />
              <h3 class="font-semibold">
                Scan history
              </h3>
            </div>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Reopen scans saved on your machine without starting another scan.
            </p>
          </div>
          <div class="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div class="flex items-center gap-3 mb-2">
              <Icon name="noto:candy" class="w-6 h-6" />
              <h3 class="font-semibold">
                CI reports
              </h3>
            </div>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Export JSON or CSV reports and check performance budgets in CI.
            </p>
          </div>
          <div class="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div class="flex items-center gap-3 mb-2">
              <Icon name="noto:check-mark-button" class="w-6 h-6" />
              <h3 class="font-semibold">
                MCP for AI agents
              </h3>
            </div>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Connect your AI agent through MCP to run scans and read results.
            </p>
          </div>
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
