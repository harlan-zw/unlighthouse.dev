<script setup lang="ts">
import { NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger, NavigationMenuViewport } from 'reka-ui'
import { useStats } from '../composables/data'
import { resourcesMenu } from '../composables/nav'

const { data: stats } = await useStats()
const githubStars = computed(() => {
  const stars = stats.value?.stars?.stars || 0
  return Intl.NumberFormat('en', { notation: 'compact', compactDisplay: 'short' }).format(stars)
})

const navigation = inject<any>('navigation')
const { open: openSearch } = useContentSearch()

onKeyStroke('Divide', () => {
  openSearch.value = true
})

const learnNav = computed(() => resourcesMenu.value.find(i => i.label === 'Learn'))
const toolsNav = computed(() => resourcesMenu.value.find(i => i.label === 'Tools'))

const megaMenuItems = computed(() => [
  { value: 'get-started', label: 'Get Started', icon: 'i-ph:book-open-duotone', to: '/guide/getting-started/installation' },
  { value: 'learn', label: 'Learn', icon: 'i-heroicons-academic-cap', to: '/learn-lighthouse', hasDropdown: true },
  { value: 'tools', label: 'Tools', icon: 'i-heroicons-wrench-screwdriver', to: '/tools', hasDropdown: true },
])

// Group docs navigation for mobile — use children to avoid redundant parent labels
const mobileDocsGroups = computed(() => {
  const nav = toValue(navigation)
  if (!nav?.length)
    return []
  const childrenOf = (prefix: string) => nav.find((n: any) => n.path?.startsWith(prefix))?.children || []
  return [
    { label: 'User Guide', nav: childrenOf('/guide') },
    { label: 'Integrations', nav: childrenOf('/integrations') },
    { label: 'API', nav: childrenOf('/api-doc') },
  ].filter(g => g.nav.length)
})
</script>

<template>
  <UHeader
    :to="undefined"
    :ui="{
      root: 'border-none bg-transparent pt-2 mb-3 px-5 h-auto',
      container: 'max-w-[1452px] lg:bg-white/3 lg:border border-default lg:dark:bg-gray-900/10 mx-auto py-0 px-0 lg:px-5 sm:px-0 rounded-lg',
    }"
  >
    <template #left>
      <Logo />
    </template>

    <template #default>
      <NavigationMenuRoot class="hidden lg:flex justify-center relative py-2">
        <NavigationMenuList class="flex items-center gap-0.5">
          <NavigationMenuItem v-for="item in megaMenuItems" :key="item.value" :value="item.value">
            <template v-if="item.hasDropdown">
              <NavigationMenuTrigger as-child>
                <NuxtLink
                  :to="item.to"
                  class="group relative flex items-center gap-1.5 font-medium text-sm px-2.5 py-1.5 before:absolute before:z-[-1] before:rounded-md before:inset-x-px before:inset-y-0 data-[state=open]:before:bg-elevated data-[state=open]:text-highlighted before:transition-colors transition-colors"
                >
                  <UIcon :name="item.icon" class="shrink-0 size-4 opacity-50 group-hover:opacity-80 group-data-[state=open]:opacity-90 transition-opacity" />
                  {{ item.label }}
                </NuxtLink>
              </NavigationMenuTrigger>
              <NavigationMenuContent
                class="absolute top-0 left-0 w-auto data-[motion=from-start]:animate-[enter-from-left_200ms_ease] data-[motion=from-end]:animate-[enter-from-right_200ms_ease] data-[motion=to-start]:animate-[exit-to-left_200ms_ease] data-[motion=to-end]:animate-[exit-to-right_200ms_ease]"
              >
                <LearnMenu v-if="item.value === 'learn'" />
                <ToolMenu v-else-if="item.value === 'tools'" />
              </NavigationMenuContent>
            </template>

            <NuxtLink
              v-else
              :to="item.to"
              class="group relative flex items-center gap-1.5 font-medium text-sm px-2.5 py-1.5 before:absolute before:z-[-1] before:rounded-md before:inset-x-px before:inset-y-0 before:transition-colors transition-colors"
            >
              <UIcon :name="item.icon" class="shrink-0 size-4 opacity-50 group-hover:opacity-80 transition-opacity" />
              {{ item.label }}
            </NuxtLink>
          </NavigationMenuItem>
        </NavigationMenuList>

        <Teleport to="body">
          <NavigationMenuViewport
            class="fixed top-[60px] left-1/2 -translate-x-1/2 overflow-hidden bg-elevated shadow-xl rounded-md ring-1 ring-[var(--ui-border-accented)] h-(--reka-navigation-menu-viewport-height) w-(--reka-navigation-menu-viewport-width) transition-[width,height] duration-200 origin-[top_center] data-[state=open]:animate-[scale-in_100ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in] z-[100]"
          />
        </Teleport>
      </NavigationMenuRoot>
    </template>

    <template #body>
      <div class="space-y-4">
        <!-- Mobile: Search & actions -->
        <div class="flex items-center gap-2">
          <UButton class="flex-1" variant="outline" color="neutral" @click="openSearch = true">
            <template #leading>
              <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 opacity-60" />
            </template>
            Search...
            <template #trailing>
              <UKbd>/</UKbd>
            </template>
          </UButton>
          <UButton
            aria-label="Unlighthouse on GitHub"
            to="https://github.com/harlan-zw/unlighthouse"
            target="_blank"
            color="neutral"
            variant="outline"
            icon="i-carbon-logo-github"
          />
          <ColorModeButton />
        </div>

        <USeparator />

        <!-- Mobile: Docs navigation grouped -->
        <template v-for="group in mobileDocsGroups" :key="group.label">
          <!-- Nested: sections have their own children (e.g. User Guide) -->
          <template v-if="group.nav.some((s: any) => s.children?.length)">
            <template v-for="section in group.nav" :key="section.path">
              <div class="space-y-1">
                <p class="text-[11px] font-semibold text-muted uppercase tracking-wider px-2">
                  {{ `${group.label} - ${section.title}` }}
                </p>
                <nav class="space-y-0.5">
                  <NuxtLink
                    v-for="child in (section.children || [section])"
                    :key="child.path"
                    :to="child.path"
                    class="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-default hover:bg-elevated transition-colors"
                  >
                    {{ child.title }}
                  </NuxtLink>
                </nav>
              </div>
              <USeparator />
            </template>
          </template>
          <!-- Flat: sections are leaf items (e.g. Integrations, API) -->
          <template v-else>
            <div class="space-y-1">
              <p class="text-[11px] font-semibold text-muted uppercase tracking-wider px-2">
                {{ group.label }}
              </p>
              <nav class="space-y-0.5">
                <NuxtLink
                  v-for="item in group.nav"
                  :key="item.path"
                  :to="item.path"
                  class="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-default hover:bg-elevated transition-colors"
                >
                  {{ item.title }}
                </NuxtLink>
              </nav>
            </div>
            <USeparator />
          </template>
        </template>

        <!-- Mobile: Learn section -->
        <div class="space-y-1">
          <p class="text-[11px] font-semibold text-muted uppercase tracking-wider px-2">
            Learn
          </p>
          <nav class="space-y-0.5">
            <NuxtLink
              v-for="item in learnNav?.children"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-default hover:bg-elevated transition-colors"
            >
              <UIcon v-if="item.icon" :name="item.icon" class="w-4 h-4 opacity-60" />
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>

        <USeparator />

        <!-- Mobile: Tools section -->
        <div class="space-y-1">
          <p class="text-[11px] font-semibold text-muted uppercase tracking-wider px-2">
            Tools
          </p>
          <nav class="space-y-0.5">
            <NuxtLink
              v-for="item in toolsNav?.children"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-default hover:bg-elevated transition-colors"
            >
              <UIcon v-if="item.icon" :name="item.icon" class="w-4 h-4 opacity-60" />
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>
      </div>
    </template>

    <template #right>
      <div class="flex items-center justify-end lg:-mr-1.5 ml-3 gap-2">
        <!-- Search -->
        <UInput
          type="search"
          size="sm"
          class="cursor-pointer hidden lg:block w-[70px]"
          shortcut="divide"
          @click="openSearch = true"
        >
          <template #leading>
            <UContentSearchButton
              size="sm"
              class="cursor-pointer p-0 opacity-70 hover:opacity-100"
              @click="openSearch = true"
            />
          </template>
          <template #trailing>
            <UKbd @click="openSearch = true">
              /
            </UKbd>
          </template>
        </UInput>

        <!-- GitHub stars -->
        <UTooltip text="Star on GitHub">
          <UButton
            class="hidden sm:flex"
            to="https://github.com/harlan-zw/unlighthouse"
            target="_blank"
            color="primary"
            variant="ghost"
          >
            <template #leading>
              <div class="flex items-center transition rounded-l py-1 space-x-1 dark:text-neutral-200">
                <UIcon name="i-carbon-star" class="w-3 h-3" />
              </div>
            </template>
            <div class="font-semibold font-mono">
              {{ githubStars }}
            </div>
          </UButton>
        </UTooltip>

        <!-- Color mode -->
        <ColorModeButton />

        <!-- GitHub link -->
        <UTooltip text="Open Unlighthouse on GitHub">
          <UButton
            aria-label="Unlighthouse on GitHub"
            to="https://github.com/harlan-zw/unlighthouse"
            target="_blank"
            color="neutral"
            variant="ghost"
            class="hidden lg:inline-flex transition opacity-85"
            icon="i-carbon-logo-github"
          />
        </UTooltip>
      </div>
    </template>
  </UHeader>
</template>
