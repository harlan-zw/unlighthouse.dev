<script lang="ts" setup>
import { animate } from 'motion-v'
import { isHydratingRef } from '~/composables/data'

const route = useRoute()
const navOpen = ref(false)
const navigation = inject<Ref<any[]>>('navigation')

watch(() => route.path, () => {
  navOpen.value = false
})

const isHydrating = isHydratingRef()

const contentRef = ref(null)

onMounted(() => {
  if (!contentRef.value || isHydrating.value)
    return
  animate(contentRef.value, {
    opacity: [0, 1],
    transform: ['translateY(16px)', 'translateY(0px)'],
    filter: ['blur(0.2rem)', 'blur(0)'],
  }, { duration: 0.2 })
})

const subSectionLinks = computed(() => {
  if (!navigation?.value?.length)
    return []

  return [
    {
      label: 'User Guide',
      to: navigation.value.find(m => m.path.endsWith('/guide'))?.children?.[0]?.children?.[0]?.path || '/guide/getting-started/how-it-works',
      active: route.path.startsWith('/guide'),
    },
    {
      label: 'Integrations',
      icon: 'i-carbon-plug',
      to: navigation.value.find(m => m.path.endsWith('/integrations'))?.children?.[0]?.path || '/integrations/cli',
      active: route.path.startsWith('/integrations'),
    },
    {
      label: 'API',
      icon: 'i-heroicons-code-bracket',
      to: navigation.value.find(m => m.path.endsWith('/api-doc'))?.children?.[0]?.path || '/api-doc',
      active: route.path.startsWith('/api-doc'),
    },
  ].filter(i => !!i.to)
})
</script>

<template>
  <div>
    <div class="h-12 border-b border-(--ui-border)">
      <div class="relative max-w-[1452px] px-6 mx-auto flex h-full justify-between lg:justify-start items-center w-full">
        <button aria-label="Open Navigation Menu" class="font-semibold font-sm lg:hidden flex items-center gap-2 cursor-pointer" @click="navOpen = true">
          <UIcon name="i-carbon-menu" class="w-6 h-6" />
        </button>
        <div class="h-full flex text-sm space-x-6">
          <div v-for="item in subSectionLinks" :key="item.to">
            <NuxtLink
              :class="item.active ? 'group relative h-full flex items-center text-gray-800 dark:text-gray-200 font-semibold' : 'group relative h-full flex items-center font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'"
              :to="item.to"
            >
              {{ item.label }}
              <div :class="item.active ? 'absolute bottom-0 h-[1.5px] w-full bg-[var(--ui-primary)]' : 'absolute bottom-0 h-[1.5px] w-full group-hover:bg-gray-200 dark:group-hover:bg-gray-700'" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
    <UMain class="relative mb-20 px-5">
      <svg viewBox="0 0 1440 181" fill="none" xmlns="http://www.w3.org/2000/svg" class="left-0 text-violet-300/30 dark:text-violet-900/30 pointer-events-none absolute w-full top-[1px] transition-all text-primary flex-shrink-0 opacity-100 duration-[400ms] opacity-30 z-20"><mask id="path-1-inside-1_414_5526" fill="white"><path d="M0 0H1440V181H0V0Z" /></mask><path d="M0 0H1440V181H0V0Z" fill="url(#paint0_linear_414_5526)" fill-opacity="0.22" /><path d="M0 2H1440V-2H0V2Z" fill="url(#paint1_linear_414_5526)" mask="url(#path-1-inside-1_414_5526)" /><defs><linearGradient id="paint0_linear_414_5526" x1="720" y1="0" x2="720" y2="181" gradientUnits="userSpaceOnUse"><stop stop-color="currentColor" /><stop offset="1" stop-color="currentColor" stop-opacity="0" /></linearGradient><linearGradient id="paint1_linear_414_5526" x1="0" y1="90.5" x2="1440" y2="90.5" gradientUnits="userSpaceOnUse"><stop stop-color="currentColor" stop-opacity="0" /><stop offset="0.395" stop-color="currentColor" /><stop offset="1" stop-color="currentColor" stop-opacity="0" /></linearGradient></defs></svg>
      <div class="max-w-[1400px] mx-auto lg:pt-5">
        <UPage :ui="{ left: 'lg:col-span-3 xl:col-span-2', center: 'col-span-5 lg:col-span-7 xl:col-span-8' }">
          <template #left>
            <UPageAside class="max-w-[300px] pt-8">
              <DocsSidebarHeader />
            </UPageAside>
          </template>
          <div ref="contentRef" class="mx-auto pt-7">
            <slot />
          </div>
        </UPage>
      </div>
    </UMain>
    <UDrawer v-model:open="navOpen">
      <template #content>
        <div class="px-5">
          <div class="space-y-2 mb-3 mt-5 px-5">
            <div class="flex gap-4 justify-center">
              <NuxtLink
                v-for="item in subSectionLinks"
                :key="item.to"
                :to="item.to"
                :class="item.active ? 'text-gray-800 dark:text-gray-200 font-semibold' : 'text-gray-600 dark:text-gray-400'"
                class="text-sm"
              >
                {{ item.label }}
              </NuxtLink>
            </div>
          </div>
          <DocsSidebarHeader />
          <USeparator class="mb-5" />
        </div>
      </template>
    </UDrawer>
  </div>
</template>
