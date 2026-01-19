<script setup lang="ts">
const docsLinks = [
  { label: 'Getting Started', icon: 'i-carbon-bookmark', to: '/guide/getting-started/how-it-works' },
  { label: 'Installation', icon: 'i-carbon-download', to: '/guide/getting-started/installation' },
  { label: 'Configuration', icon: 'i-carbon-settings', to: '/guide/guides/config' },
]

const integrationsLinks = [
  { label: 'CLI', icon: 'i-carbon-terminal', to: '/integrations/cli' },
  { label: 'CI/CD', icon: 'i-carbon-flow', to: '/integrations/ci' },
  { label: 'Nuxt', icon: 'i-logos-nuxt-icon', to: '/integrations/nuxt' },
  { label: 'Vite', icon: 'i-logos-vitejs', to: '/integrations/vite' },
  { label: 'Webpack', icon: 'i-logos-webpack', to: '/integrations/webpack' },
]

const learnLinks = [
  { label: 'Core Web Vitals', icon: 'i-heroicons-chart-pie', to: '/learn-lighthouse/core-web-vitals' },
  { label: 'LCP Fixes', icon: 'i-heroicons-photo', to: '/learn-lighthouse/lcp' },
  { label: 'CLS Fixes', icon: 'i-heroicons-arrows-pointing-out', to: '/learn-lighthouse/cls' },
  { label: 'INP Fixes', icon: 'i-heroicons-cursor-arrow-rays', to: '/learn-lighthouse/inp' },
  { label: 'Accessibility', icon: 'i-heroicons-eye', to: '/learn-lighthouse/accessibility' },
  { label: 'SEO', icon: 'i-heroicons-magnifying-glass', to: '/learn-lighthouse/seo' },
  { label: 'Best Practices', icon: 'i-heroicons-check-badge', to: '/learn-lighthouse/best-practices' },
  { label: 'PageSpeed API', icon: 'i-heroicons-code-bracket', to: '/learn-lighthouse/pagespeed-insights-api' },
]

const toolsLinks = [
  { label: 'Score Calculator', icon: 'i-heroicons-calculator', to: '/tools/lighthouse-score-calculator' },
  { label: 'LCP Finder', icon: 'i-heroicons-photo', to: '/tools/lcp-finder' },
  { label: 'INP Analyzer', icon: 'i-heroicons-cursor-arrow-rays', to: '/tools/inp-analyzer' },
  { label: 'CLS Debugger', icon: 'i-heroicons-arrows-pointing-out', to: '/tools/cls-debugger' },
  { label: 'PSI Performance', icon: 'i-heroicons-chart-bar', to: '/tools/pagespeed-insights-performance' },
  { label: 'Report Viewer', icon: 'i-heroicons-document-chart-bar', to: '/tools/lighthouse-report-viewer' },
]
</script>

<template>
  <footer class="relative z-10 antialiased font-sans dark:bg-[#131822] bg-neutral-50 text-sm text-neutral-700 dark:text-neutral-200">
    <svg viewBox="0 0 1440 181" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-primary-900/30 pointer-events-none absolute w-full top-[1px] transition-all text-(--ui-primary) flex-shrink-0 opacity-100 duration-[400ms] opacity-30 z-20"><mask id="path-1-inside-1_414_5526" fill="white"><path d="M0 0H1440V181H0V0Z" /></mask><path d="M0 0H1440V181H0V0Z" fill="url(#paint0_linear_414_5526)" fill-opacity="0.22" /><path d="M0 2H1440V-2H0V2Z" fill="url(#paint1_linear_414_5526)" mask="url(#path-1-inside-1_414_5526)" /><defs><linearGradient id="paint0_linear_414_5526" x1="720" y1="0" x2="720" y2="181" gradientUnits="userSpaceOnUse"><stop stop-color="currentColor" /><stop offset="1" stop-color="currentColor" stop-opacity="0" /></linearGradient><linearGradient id="paint1_linear_414_5526" x1="0" y1="90.5" x2="1440" y2="90.5" gradientUnits="userSpaceOnUse"><stop stop-color="currentColor" stop-opacity="0" /><stop offset="0.395" stop-color="currentColor" /><stop offset="1" stop-color="currentColor" stop-opacity="0" /></linearGradient></defs></svg>
    <div class="border-t border-neutral-200 dark:border-neutral-800">
      <UContainer class="py-7">
        <div class="flex lg:flex-row flex-col items-center gap-3 mb-10">
          <div class="sm:flex items-center justify-center gap-3">
            <UButton
              aria-label="Unlighthouse on GitHub"
              to="https://github.com/harlan-zw/unlighthouse"
              target="_blank"
              color="neutral"
              variant="ghost"
              class="transition opacity-85"
              icon="i-carbon-logo-github"
            >
              GitHub
            </UButton>
            <UButton
              aria-label="Harlan's Discord"
              to="https://discord.com/invite/275MBUBvgP"
              target="_blank"
              color="neutral"
              variant="ghost"
              class="transition opacity-85"
              icon="i-carbon-logo-discord"
            >
              Discord
            </UButton>
            <ColorModeButton verbose />
            <ULink target="_blank" external href="/llms.txt" class="flex items-center gap-1 hover:underline transition">
              <UIcon dynamic name="i-noto-sparkles" class="w-4 h-4" />
              /llms.txt
            </ULink>
          </div>
        </div>
        <div class="md:pb-10 grid xl:grid-cols-4 lg:gap-16 gap-10">
          <!-- Docs Section -->
          <section class="max-w-[350px]">
            <h3 class="font-bold mb-5 flex items-center gap-1">
              <Logo />
            </h3>
            <div class="mb-7">
              <nav>
                <ul class="space-y-4">
                  <li v-for="(link, key) in docsLinks" :key="key">
                    <ULink :to="link.to" class="flex items-center gap-1 hover:underline transition">
                      <UIcon v-if="link.icon" dynamic :name="link.icon" class="w-4 h-4" />
                      {{ link.label }}
                    </ULink>
                  </li>
                </ul>
              </nav>
            </div>
            <div>
              <div class="text-sm text-toned mb-5 font-semibold">
                Integrations
              </div>
              <nav>
                <ul class="grid grid-cols-2 gap-4">
                  <li v-for="(link, key) in integrationsLinks" :key="key">
                    <ULink :to="link.to" class="flex items-center gap-1 hover:underline transition">
                      <UIcon v-if="link.icon" dynamic :name="link.icon" class="w-4 h-4" />
                      {{ link.label }}
                    </ULink>
                  </li>
                </ul>
              </nav>
            </div>
          </section>

          <!-- Learn Lighthouse Section -->
          <section class="max-w-[350px] xl:col-span-2">
            <h3 class="mb-5">
              <NuxtLink to="/learn-lighthouse" title="Learn Lighthouse" class="flex items-center gap-1.5 font-bold text-lg text-neutral-900 dark:text-white font-title">
                <UIcon name="i-ph-books-duotone" class="w-6 h-6 text-muted" />
                Learn Lighthouse
              </NuxtLink>
            </h3>
            <nav>
              <ul class="grid grid-cols-2 gap-x-6 gap-y-4">
                <li v-for="(link, key) in learnLinks" :key="key">
                  <ULink :to="link.to" class="flex items-center gap-1 hover:underline transition">
                    <UIcon v-if="link.icon" dynamic :name="link.icon" class="w-4 h-4" />
                    {{ link.label }}
                  </ULink>
                </li>
              </ul>
            </nav>
          </section>

          <!-- Tools & Resources Section -->
          <section class="max-w-[250px]">
            <h3 class="mb-5">
              <NuxtLink to="/tools" title="Tools" class="flex items-center gap-1.5 font-bold text-lg text-neutral-900 dark:text-white font-title">
                <UIcon name="i-carbon-tool-box" class="w-6 h-6 text-muted" />
                Tools
              </NuxtLink>
            </h3>
            <nav>
              <ul class="space-y-4">
                <li v-for="(link, key) in toolsLinks" :key="key">
                  <ULink :to="link.to" class="flex items-center gap-1 hover:underline transition">
                    <UIcon v-if="link.icon" dynamic :name="link.icon" class="w-4 h-4" />
                    {{ link.label }}
                  </ULink>
                </li>
              </ul>
            </nav>
          </section>
        </div>
      </UContainer>
    </div>
    <div class="border-t border-neutral-200 dark:border-neutral-800">
      <UContainer>
        <div class="py-10">
          Copyright © 2023-{{ new Date().getFullYear() }} Harlan Wilton - <a href="https://github.com/harlan-zw/unlighthouse/blob/main/LICENSE">MIT License</a>
        </div>
      </UContainer>
    </div>
  </footer>
</template>
