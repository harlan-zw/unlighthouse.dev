<script setup lang="ts">
import { useStats } from '../composables/data'
import { menu } from '../composables/nav'

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
</script>

<template>
  <UHeader :ui="{ root: 'border-none bg-transparent pt-2 mb-3 px-5 h-auto', container: 'max-w-[1452px] lg:bg-gray-600/3 lg:border border-[var(--ui-border)] lg:dark:bg-gray-900/10 mx-auto py-0 px-0 lg:px-5 sm:px-0 rounded-lg' }">
    <template #left>
      <Logo />
      <div class="hidden lg:block">
        <UNavigationMenu :ui="{ viewport: 'min-w-[600px]' }" :items="menu.slice(0, 3)" class="justify-center" />
      </div>
    </template>

    <template #body>
      <div class="space-y-3">
        <div class="flex gap-3">
          <UInput type="search" size="sm" class="cursor-pointer w-[70px]" shortcut="divide" @click="openSearch = true">
            <template #leading>
              <UContentSearchButton size="sm" class="cursor-pointer  p-0 opacity-70 hover:opacity-100" @click="openSearch = true" />
            </template>
            <template #trailing>
              <UKbd @click="openSearch = true">
                /
              </UKbd>
            </template>
          </UInput>
          <UTooltip text="Star on GitHub">
            <UButton to="https://github.com/harlan-zw/unlighthouse" target="_blank" color="primary" variant="ghost">
              <template #leading>
                <div class="flex items-center transition rounded-l py-1 space-x-1 dark:text-neutral-200">
                  <UIcon name="i-carbon-star" class="w-3 h-3 " />
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
        <UContentNavigation :navigation="navigation" />
      </div>
    </template>

    <template #right>
      <div class="flex items-center justify-end lg:-mr-1.5 ml-3 gap-3">
        <div class="hidden lg:block">
          <UNavigationMenu :items="menu.slice(3)" :ui="{ viewport: 'min-w-[500px] -left-full' }" class="justify-center" />
        </div>
        <div>
          <UInput type="search" size="sm" class="cursor-pointer hidden lg:block w-[70px]" shortcut="divide" @click="openSearch = true">
            <template #leading>
              <UContentSearchButton size="sm" class="cursor-pointer  p-0 opacity-70 hover:opacity-100" @click="openSearch = true" />
            </template>
            <template #trailing>
              <UKbd @click="openSearch = true">
                /
              </UKbd>
            </template>
          </UInput>
        </div>
        <UTooltip text="Star on GitHub">
          <UButton class="hidden sm:flex" to="https://github.com/harlan-zw/unlighthouse" target="_blank" color="primary" variant="ghost">
            <template #leading>
              <div class="flex items-center transition rounded-l py-1 space-x-1 dark:text-neutral-200">
                <UIcon name="i-carbon-star" class="w-3 h-3 " />
              </div>
            </template>
            <div class="font-semibold font-mono">
              {{ githubStars }}
            </div>
          </UButton>
        </UTooltip>

        <ColorModeButton />

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
