<script setup lang="ts">
import type { NuxtError } from '#app'
import Fuse from 'fuse.js'
import { inlineHighlightedCode } from '~~/shared/rangi'
import { queryCollectionNavigation, useAsyncData } from '#imports'

const props = defineProps<{
  error: NuxtError
}>()

const appConfig = useAppConfig()

useSeoMeta({
  title: props.error.statusCode === 404 ? 'Page not found' : props.error.statusMessage,
  description: 'We are sorry but this page could not be found.',
})

const recommendedLinks = ref()

const { data: navigation } = useAsyncData(`navigation-error`, () => queryCollectionNavigation('root'), {
  server: false,
  lazy: true,
  default: () => [],
  async transform(res: any) {
    const nav = mapPath(res)
    return (nav || []).map((m: any) => {
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
        m.children = m.children.map((c: any) => {
          if (c.children?.length === 1) {
            c = c.children[0]
          }
          return c
        })
        m.children = m.children.map((c: any) => {
          if (c.title.endsWith('()')) {
            c.html = true
            c.title = inlineHighlightedCode(c.title, 'ts')
          }
          else if (c.title.startsWith('<') && c.title.endsWith('>') && !c.title.includes('<code')) {
            c.html = true
            c.title = inlineHighlightedCode(c.title, 'vue')
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

if (import.meta.client && props.error.statusCode === 404) {
  const route = useRoute()
  watch(navigation, async (nav) => {
    if (!nav?.length)
      return

    const walkChildren = (children: any[], parents: string[] = []): any[] => {
      return (children || []).flatMap((item) => {
        if (item.children) {
          const currentPath = [...parents, item.title]
          return walkChildren(item.children, currentPath)
        }
        return {
          ...item,
          hierarchy: parents,
          fullTitle: [...parents, item.title].join(' -> '),
        }
      })
    }
    const childrenOnly = walkChildren(nav as any[]).map((i: any) => {
      return {
        title: i.title,
        path: i.path,
        lastPathSegment: i.path.split('/').slice(-1)[0],
        hierarchy: i.hierarchy,
        fullTitle: i.fullTitle,
      }
    })

    interface SearchItem {
      path: string
      lastPathSegment: string
    }

    const fuse = new Fuse<SearchItem>(childrenOnly, {
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

    const path = route.path
    const lastSegment = path.split('/').slice(-1)[0]
    const explicitMatch = childrenOnly.filter(i => (i as any).lastPathSegment === lastSegment)
    if (explicitMatch?.length === 1 && explicitMatch[0]) {
      await navigateTo(explicitMatch[0].path, { redirectCode: 301 })
      return
    }

    const res = fuse.search(path, {
      limit: 3,
    })
    if (res.length > 0 && res[0]) {
      const { item, score } = res[0]
      const matchingScore = (res[1]?.score === score || res[2]?.score === score)
      if (score !== undefined && score < 0.01 && !matchingScore) {
        await navigateTo(item.path, { redirectCode: 301 })
      }
      else {
        recommendedLinks.value = res
      }
    }
  }, { immediate: true })
}
</script>

<template>
  <UApp :toaster="appConfig?.toaster">
    <NuxtLoadingIndicator color="#FFF" />
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-default focus:px-4 focus:py-3 focus:text-highlighted focus:ring-2 focus:ring-primary"
    >
      Skip to main content
    </a>
    <Header class="z-100" />

    <main id="main-content" tabindex="-1">
      <NuxtLayout name="default">
        <div class="w-4xl max-w-full mx-auto px-6 py-12 lg:py-16">
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
            <div class="bg-default border-default rounded-lg shadow-sm border  overflow-hidden">
              <nav aria-label="Suggested pages">
                <ul class="divide-y divide-gray-100 dark:divide-neutral-800">
                  <li
                    v-for="(link, index) in recommendedLinks"
                    :key="index"
                    class="hover:bg-elevated transition-colors duration-150"
                  >
                    <NuxtLink
                      :to="link.item.path"
                      class="p-4 text-default hover:text-[var(--ui-text-inverse)] block"
                    >
                      <div class="text-sm text-dimmed mb-1">
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
                        <UIcon v-if="link.tag" :name="`i-logos-${link.tag}`" class="w-4 h-4" />
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
    </main>

    <ClientOnly />

    <LazyFooter hydrate-on-visible />
  </UApp>
</template>
