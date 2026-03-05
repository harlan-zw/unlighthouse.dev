<script setup lang="ts">
import { useStats } from '../composables/data'
import { productMenu, resourcesMenu } from '../composables/nav'

const { data: stats } = await useStats()
const githubStars = computed(() => {
  const stars = stats.value?.stars?.stars || 0
  return Intl.NumberFormat('en', { notation: 'compact', compactDisplay: 'short' }).format(stars)
})

const navigation = inject('navigation')
const { open: openSearch } = useContentSearch()

onKeyStroke('Divide', () => {
  openSearch.value = true
})

// Resources with dropdowns
const learnNav = computed(() => resourcesMenu.value.find(i => i.label === 'Learn'))
const toolsNav = computed(() => resourcesMenu.value.find(i => i.label === 'Tools'))

// Group docs navigation for mobile — use children to avoid redundant parent labels
const mobileDocsGroups = computed(() => {
  const nav = toValue(navigation)
  if (!nav?.length)
    return []
  const childrenOf = (prefix: string) => nav.find(n => n.path?.startsWith(prefix))?.children || []
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
      container: 'max-w-[1452px] lg:bg-gray-600/3 lg:border border-[var(--ui-border)] lg:dark:bg-gray-900/10 mx-auto py-0 px-0 lg:px-5 sm:px-0 rounded-lg',
    }"
  >
    <template #left>
      <Logo />
    </template>

    <template #default>
      <UNavigationMenu :items="productMenu" class="hidden lg:flex justify-center" />
      <UNavigationMenu :ui="{ viewport: 'min-w-[580px]' }" :items="[learnNav]" class="hidden lg:flex justify-center">
        <template #item-content>
          <LearnMenu />
        </template>
      </UNavigationMenu>
      <UNavigationMenu :ui="{ viewport: 'min-w-[680px]' }" :items="[toolsNav]" class="hidden lg:flex justify-center">
        <template #item-content>
          <ToolMenu />
        </template>
      </UNavigationMenu>
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
          <template v-if="group.nav.some(s => s.children?.length)">
            <template v-for="section in group.nav" :key="section.path">
              <div class="space-y-1">
                <p class="text-[11px] font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider px-2">
                  {{ `${group.label} - ${section.title}` }}
                </p>
                <nav class="space-y-0.5">
                  <NuxtLink
                    v-for="child in (section.children || [section])"
                    :key="child.path"
                    :to="child.path"
                    class="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-[var(--ui-text)] hover:bg-[var(--ui-bg-elevated)] transition-colors"
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
              <p class="text-[11px] font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider px-2">
                {{ group.label }}
              </p>
              <nav class="space-y-0.5">
                <NuxtLink
                  v-for="item in group.nav"
                  :key="item.path"
                  :to="item.path"
                  class="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-[var(--ui-text)] hover:bg-[var(--ui-bg-elevated)] transition-colors"
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
          <p class="text-[11px] font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider px-2">
            Learn
          </p>
          <nav class="space-y-0.5">
            <NuxtLink
              v-for="item in learnNav?.children"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-[var(--ui-text)] hover:bg-[var(--ui-bg-elevated)] transition-colors"
            >
              <UIcon v-if="item.icon" :name="item.icon" class="w-4 h-4 opacity-60" />
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>

        <USeparator />

        <!-- Mobile: Tools section -->
        <div class="space-y-1">
          <p class="text-[11px] font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider px-2">
            Tools
          </p>
          <nav class="space-y-0.5">
            <NuxtLink
              v-for="item in toolsNav?.children"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-[var(--ui-text)] hover:bg-[var(--ui-bg-elevated)] transition-colors"
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
