<script setup lang="ts">
import { titleCase } from 'scule'
import { joinURL } from 'ufo'
import { getLastPathSegment, getPathSegments } from '~~/utils/urls'

definePageMeta({
  layout: 'learn',
})

const route = useRoute()

const [{ data: page }, { data: surround }] = await Promise.all([
  useAsyncData(`learn-${route.path}`, () => queryCollection('learnLighthouse').path(route.path).first()),
  useAsyncData(`learn-${route.path}-surround`, () => queryCollectionItemSurroundings('learnLighthouse', route.path, {
    fields: ['title', 'description', 'navigation'],
    transform(items) {
      return items.map(m => ({
        ...m,
        _path: m.path,
      }))
    },
  })),
])

if (!page.value)
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

useSeoMeta({
  title: () => page.value?.title || '',
  description: () => page.value?.description,
})

useHead({
  link: () => {
    return [
      ...(surround.value?.length
        ? surround.value.filter(Boolean).map((s: any, i: number) => ({
            rel: i === 0 ? 'prev' : 'next',
            href: joinURL('https://unlighthouse.dev/', s.path),
          }))
        : []),
    ]
  },
})

const headline = computed(() => titleCase(getLastPathSegment(getPathSegments(route.path, route.path.split('/').length - 2))))

defineOgImageComponent('Docs', {
  title: page.value?.title,
  description: page.value?.description,
  headline,
})

const articlePublishedTime = computed(() => page.value?.publishedAt ? `${page.value.publishedAt}T12:00:00Z` : undefined)
const articleModifiedTime = computed(() => page.value?.updatedAt ? `${page.value.updatedAt}T12:00:00Z` : undefined)

useSeoMeta({
  ogType: 'article',
  author: 'Harlan Wilton',
  articleAuthor: ['Harlan Wilton'],
  articleSection: 'Lighthouse Tutorials',
  articleTag: page.value?.keywords,
  articlePublishedTime,
  articleModifiedTime,
  twitterData1: 'Harlan Wilton',
  twitterLabel1: 'Author',
  twitterData2: page.value?.readTime,
  twitterLabel2: 'Read Time',
})

useSchemaOrg([
  definePerson({
    '@id': '#author',
    'name': 'Harlan Wilton',
    'description': 'An open-source developer from Sydney, Australia. Core team member of Nuxt, VueUse and UnJS. Author of Unlighthouse, Unhead and Nuxt SEO.',
    'sameAs': [
      'https://twitter.com/harlan_zw',
      'https://github.com/harlan-zw',
    ],
    'url': 'https://harlanzw.com',
  }),
  defineArticle({
    author: { '@id': '#author' },
    keywords: page.value?.keywords,
    datePublished: articlePublishedTime.value,
    dateModified: articleModifiedTime.value,
    articleSection: ['Lighthouse Tutorials'],
  }),
])

const humanPublishedDate = computed(() => page.value?.publishedAt
  ? new Date(page.value.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  : '')

const humanUpdatedDate = computed(() => page.value?.updatedAt
  ? new Date(page.value.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  : '')
</script>

<template>
  <div class="flex justify-between w-full">
    <div class="xl:mx-auto w-full max-w-[66ch]">
      <UPageHeader v-bind="page" :ui="{ title: 'text-center text-balance xl:leading-normal min-w-full', description: 'text-center ' }">
        <div class="flex justify-center items-center gap-3 mt-5 text-sm text-[var(--ui-text-dimmed)] flex-wrap">
          <UBadge color="neutral" variant="outline">
            <NuxtLink to="https://x.com/harlan_zw" external target="_blank" class="inline-flex items-center gap-1.5">
              <img alt="Harlan Wilton" src="https://avatars.githubusercontent.com/u/5326365?v=4" class="w-4 h-4 rounded-full">
              <span class="hover:text-[var(--ui-text)] text-[var(--ui-text-muted)] transition">Harlan Wilton</span>
            </NuxtLink>
          </UBadge>
          <span v-if="page?.readTime">{{ page.readTime }} read</span>
          <span v-if="page?.publishedAt">
            Published <time class="font-semibold" :datetime="page.publishedAt">{{ humanPublishedDate }}</time>
          </span>
          <span v-if="page?.updatedAt && page.updatedAt !== page.publishedAt">
            Updated <time class="font-semibold" :datetime="page.updatedAt">{{ humanUpdatedDate }}</time>
          </span>
        </div>
      </UPageHeader>
      <UPageBody prose class="pb-0">
        <ContentRenderer v-if="page?.body" :value="page" />
        <USeparator v-if="surround?.length || page?.relatedPages?.length" class="my-8" />
        <ContentNext :surround="surround" :related-pages="page?.relatedPages" />
      </UPageBody>
    </div>

    <div class="hidden xl:block max-w-75 w-full">
      <div class="pt-11 pl-10 gap-5 flex flex-col">
        <div v-if="page?.body?.toc?.links?.length > 1">
          <div class="mb-5 flex items-center gap-2 text-[var(--ui-text-accented)]">
            <UIcon name="i-tabler-align-left-2" class="size-4" />
            <div class="text-xs font-medium">
              On this page
            </div>
          </div>
          <TableOfContents :links="page.body.toc.links" />
        </div>
        <Ads />
      </div>
    </div>
  </div>
</template>
