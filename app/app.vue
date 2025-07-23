<script setup lang="ts">
import { queryCollectionNavigation } from '#imports'
import { useStats } from '~/composables/data'

const { data: stats } = await useStats()
if (!stats.value) {
  createError({
    statusText: 'Missing stats.json!',
    status: 500,
  })
}
provide('stats', stats)

const appConfig = useAppConfig()

useHead({
  style: [
    { innerHTML: `:root { --ui-primary: #8e51ff; } .dark { --ui-primary: #8e51ff; }`, id: 'nuxt-ui-black-as-primary', tagPriority: -2 },
  ],
  htmlAttrs: {
    lang: 'en',
  },
  meta: [
    { name: 'theme-color', content: '#0000FF', media: '(prefers-color-scheme: light)' },
    { name: 'theme-color', content: '#000000', media: '(prefers-color-scheme: dark)' },
    { name: 'color-scheme', content: 'light dark' },
  ],
})

const {
  data: search,
} = await useLazyAsyncData(`search`, () => queryCollectionSearchSections('root'))
const {
  data: navigation,
} = await useLazyAsyncData(`navigation`, () => queryCollectionNavigation('root'), {
  default: () => [],
  async transform(res) {
    const nav = mapPath(res)
    return (nav || []).map((m) => {
      if (m.children?.length) {
        m.children = m.children.map((c) => {
          if (c.children?.length === 1) {
            c = c.children[0]
          }
          return c
        })
        m.children = m.children.map((c) => {
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
})
provide('search', search)
provide('navigation', navigation)

const searchTerm = ref('')

const { open: openSearch } = useContentSearch()

onKeyStroke('Divide', () => {
  openSearch.value = true
})
</script>

<template>
  <UApp :toaster="appConfig.toaster">
    <NuxtLoadingIndicator color="#FFF" />
    <Header class="z-100" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <LazyUContentSearch
        :key="openSearch"
        v-model:search-term="searchTerm"
        shortcut="/"
        :files="search"
        :navigation="navigation"
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

    <Footer />
  </UApp>
</template>

<style>
/* Safelist (do not remove): [&>div]:*:my-0 [&>div]:*:w-full h-64 !px-0 !py-0 !pt-0 !pb-0 !p-0 !justify-start !min-h-96 h-136 border-(--ui-border-muted) bg-(--ui-bg) */
</style>
