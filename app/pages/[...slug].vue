<script setup lang="ts">
import { titleCase } from 'scule'
import { joinURL } from 'ufo'
import { getLastPathSegment, getPathSegments } from '~~/utils/urls'
import { useCurrentDocPage } from '~/composables/data'

definePageMeta({
  layout: 'docs',
})

const route = useRoute()

const { page, surround, lastCommit } = await useCurrentDocPage()
if (!page.value?.id) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

// Handle client-side navigation
watch(() => route.path, async () => {
  const data = await useCurrentDocPage()
  page.value = data.page.value
  surround.value = data.surround.value
  lastCommit.value = data.lastCommit.value
})

useSeoMeta({
  title: () => page.value?.title,
  description: () => page.value?.description,
  titleTemplate: '%s %separator %siteName',
})

useHead({
  link: () => {
    return [
      ...(surround.value?.length
        ? surround.value.map((s: any, i: number) => ({
            rel: i === 0 ? 'prev' : 'next',
            href: joinURL('https://unlighthouse.dev/', s.path),
          }))
        : []),
    ]
  },
})

const headline = computed(() => titleCase(getLastPathSegment(getPathSegments(route.path, route.path.split('/').length - 2))))

defineOgImage('Docs', {
  title: page.value?.title,
  description: page.value?.description,
  headline: headline.value,
})

prerenderRoutes(`${route.path}.md`)

const repoLinks = computed(() => [
  {
    label: 'Edit this page',
    to: `https://github.com/harlan-zw/unlighthouse/edit/main/docs/${String(page.value?.stem || '')}.md`,
    target: '_blank',
  },
  {
    label: 'Markdown For LLMs',
    to: `${route.path}.md`,
    target: '_blank',
  },
])

watchEffect(() => {
  if (lastCommit.value) {
    useSeoMeta({
      articleModifiedTime: lastCommit.value.date,
      ogType: 'article',
    })
  }
})
</script>

<template>
  <div class="flex justify-between w-full">
    <div class="max-w-[66ch] ml-auto md:ml-0 md:mr-auto w-full">
      <UPageHeader
        :title="page?.title" :headline="headline" class="text-balance pt-4" :links="!['overview', 'intro-to-unhead'].includes(route.path.split('/').pop() || '') ? [
          { label: 'Copy for LLMs', to: repoLinks[1].to, icon: 'i-catppuccin-markdown', target: '_blank' },
        ] : []"
        :ui="{ title: 'leading-normal' }"
      >
        <ClientOnly>
          <div v-if="lastCommit?.author" class="mt-3 text-sm">
            <div class="text-[var(--ui-text-dimmed)]">
              Last updated <time class="font-semibold" :datetime="lastCommit.date">{{ lastCommit.dateHuman }}</time> by <UBadge color="neutral" variant="outline">
                <NuxtLink :to="`https://github.com/${lastCommit.author.committer}`" external target="_blank" class="inline-flex items-center gap-1.5">
                  <div class="hover:text-[var(--ui-text)] text-[var(--ui-text-muted)] transition">
                    {{ lastCommit.author.name }}
                  </div>
                </NuxtLink>
              </UBadge> in <UBadge variant="outline" color="neutral" class="my-1">
                <NuxtLink :to="lastCommit.url" target="_blank" external class="hover:text-[var(--ui-text)] text-[var(--ui-text-muted)] transition max-w-[250px] whitespace-nowrap overflow-hidden text-ellipsis">
                  {{ lastCommit.message }}
                </NuxtLink>
              </UBadge>.
            </div>
          </div>
        </ClientOnly>
      </UPageHeader>

      <UPageBody prose class="pb-0">
        <ContentRenderer v-if="page?.body" :value="page" class="mb-10" />
        <div class="justify-center flex items-center gap-5 font-semibold">
          <div class="flex items-center gap-2">
            <UIcon name="i-simple-icons-github" class="w-5 h-5" />
            <NuxtLink v-bind="repoLinks[0]" class="hover:underline">
              {{ repoLinks[0].label }}
            </NuxtLink>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-simple-icons-markdown" class="w-5 h-5" />
            <NuxtLink v-bind="repoLinks[1]" class="hover:underline">
              {{ repoLinks[1].label }}
            </NuxtLink>
          </div>
        </div>
        <FeedbackButtons :edit-link="repoLinks[0].to" />
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
