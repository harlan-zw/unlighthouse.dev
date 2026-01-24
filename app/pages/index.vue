<script setup lang="ts">
definePageMeta({
  breadcrumb: {
    icon: 'i-heroicons-solid-home',
    ariaLabel: 'Home',
  },
})

defineOgImage('NuxtSeo', {
  title: 'Unlighthouse',
  description: 'Like Google Lighthouse, but it scans every single page.',
  theme: '#a855f7',
})

const { data: stats } = await useStats()

const { data: sponsors } = await useFetch('/api/github/sponsors.json', {
  key: 'sponsors',
})
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative pt-16 pb-8 lg:pt-24 lg:pb-12">
      <div class="max-w-4xl mx-auto px-6 text-center">
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-gray-900 dark:text-white mb-6">
          Lighthouse for your
          <span class="text-violet-600 dark:text-violet-400"> entire site</span>
        </h1>
        <p class="text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Crawl every page, run Google Lighthouse audits, get one unified performance report.
        </p>

        <!-- Terminal + CTAs inline -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <div class="inline-flex items-center gap-2 bg-gray-900 rounded-lg px-4 py-3 font-mono text-sm border border-gray-800">
            <span class="text-gray-500">$</span>
            <span class="text-emerald-400">npx</span>
            <span class="text-white">unlighthouse</span>
            <span class="text-amber-400">--site</span>
            <span class="text-gray-500">example.com</span>
          </div>
          <div class="flex items-center gap-3">
            <UButton size="lg" to="/guide/getting-started/unlighthouse-cli">
              Get Started
            </UButton>
            <UButton size="lg" variant="ghost" color="neutral" to="https://github.com/harlan-zw/unlighthouse" target="_blank">
              <UIcon name="i-carbon-logo-github" class="w-5 h-5" />
              GitHub
            </UButton>
          </div>
        </div>
        <p class="text-xs text-gray-500">
          Node 20+ · MIT licensed · Zero config
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
          <div class="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <!-- Browser chrome -->
            <div class="flex items-center gap-3 px-4 py-3 bg-gray-800/80 border-b border-gray-700/50">
              <div class="flex gap-2">
                <div class="w-3 h-3 rounded-full bg-red-500/90" />
                <div class="w-3 h-3 rounded-full bg-amber-400/90" />
                <div class="w-3 h-3 rounded-full bg-emerald-500/90" />
              </div>
              <div class="flex-1 max-w-md mx-auto">
                <div class="bg-gray-700/50 rounded-lg px-4 py-1.5 text-sm text-gray-400 font-mono text-center">
                  localhost:5678
                </div>
              </div>
              <div class="w-[68px]" />
            </div>

            <!-- Demo iframe -->
            <iframe
              src="https://unlighthouse-demo.netlify.app/"
              loading="lazy"
              class="block w-full bg-white"
              style="height: 70vh; min-height: 500px;"
              title="Unlighthouse Demo Report"
            />
          </div>
        </div>
      </div>
    </section>
    <!-- Features -->
    <section class="px-5 py-16 lg:py-20 bg-gray-50/50 dark:bg-gray-900/30">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-2xl font-bold mb-8 text-center">
          Why Unlighthouse
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div class="flex items-center gap-3 mb-2">
              <Icon name="noto:high-voltage" class="w-6 h-6" />
              <h3 class="font-semibold">
                Parallel Scans
              </h3>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Threaded workers with opportunistic throttling for fast audits.
            </p>
          </div>
          <div class="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div class="flex items-center gap-3 mb-2">
              <Icon name="noto:lady-beetle" class="w-6 h-6" />
              <h3 class="font-semibold">
                Auto Crawling
              </h3>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Discovers URLs via robots.txt, sitemap.xml, and internal links.
            </p>
          </div>
          <div class="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div class="flex items-center gap-3 mb-2">
              <Icon name="noto:sushi" class="w-6 h-6" />
              <h3 class="font-semibold">
                Smart Sampling
              </h3>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Auto-samples dynamic routes to reduce scan time.
            </p>
          </div>
          <div class="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div class="flex items-center gap-3 mb-2">
              <Icon name="noto:rainbow" class="w-6 h-6" />
              <h3 class="font-semibold">
                Modern UI
              </h3>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Search, sort, and re-scan pages in the Vite-powered client.
            </p>
          </div>
          <div class="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div class="flex items-center gap-3 mb-2">
              <Icon name="noto:candy" class="w-6 h-6" />
              <h3 class="font-semibold">
                SEO Insights
              </h3>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Titles, meta descriptions, share images, link analysis.
            </p>
          </div>
          <div class="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div class="flex items-center gap-3 mb-2">
              <Icon name="noto:check-mark-button" class="w-6 h-6" />
              <h3 class="font-semibold">
                A11y Summary
              </h3>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Accessibility audit with contrast issue visualization.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="px-5 py-16 lg:py-20">
      <div class="max-w-6xl mx-auto">
        <div class="flex flex-col lg:flex-row items-center justify-between gap-10 mb-10">
          <div class="text-center lg:text-left">
            <div class="text-4xl lg:text-5xl font-bold mb-2">
              {{ humanNumber(stats.downloads.averageDownloads30) }}
            </div>
            <p class="text-gray-500">
              downloads per day
            </p>
          </div>
          <div class="flex gap-10 lg:gap-16">
            <div class="text-center">
              <div class="text-3xl lg:text-4xl font-light flex items-center gap-2">
                <UIcon name="i-carbon-chart-line-smooth" class="w-8 h-8 text-violet-500" />
                {{ humanNumber(stats.downloads.totalDownloads30) }}
              </div>
              <p class="text-sm text-gray-500 mt-1">
                monthly downloads
              </p>
            </div>
            <div class="text-center">
              <div class="text-3xl lg:text-4xl font-light flex items-center gap-2">
                <UIcon name="i-carbon-star" class="w-8 h-8 text-amber-500" />
                {{ humanNumber(stats.stars.stars) }}
              </div>
              <p class="text-sm text-gray-500 mt-1">
                GitHub stars
              </p>
            </div>
          </div>
        </div>
        <ClientOnly>
          <UnlighthouseDownloads class="rounded-xl mx-auto max-w-2xl w-full overflow-hidden" />
        </ClientOnly>
      </div>
    </section>

    <!-- Sponsors -->
    <section class="px-5 py-16 lg:py-20 bg-gray-50/50 dark:bg-gray-900/30">
      <div class="max-w-6xl mx-auto">
        <div class="lg:grid grid-cols-2 gap-12">
          <div class="mb-10 lg:mb-0">
            <h2 class="text-3xl lg:text-4xl font-bold mb-4">
              Community Funded
            </h2>
            <p class="text-gray-600 dark:text-gray-400 text-lg mb-6 max-w-md">
              Unlighthouse is free and open-source thanks to generous community sponsors.
            </p>
            <UButton size="lg" to="https://github.com/sponsors/harlan-zw">
              Become a sponsor
            </UButton>
          </div>
          <div v-if="sponsors">
            <div class="mb-6">
              <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Top Sponsors
              </h3>
              <div class="flex flex-wrap gap-4">
                <NuxtLink v-for="(entry, key) in sponsors.$50 || {}" :key="key" :to="entry.sponsor.websiteUrl" class="flex items-center gap-2 hover:opacity-80 transition">
                  <NuxtImg loading="lazy" :alt="entry.sponsor.name" width="40" height="40" :src="entry.sponsor.avatarUrl" class="w-10 h-10 rounded-full" />
                  <span class="font-medium">{{ entry.sponsor.name }}</span>
                </NuxtLink>
              </div>
            </div>
            <div class="mb-6">
              <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Gold Sponsors
              </h3>
              <div class="flex flex-wrap gap-3">
                <NuxtLink v-for="(entry, key) in sponsors.$25 || {}" :key="key" :to="entry.sponsor.websiteUrl" class="hover:opacity-80 transition">
                  <NuxtImg loading="lazy" :alt="entry.sponsor.name || entry.sponsor.login" width="36" height="36" :src="entry.sponsor.avatarUrl" class="w-9 h-9 rounded-full" />
                </NuxtLink>
              </div>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Backers
              </h3>
              <div class="flex flex-wrap gap-2">
                <UTooltip v-for="(entry, key) in sponsors.others || {}" :key="key" :text="entry.sponsor.name || entry.sponsor.login">
                  <NuxtLink :to="(entry.monthlyDollars > 5 ? entry.sponsor.websiteUrl : entry.sponsor.linkUrl) || entry.sponsor.linkUrl" class="hover:opacity-80 transition">
                    <NuxtImg loading="lazy" :alt="entry.sponsor.name || entry.sponsor.login" width="32" height="32" :src="entry.sponsor.avatarUrl" class="w-8 h-8 rounded-full" :class="entry.monthlyDollars > 5 ? ['ring-green-500 ring-2'] : []" />
                  </NuxtLink>
                </UTooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
