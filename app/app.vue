<script setup lang="ts">
import { searchContentEntries } from '~~/utils/content-search'
import { queryCollectionNavigation } from '#imports'

const appConfig = useAppConfig()
const route = useRoute()

useHead({
  style: [
    { innerHTML: `:root { --ui-primary: #1d293d; } .dark { --ui-primary: oklch(0.809 0.105 251.813); }`, id: 'nuxt-ui-black-as-primary', tagPriority: -2 },
  ],
  htmlAttrs: {
    lang: 'en',
  },
  meta: [
    { name: 'theme-color', content: '#a684ff', media: '(prefers-color-scheme: light)' },
    { name: 'theme-color', content: '#5d0ec0', media: '(prefers-color-scheme: dark)' },
    { name: 'color-scheme', content: 'light dark' },
  ],
})

const {
  data: search,
  execute: loadSearch,
  status: searchStatus,
} = useFetch('/api/search.json', {
  key: 'content-search',
  server: false,
  immediate: false,
  default: () => [],
})

function needsDocsNavigation(path: string) {
  return /^\/(?:guide|integrations|api-doc|glossary)(?:\/|$)/.test(path)
}

const {
  data: navigation,
  execute: loadNavigation,
} = await useAsyncData(`navigation`, async () => {
  const [root, glossary] = await Promise.all([
    queryCollectionNavigation('root'),
    queryCollectionNavigation('glossary'),
  ])
  return [...root, ...glossary]
}, {
  default: () => [],
  async transform(res) {
    const nav = mapPath(res)
    return (nav || []).map((m: any) => {
      if (m.children?.length) {
        m.children = m.children.map((c: any) => {
          if (c.children?.length === 1) {
            c = c.children[0]
          }
          return c
        })
        m.children = m.children.map((c: any) => {
          if (c.title.endsWith('()')) {
            c.html = true
            const [fnName] = c.title.split('()')
            c.title = `<code class="language-ts shiki shiki-themes github-light github-light material-theme-palenight" language="ts"><span style="--shiki-light: #6F42C1; --shiki-default: #6F42C1; --shiki-dark: #82AAFF;">${fnName}</span><span style="--shiki-light: #24292E; --shiki-default: #24292E; --shiki-dark: #BABED8;">()</span></code>`
          }
          else if (c.title.startsWith('<') && c.title.endsWith('>') && !c.title.includes('<code')) {
            const inner = c.title.slice(1, -1)
            c.html = true
            c.title = `<code class="language-ts shiki shiki-themes github-light github-light material-theme-palenight" language="ts"><span class="line" line="2"><span style="--shiki-light: #24292E; --shiki-default: #24292E; --shiki-dark: #89DDFF;">  &lt;</span><span style="--shiki-light: #22863A; --shiki-default: #22863A; --shiki-dark: #F07178;">${inner}</span><span style="--shiki-light: #24292E; --shiki-default: #24292E; --shiki-dark: #89DDFF;"> /&gt;
</span></span></code>`
          }
          if (c.children?.length === 1) {
            c = c.children[0]
          }
          return c
        })
      }
      return m
    })
  },
  immediate: needsDocsNavigation(route.path),
  server: needsDocsNavigation(route.path),
})
provide('search', search)
provide('navigation', navigation)

const searchTerm = ref('')

const { open: openSearch } = useContentSearch()
const hasRequestedSearch = ref(false)
const toolBackgroundRequests = useToolBackgroundRequests()

function requestSearch() {
  if (hasRequestedSearch.value)
    return
  hasRequestedSearch.value = true
  void loadSearch()
}

onKeyStroke('Divide', () => {
  openSearch.value = true
})

watch(openSearch, (isOpen) => {
  if (isOpen)
    requestSearch()
})

if (import.meta.client) {
  watch(() => route.path, (path) => {
    if (needsDocsNavigation(path) && !navigation.value?.length)
      void loadNavigation()
  }, { immediate: true })
}

const shouldMountSearch = computed(() => openSearch.value || searchStatus.value === 'success')
const contentSearchStatus = computed<'idle' | 'loading' | 'ready' | 'error'>(() => {
  if (searchStatus.value === 'pending')
    return 'loading'
  if (searchStatus.value === 'success')
    return 'ready'
  return searchStatus.value
})

async function searchContent(query: string, options?: { limit?: number }) {
  return searchContentEntries(search.value, query, options?.limit || 12)
}

const hasLoadingToolBackgroundRequests = computed(() =>
  Object.values(toolBackgroundRequests.value).some(request => request.status === 'loading'),
)
const shouldMountToolBackgroundIndicator = computed(() =>
  route.path.startsWith('/tools') || hasLoadingToolBackgroundRequests.value,
)
</script>

<template>
  <UApp :toaster="appConfig.toaster" :tooltip="{ delayDuration: 0 }">
    <NuxtLoadingIndicator color="#FFF" />
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-default focus:px-4 focus:py-3 focus:text-highlighted focus:ring-2 focus:ring-primary"
    >
      Skip to main content
    </a>
    <Header class="z-100" />
    <main id="main-content" tabindex="-1">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </main>
    <ClientOnly>
      <LazyUContentSearch
        v-if="shouldMountSearch"
        :key="openSearch ? 'open' : 'closed'"
        v-model:search-term="searchTerm"
        shortcut="/"
        :files="search"
        :navigation="navigation"
        :search="searchContent"
        :search-status="contentSearchStatus"
        :fuse="{ resultLimit: 42 }"
        :links="[{
                   label: 'llms.txt',
                   to: '/llms.txt',
                   icon: 'i-noto-sparkles',
                   target: '_blank',
                 },
                 {
                   label: 'llms-full.txt',
                   to: '/llms-full.txt',
                   icon: 'i-noto-sparkles',
                   target: '_blank',
                 }]"
      />
    </ClientOnly>

    <LazyFooter hydrate-on-visible />
    <ClientOnly>
      <LazyToolBackgroundIndicator v-if="shouldMountToolBackgroundIndicator" />
    </ClientOnly>
  </UApp>
</template>

<style>
/* Safelist (do not remove): [&>div]:*:my-0 [&>div]:*:w-full h-64 !px-0 !py-0 !pt-0 !pb-0 !p-0 !justify-start !min-h-96 h-136 border-(--ui-border-muted) bg-(--ui-bg) */
body::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.07;
  z-index: 10;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
  background-size: 100px 100px;
}
</style>
