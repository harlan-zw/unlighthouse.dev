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
      <UNavigationMenu :ui="{ viewport: 'min-w-[450px]' }" :items="[learnNav]" class="hidden lg:flex justify-center">
        <template #item-content="{ item }">
          <ul class="grid grid-cols-3 p-2 gap-2">
            <li v-for="child in item.children" :key="child.to" class="text-center">
              <UButton variant="ghost" :to="child.to" class="w-full">
                <div class="w-full">
                  <div class="flex items-center justify-center gap-1 w-full mb-1">
                    <UIcon :name="child.icon" class="block w-6 h-6 mb-0.5 align-text-top opacity-85" />
                  </div>
                  <div class="text-xs text-muted">
                    {{ child.label }}
                  </div>
                </div>
              </UButton>
            </li>
          </ul>
        </template>
      </UNavigationMenu>
      <UNavigationMenu :ui="{ viewport: 'min-w-[540px]' }" :items="[toolsNav]" class="hidden lg:flex justify-center">
        <template #item-content="{ item }">
          <ToolsMenu />
        </template>
      </UNavigationMenu>
    </template>

    <!-- Mobile menu body -->
    <template #body>
      <div class="space-y-3">
        <div class="flex gap-3">
          <UInput
            type="search"
            size="sm"
            class="cursor-pointer w-[70px]"
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
          <UTooltip text="Star on GitHub">
            <UButton
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
          <UTooltip text="Open Unlighthouse on GitHub">
            <UButton
              aria-label="Unlighthouse on GitHub"
              to="https://github.com/harlan-zw/unlighthouse"
              target="_blank"
              color="neutral"
              variant="ghost"
              icon="i-carbon-logo-github"
            />
          </UTooltip>
        </div>
        <USeparator />

        <!-- Mobile: Product section -->
        <div class="space-y-1">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
            Unlighthouse
          </p>
          <UContentNavigation :navigation="navigation" />
        </div>

        <USeparator />

        <!-- Mobile: Resources section -->
        <div class="space-y-1">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
            Resources
          </p>
          <nav class="space-y-1">
            <NuxtLink
              v-for="item in resourcesMenu"
              :key="item.label"
              :to="item.to"
              class="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <UIcon v-if="item.icon" :name="item.icon" class="w-4 h-4 opacity-70" />
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
