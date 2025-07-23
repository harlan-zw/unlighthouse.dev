<script lang="ts" setup>
import { motion } from 'motion-v'
import { isHydratingRef, useCurrentDocPage } from '~/composables/data'

const route = useRoute()
const navOpen = ref(false)

const currentPage = await useCurrentDocPage()
provide('currentPage', currentPage)
watch(() => route.path, async () => {
  navOpen.value = false
  if (route.path.startsWith('/guides') || route.path.startsWith('/api') || route.path.startsWith('/integrations')) {
    const newData = await useCurrentDocPage()
    currentPage.page.value = newData.page.value
    currentPage.surround.value = newData.surround.value
    currentPage.lastCommit.value = newData.lastCommit.value
  }
})

const page = computed(() => currentPage.page?.value)

const isHydrating = isHydratingRef()

const topLinks = computed(() => [
  {
    title: 'Discord Support',
    icon: 'i-carbon-question-answering',
    link: {
      to: 'https://discord.com/invite/275MBUBvgP',
      target: '_blank',
      external: true,
    },
  },
].filter(l => !!l.link.to))
</script>

<template>
  <div>
    <UMain class="relative mb-20 px-5">
      <svg viewBox="0 0 1440 181" fill="none" xmlns="http://www.w3.org/2000/svg" class="left-0  text-violet-300/30 dark:text-violet-900/30 pointer-events-none absolute w-full top-[1px] transition-all text-primary flex-shrink-0 opacity-100 duration-[400ms] opacity-30 z-20"><mask id="path-1-inside-1_414_5526" fill="white"><path d="M0 0H1440V181H0V0Z" /></mask><path d="M0 0H1440V181H0V0Z" fill="url(#paint0_linear_414_5526)" fill-opacity="0.22" /><path d="M0 2H1440V-2H0V2Z" fill="url(#paint1_linear_414_5526)" mask="url(#path-1-inside-1_414_5526)" /><defs><linearGradient id="paint0_linear_414_5526" x1="720" y1="0" x2="720" y2="181" gradientUnits="userSpaceOnUse"><stop stop-color="currentColor" /><stop offset="1" stop-color="currentColor" stop-opacity="0" /></linearGradient><linearGradient id="paint1_linear_414_5526" x1="0" y1="90.5" x2="1440" y2="90.5" gradientUnits="userSpaceOnUse"><stop stop-color="currentColor" stop-opacity="0" /><stop offset="0.395" stop-color="currentColor" /><stop offset="1" stop-color="currentColor" stop-opacity="0" /></linearGradient></defs></svg>
      <div class="max-w-[1400px] mx-auto lg:pt-5">
        <UPage :ui="{ left: 'lg:col-span-3 xl:col-span-2', right: 'lg:col-span-2 hidden xl:block', center: 'col-span-5 xl:col-span-6' }">
          <template #right>
            <div class="pt-11 pl-10 space-y-5 flex flex-col">
              <ul class="isolate -ml-3">
                <li v-for="link in topLinks" :key="link.link.to">
                  <NuxtLink
                    v-bind="link.link"
                    class="group relative w-full px-2.5 py-1.5 before:inset-y-px before:inset-x-0 flex items-center gap-1.5 text-sm before:absolute before:z-[-1] before:rounded-[calc(var(--ui-radius)*1.5)] focus:outline-none focus-visible:outline-none focus-visible:before:ring-inset focus-visible:before:ring-2 text-[var(--ui-text-toned)] focus-visible:before:ring-(--ui-primary) hover:text-(--ui-text-highlighted) hover:before:bg-(--ui-bg-elevated)/50 data-[state=open]:text-(--ui-text-highlighted) transition-colors before:transition-colors"
                  >
                    <div
                      class="rounded-md p-1 inline-flex ring-inset ring-1 bg-neutral-100/10 dark:bg-neutral-800/50 ring-neutral-200 dark:ring-neutral-700 group-hover:bg-primary group-hover:ring-primary group-hover:text-background"
                    >
                      <UIcon v-if="link.icon" :name="link.icon" class="w-4 h-4 text-blue-400 dark:text-blue-300" />
                    </div>
                    <span class="truncate">{{ link.title }}</span>
                  </NuxtLink>
                </li>
              </ul>
              <USeparator class="mt-0 pt-0" />
              <div class="gap-5 flex flex-col">
                <template v-if="page?.body?.toc?.links?.length > 1">
                  <div>
                    <div class="mb-5 flex items-center gap-2  text-[var(--ui-text-accented)]">
                      <UIcon name="i-tabler-align-left-2" class="size-4 " />
                      <div class="text-xs  font-medium">
                        On this page
                      </div>
                    </div>
                    <TableOfContents :links="page.body?.toc?.links" />
                  </div>
                </template>
                <Ads />
              </div>
            </div>
          </template>
          <template #left>
            <UPageAside class="max-w-[300px] pt-8">
              <DocsSidebarHeader />
            </UPageAside>
          </template>
          <AnimatePresence v-if="motion" mode="wait">
            <motion.div
              :key="route.path"
              :initial="isHydrating ? {} : { opacity: 0, y: 16, filter: 'blur(0.2rem)' }"
              :animate="{ opacity: 1, y: 0, filter: 'blur(0)' }"
              :exit="{ opacity: 0, y: 16, filter: 'blur(0.2rem)' }"
              :transition="{
                duration: 0.2,
              }"
            >
              <div class="max-w-[66ch] mx-auto pt-7">
                <slot />
              </div>
            </motion.div>
          </AnimatePresence>
        </UPage>
      </div>
    </UMain>
  </div>
</template>
