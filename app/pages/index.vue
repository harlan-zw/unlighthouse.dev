<script setup lang="ts">
definePageMeta({
  breadcrumb: {
    icon: 'i-heroicons-solid-home',
    ariaLabel: 'Home',
  },
})

const code = ref('')
const cursor = ref(false)
const typedLength = ref(0)

const showLighthouse3d = ref(false)

onMounted(() => {
  // show the lighthouse 3d after 1 second if we have a laptop screen or higher
  if (window.innerWidth > 1024) {
    useTimeoutFn(() => {
      showLighthouse3d.value = true
    }, 1000)
  }

  const blink = useDebounceFn(() => {
    // eslint-disable-next-line ts/no-use-before-define
    write()
  }, 500)

  const plainText = 'npx unlighthouse --site #your-site'

  // Color indexes: npx (0-2), unlighthouse (4-15), --site (17-22), #your-site (24-33)
  const getColoredText = (text: string) => {
    let result = ''
    for (let i = 0; i < text.length; i++) {
      if (i === 0)
        result += '<span style="color: #80A665;">'
      else if (i === 3)
        result += '</span> <span style="color: #C98A7D;">'
      else if (i === 16)
        result += '</span> <span style="color: #C99076;">'
      else if (i === 23)
        result += '</span> <span style="color: #758575DD;">'
      result += text[i]
    }
    result += '</span>'
    return result
  }

  const write = useDebounceFn(() => {
    if (typedLength.value < plainText.length) {
      typedLength.value++
      const textToShow = plainText.substring(0, typedLength.value)
      code.value = getColoredText(textToShow)
    }

    // start blink
    blink()
    // conditionally show the blink
    if (cursor.value)
      code.value += '█'
  }, 70)

  watch(() => typedLength.value, write, {
    immediate: true,
  })
})

defineOgImageComponent('NuxtSeo', {
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
  <div class="mx-5 xl:mx-0">
    <Gradient class="absolute w-full left-0 top-15 z-[-1] opacity-50" />
    <section class="max-w-[1200px] mx-auto flex justify-center items-center sm:py-[5rem] py-[3rem]">
      <div class="lg:w-[100ch]">
        <h1 class="font-title text-gray-900 dark:text-gray-100 text-4xl leading-25 font-extrabold tracking-tight sm:text-5xl lg:text-6xl" style="line-height: 1.3;">
          Google Lighthouse for your entire site.
        </h1>
        <p class="text-gray-700 dark:text-gray-300 mt-4 max-w-3xl text-xl ">
          Unlighthouse crawls and scans your entire site with Google Lighthouse providing a unified report for your site's health.
        </p>
        <div class="mt-5">
          <UButton size="xl" to="/guide/getting-started/unlighthouse-cli">
            Read the docs
          </UButton>
        </div>
        <p class="text-muted mt-2 max-w-3xl text-sm">
          MIT Open source
        </p>
      </div>
      <div class="items-center justify-center hidden lg:flex w-full relative">
        <ClientOnly>
          <LazyLighthouseThreeD v-if="showLighthouse3d" class="absolute left-0 -top-[350px] transform" />
        </ClientOnly>
      </div>
    </section>
    <section class="py-5 sm:py-10 xl:py-15 space-y-12">
      <div>
        <h2 class="text-center font-semibold text-3xl mb-5">
          Step 1. Run the command
        </h2>
        <div class="max-w-[40rem] mx-auto">
          <p class="mb-7 text-gray-700 dark:text-gray-300 mt-4 max-w-3xl text-center text-xl lg:text-left">
            Run the command below in your terminal. It will scan your site and generate a report. <span class="text-sm opacity-70">Requires Node >= 20</span>
          </p>
          <div class="flex items-center space-x-10">
            <!--   we need to style this div like a nice terminal bash using tailwind   -->
            <div class="max-w-full overflow-x-auto flex flex-grow items-center  space-x-3 border-2 border-solid border-gray-600/50 dark:bg-[#121212] lg:p-5 p-2 text-gray-300 font-mono lg:text-lg rounded-t-lg shadow-lg relative">
              <div class="hidden lg:block">
                &gt;
              </div>
              <div class="text-xl flex-grow" :lines="false" lang="bash" v-html="code" />
            </div>
          </div>
        </div>
      </div>
      <div>
        <h2 class="text-center font-semibold text-3xl mb-8">
          Step 2. View your report
        </h2>
        <iframe src="https://inspect.unlighthouse.dev/" class="w-full max-w-[1200px] mx-auto h-[60vh] rounded-lg shadow-lg" />
      </div>
    </section>
    <section class="py-5 sm:py-10 xl:py-15 max-w-[1200px] mx-auto">
      <h2 class="mb-6 text-3xl font-bold font-title">
        Features
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <ShowcaseCard label="Speedy Scans" description="Take advantage of your CPU with threaded workers and use opportunistic throttling and categories for lightning quick scans.">
          <Icon name="noto:high-voltage" class="w-1/2 h-1/2" />
        </ShowcaseCard>
        <ShowcaseCard label="Zero-config Link Crawling" description="Fast, configurable URL discovery using robots.txt, sitemap.xml, internal link crawling and project file scanning.">
          <Icon name="noto:lady-beetle" class="w-1/2 h-1/2" />
        </ShowcaseCard>
        <ShowcaseCard label="No Time Wasted" description="Fewer URLs to scan with automatic sampling of dynamic routes. Hook up your local project files to make it even smarter.">
          <Icon name="noto:sushi" class="w-1/2 h-1/2" />
        </ShowcaseCard>
        <ShowcaseCard label="Modern UI" description="View your sites' health as a whole with the Unlighthouse client built with Vite. Easily see, search and sort your pages, re-scan individual pages and more.">
          <Icon name="noto:rainbow" class="w-1/2 h-1/2" />
        </ShowcaseCard>
        <ShowcaseCard label="SEO Goodies" description="View all of your pages titles, share images, meta descriptions, see how many internal and external links you have.">
          <Icon name="noto:candy" class="w-1/2 h-1/2" />
        </ShowcaseCard>
        <ShowcaseCard label="Accessibility Summary" description="See how your sites accessibility stacks up, find high-leverage issues to fix easily and visually see colour contrast issues.">
          <Icon name="noto:check-mark-button" class="w-1/2 h-1/2" />
        </ShowcaseCard>
      </div>
    </section>
    <section class="py-5 sm:py-10 xl:py-15 max-w-[1200px] mx-auto">
      <div class="xl:flex items-center justify-around mb-10">
        <div class="xl:max-w-sm xl:mb-0 mb-10">
          <div class="font-bold mb-5 text-5xl">
            {{ humanNumber(stats.downloads.averageDownloads30) }} downloads<br>
            <span class="text-blue-300 text-3xl">per day, on average</span>
          </div>
          <p class="opacity-80 mb-5">
            Unlighthouse is used and trusted by thousands of developers and companies around the world.
          </p>
        </div>
        <div class="text-6xl space-y-6 px-5 lg:px-0">
          <div class="flex justify-between text-right gap-5">
            <div class="mb-1  font-light items-center flex gap-5">
              <UIcon name="i-carbon-chart-line-smooth" class="h-15 w-15 mr-1 opacity-80" />
              {{ humanNumber(stats.downloads.totalDownloads30) }}
            </div>
            <div class="flex items-center font-normal opacity-70 text-sm">
              Downloads<br>/ month
            </div>
          </div>
          <div class="flex justify-between gap-5">
            <div class="mb-1 font-light items-center flex gap-5">
              <UIcon name="i-carbon-star" class="h-15 w-15 mr-1 opacity-90" />
              {{ humanNumber(stats.stars.stars) }}
            </div>
            <div class="flex items-center font-normal text-right opacity-70 text-sm">
              Total Stars
            </div>
          </div>
        </div>
      </div>
      <ClientOnly>
        <UnlighthouseDownloads class="rounded mx-auto max-w-[600px]  w-full h-full overflow-hidden" />
      </ClientOnly>
    </section>
    <section class="py-5 sm:py-10 xl:py-15 max-w-[1200px] mx-auto">
      <UContainer>
        <div class="xl:grid grid-cols-2 gap-10">
          <div class="mb-10 mx-auto max-w-lg flex flex-col  lg:items-start">
            <h2 class=" font-bold mb-3 text-5xl text-center lg:text-left">
              Funded by the community
              <span class="text-blue-300 text-3xl" />
            </h2>
            <p class="mb-5 text-neutral-700 dark:text-neutral-300 mt-4 max-w-xl text-center text-xl lg:text-left">
              Unlighthouse is completely free and open-source due to the generous support of the community.
            </p>
            <div>
              <UButton size="lg" to="https://github.com/sponsors/harlan-zw">
                Become a sponsor
              </UButton>
            </div>
          </div>
          <div v-if="sponsors" class="max-w-xl mx-auto">
            <div class="text-2xl font-semibold mb-5">
              Top Sponsors
            </div>
            <div class="sm:grid space-y-5 md:space-y-0 grid-cols-3 gap-5 mb-10">
              <div v-for="(entry, key) in sponsors.$50 || {}" :key="key">
                <NuxtLink :to="entry.sponsor.websiteUrl" class="flex items-center gap-2">
                  <NuxtImg loading="lazy" :alt="entry.sponsor.name" width="56" height="56" :src="entry.sponsor.avatarUrl" class="w-14 h-14 rounded-full" />
                  <div>
                    <div class="font-bold text-xl whitespace-nowrap">
                      {{ entry.sponsor.name }}
                    </div>
                    <div v-if="entry.sponsor.websiteUrl" class="text-neutral-400">
                      {{ entry.sponsor.websiteUrl.replace('https://', '') }}
                    </div>
                  </div>
                </NuxtLink>
              </div>
            </div>
            <div class="text-2xl font-semibold mb-5">
              Gold Sponsors
            </div>
            <div class="sm:grid space-y-5 md:space-y-0 grid-cols-3 gap-5 mb-10">
              <div v-for="(entry, key) in sponsors.$25 || {}" :key="key">
                <NuxtLink :to="entry.sponsor.websiteUrl" class="flex items-center gap-2">
                  <NuxtImg loading="lazy" :alt="entry.sponsor.name || entry.sponsor.login" width="48" height="48" :src="entry.sponsor.avatarUrl" class="w-12 h-12 rounded-full" />
                  <div>
                    <div class="font-bold text-sm whitespace-nowrap">
                      {{ entry.sponsor.name || entry.sponsor.login }}
                    </div>
                    <div v-if="entry.sponsor.websiteUrl" class="text-xs text-neutral-400">
                      {{ entry.sponsor.websiteUrl.replace('https://', '') }}
                    </div>
                  </div>
                </NuxtLink>
              </div>
            </div>
            <div class="text-2xl font-semibold mb-5">
              Backers
            </div>
            <div class="grid grid-cols-6 sm:grid-cols-10 gap-3 mb-10">
              <div v-for="(entry, key) in sponsors.others || {}" :key="key">
                <UTooltip :text="entry.sponsor.name || entry.sponsor.login">
                  <NuxtLink :to="(entry.monthlyDollars > 5 ? entry.sponsor.websiteUrl : entry.sponsor.linkUrl) || entry.sponsor.linkUrl" class="flex items-center gap-2">
                    <NuxtImg loading="lazy" :alt="entry.sponsor.name || entry.sponsor.login" width="48" height="48" :src="entry.sponsor.avatarUrl" class="w-12 h-12 rounded-full" :class="entry.monthlyDollars > 5 ? ['ring-green-500 ring-2'] : []" />
                  </NuxtLink>
                </UTooltip>
              </div>
            </div>
          </div>
        </div>
      </UContainer>
    </section>
  </div>
</template>
