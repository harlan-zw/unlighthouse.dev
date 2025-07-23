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

useSeoMeta({
  title: () => page.value?.title,
  description: () => page.value?.description,
  titleTemplate: '%s %separator %siteName',
})

useHead({
  link: () => {
    return [
      // add prev and next using surround
      ...(surround.value?.length
        ? surround.value.map((s, i) => {
            return {
              rel: i === 0 ? 'prev' : 'next',
              href: joinURL('https://unlighthouse.dev/', s.path),
            }
          })
        : []),
    ]
  },
})

const headline = computed(() => titleCase(getLastPathSegment(getPathSegments(route.path, route.path.split('/').length - 2))))

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

// add seo meta for last commit
if (lastCommit.value) {
  useSeoMeta({
    articleModifiedTime: lastCommit.value.date,
    ogType: 'article',
  })
}
</script>

<template>
  <div v-if="page">
    <div class="max-w-[66ch] ml-auto md:ml-0 md:mr-auto">
      <UPageHeader
        :title="page.title" :headline="headline" class="text-balance pt-4" :links="!['overview', 'intro-to-unhead'].includes(route.path.split('/').pop()) ? [
          { label: 'Copy for LLMs', to: repoLinks[1].to, icon: 'i-catppuccin-markdown', target: '_blank' },
        ] : []"
        :ui="{ title: 'leading-normal' }"
      >
        <div v-if="lastCommit" class="mt-3 text-sm">
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
      </UPageHeader>

      <UPageBody prose class="pb-0">
        <ContentRenderer v-if="page.body" :value="page" class="mb-10" />
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
        <USeparator v-if="surround?.length" class="my-8" />
        <UContentSurround :surround="surround" />
      </UPageBody>
    </div>
  </div>
</template>
