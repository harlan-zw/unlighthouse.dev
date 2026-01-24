<script setup lang="ts">
import type { NuxtError } from '#app'
import { queryCollectionNavigation, useAsyncData, useStats } from '#imports'
import Fuse from 'fuse.js'

const props = defineProps<{
  error: NuxtError
}>()

const appConfig = useAppConfig()

useSeoMeta({
  title: props.error.statusCode === 404 ? 'Page not found' : props.error.statusMessage,
  description: 'We are sorry but this page could not be found.',
})

const recommendedLinks = ref()

const { data: stats } = await useStats()
if (!stats.value) {
  createError({
    statusText: 'Missing stats.json!',
    status: 500,
  })
}
provide('stats', stats)
const { data: navigation } = await useAsyncData(`navigation-error`, () => queryCollectionNavigation('root'), {
  default: () => [],
  async transform(res) {
    const nav = mapPath(res)
    return (nav || []).map((m) => {
      if (m.path.includes('/releases')) {
        m.icon = 'i-noto-sparkles'
        m.title = 'Releases'
      }
      else if (m.path.includes('/migration-guide')) {
        m.icon = 'i-noto-globe-with-meridians'
        m.title = 'Migration Guides'
      }
      else if (m.path.includes('/guide')) {
        m.title = 'Core Concepts'
      }
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
provide('navigation', navigation)
const { data: search } = await useLazyAsyncData(`search-error`, () => queryCollectionSearchSections('root'))
provide('search', search)
// Don't do fuzzy redirects during prerender - it causes infinite redirect loops
const isPrerendering = import.meta.server && !import.meta.dev
if (props.error.statusCode && !isPrerendering) {
  const walkChildren = (children: any[], parents: string[] = []) => {
    return (children || []).flatMap((item) => {
      if (item.children) {
        // If this is a parent with children, add its title to the parents array
        // and pass that to recursive calls
        const currentPath = [...parents, item.title]
        return walkChildren(item.children, currentPath)
      }
      // For leaf nodes, include the hierarchy information
      return {
        ...item,
        hierarchy: parents,
        fullTitle: [...parents, item.title].join(' -> '),
      }
    })
  }
  const childrenOnly = walkChildren(navigation.value).map((i) => {
    return {
      title: i.title,
      path: i.path,
      lastPathSegment: i.path.split('/').slice(-1)[0],
      hierarchy: i.hierarchy,
      fullTitle: i.fullTitle,
    }
  })

  // do a fuse search for a page link it
  const fuse = new Fuse<{ path: string, lastPathSegment: string }>(childrenOnly, {
    keys: [
      {
        name: 'path',
        weight: 0.9,
      },
      {
        name: 'lastPathSegment',
        weight: 2,
      },
    ],
    ignoreLocation: true,
    isCaseSensitive: false,
    includeScore: true,
  })

  const path = useRoute().path
  const lastSegment = path.split('/').slice(-1)[0]
  const explicitMatch = childrenOnly.filter(i => i.lastPathSegment === lastSegment)
  // search for last segment see if we can find 1 direct match
  if (explicitMatch?.length === 1) {
    // redirect to the found path
    await navigateTo(explicitMatch[0].path, { redirectCode: 301 })
  }
  else {
    const res = fuse.search(path, {
      limit: 3,
    })
    if (res.length) {
      const { item, score } = res[0]
      // can't be ambigious
      const matchingScore = res[1]?.score === score || res[2]?.score === score
      if (score < 0.01 && !matchingScore) {
        await navigateTo(item.path, { redirectCode: 301 })
      }
      else {
        recommendedLinks.value = res
      }
    }
  }
}
</script>

<template>
  <UApp :toaster="appConfig?.toaster">
    <NuxtLoadingIndicator color="#FFF" />
    <Header class="z-100" />

    <NuxtLayout>
      <div class="w-4xl max-w-full">
        <UPageHeader
          :title="error.statusCode === 404 ? error.message : 'Something Went Wrong'"
          :description="error.statusCode === 404 ? 'Oops... we can\'t find that.' : 'Uh oh, looks like an error :('"
          class="mb-10 whitespace-break"
          :ui="{ title: 'max-w-full' }"
        />
        <!-- "Did you mean?" Section -->
        <div v-if="error.statusCode === 404" class="max-w-2xl">
          <h2 class="text-xl font-semibold  mb-4">
            Did you mean?
          </h2>

          <!-- Recommended Links -->
          <div class="bg-[var(--ui-bg)] border-[var(--ui-border)] rounded-lg shadow-sm border  overflow-hidden">
            <nav>
              <ul class="divide-y divide-gray-100 dark:divide-neutral-800">
                <li
                  v-for="(link, index) in recommendedLinks"
                  :key="index"
                  class="hover:bg-[var(--ui-bg-elevated)] transition-colors duration-150"
                >
                  <NuxtLink
                    :to="link.item.path"
                    class="p-4 text-[var(--ui-text)] hover:text-[var(--ui-text-inverse)] block"
                  >
                    <div class="text-sm text-[var(--ui-text-dimmed)] mb-1">
                      {{ link.item.hierarchy.slice(-3).join(' > ') }}
                    </div>
                    <div class="font-medium" v-html="link.item.title" />
                    <div
                      v-if="!link.item.html" class="flex items-center justify-between gap-2 w-full"
                      :class="link.item.deprecated ? 'opacity-50' : ''"
                    >
                      <div class="flex items-center gap-2">
                        {{ link.title }}
                      </div>
                      <UIcon v-if="link.tag" :name="`i-logos-${link.tag}`" dynamclic ass="w-4 h-4" />
                    </div>
                    <div v-else :class="link.item.deprecated ? 'opacity-50' : ''">
                      <UIcon v-if="link.item.icon" :name="link.icon" class="w-4 h-4 text-(--ui-primary)-400 dark:text-sky-200" />
                      <div v-html="link.item.title" />
                    </div>
                  </NuxtLink>
                </li>
                <!-- Empty state if no recommended links -->
                <li v-if="!recommendedLinks || recommendedLinks.length === 0" class="p-4 text-center text-gray-500">
                  No suggestions available
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <!-- Additional Error Message (if not 404) -->
        <div v-if="error.statusCode !== 404" class="text-red-500 mb-8 p-4 bg-red-50 rounded-lg">
          {{ error.message }}
        </div>
      </div>
    </NuxtLayout>

    <ClientOnly />

    <Footer />
  </UApp>
</template>
