<script lang="ts" setup>
import { motion } from 'motion-v'
import { isHydratingRef } from '~/composables/data'

const route = useRoute()

interface NavItem {
  path: string
  title: string
  icon?: string
  to?: string
  children?: NavItem[]
}

interface NavSection {
  label: string
  icon: string
  items: NavItem[]
}

const pillarConfig: Record<string, { icon: string, title: string, section: string }> = {
  'core-web-vitals': { icon: 'i-heroicons-chart-bar', title: 'Core Web Vitals Guide', section: 'guides' },
  'bulk-lighthouse-testing': { icon: 'i-heroicons-squares-2x2', title: 'Bulk Lighthouse Testing', section: 'guides' },
  'lcp': { icon: 'i-heroicons-photo', title: 'LCP', section: 'cwv' },
  'cls': { icon: 'i-heroicons-arrows-pointing-in', title: 'CLS', section: 'cwv' },
  'inp': { icon: 'i-heroicons-cursor-arrow-ripple', title: 'INP', section: 'cwv' },
  'accessibility': { icon: 'i-heroicons-eye', title: 'Accessibility', section: 'categories' },
  'seo': { icon: 'i-heroicons-magnifying-glass', title: 'SEO', section: 'categories' },
  'best-practices': { icon: 'i-heroicons-shield-check', title: 'Best Practices', section: 'categories' },
  'pagespeed-insights-api': { icon: 'i-heroicons-code-bracket', title: 'PageSpeed API', section: 'tools' },
}

const sectionConfig: Record<string, { label: string, icon: string, order: number }> = {
  guides: { label: 'Guides', icon: 'i-heroicons-book-open', order: 0 },
  cwv: { label: 'Core Web Vitals', icon: 'i-heroicons-bolt', order: 1 },
  categories: { label: 'Lighthouse Categories', icon: 'i-heroicons-clipboard-document-check', order: 2 },
  tools: { label: 'Developer Tools', icon: 'i-heroicons-wrench-screwdriver', order: 3 },
}

function transformLearnNav(res: any): NavSection[] {
  const sections: Record<string, NavItem[]> = {
    guides: [],
    cwv: [],
    categories: [],
    tools: [],
  }

  for (const group of res || []) {
    const pathSegment = group.path?.split('/').pop()
    const config = pathSegment ? pillarConfig[pathSegment] : null

    if (!config)
      continue

    const item: NavItem = {
      path: group.path,
      title: config.title,
      icon: config.icon,
    }

    // Handle standalone pages (guides)
    if (config.section === 'guides') {
      item.to = group.path
      sections.guides.push(item)
      continue
    }

    // Handle groups with children
    if (group.children?.length) {
      const indexChild = group.children.find((c: any) => c.path === group.path)
      if (indexChild)
        item.to = group.path

      // Flatten fix folder into main children
      const children: NavItem[] = []
      for (const child of group.children) {
        if (child.path === group.path)
          continue
        if (child.title === 'fix' && child.children?.length) {
          // Add fix children directly, skip the "fix" folder level
          for (const fixChild of child.children) {
            if (fixChild.path !== child.path) {
              children.push({
                path: fixChild.path,
                title: fixChild.title,
              })
            }
          }
        }
        else if (!child.children?.length || child.path !== group.path) {
          children.push({
            path: child.path,
            title: child.title,
          })
        }
      }
      item.children = children
    }

    sections[config.section].push(item)
  }

  // Convert to array and sort
  return Object.entries(sections)
    .filter(([_, items]) => items.length > 0)
    .sort(([a], [b]) => sectionConfig[a].order - sectionConfig[b].order)
    .map(([key, items]) => ({
      label: sectionConfig[key].label,
      icon: sectionConfig[key].icon,
      items,
    }))
}

const { data: navigation } = await useAsyncData('learn-nav', () => queryCollectionNavigation('learnLighthouse'), {
  default: () => [],
  transform: transformLearnNav,
  server: false,
})
provide('navigation', navigation)

// Track expanded sections
const expandedSections = ref<Set<string>>(new Set())

// Auto-expand section containing current route
watchEffect(() => {
  for (const section of navigation.value) {
    for (const item of section.items) {
      if (route.path.startsWith(item.path)) {
        expandedSections.value.add(item.path)
      }
    }
  }
})

function toggleSection(path: string) {
  if (expandedSections.value.has(path))
    expandedSections.value.delete(path)
  else
    expandedSections.value.add(path)
}

function isActive(path: string) {
  return route.path === path
}

function isInSection(path: string) {
  return route.path.startsWith(path)
}

function countArticles(item: NavItem): number {
  return (item.children?.length || 0) + (item.to ? 1 : 0)
}

const breadcrumbs = useBreadcrumbItems({
  rootSegment: '/learn-lighthouse',
  overrides: computed(() => {
    let currItem: NavItem | undefined
    for (const section of navigation.value) {
      for (const item of section.items) {
        if (item.path === route.path || item.to === route.path) {
          currItem = item
          break
        }
        if (item.children) {
          const child = item.children.find(c => c.path === route.path)
          if (child) {
            currItem = child
            break
          }
        }
      }
    }
    return [
      { icon: 'i-heroicons-academic-cap', label: 'Learn Lighthouse' },
      false,
      { label: currItem?.title },
    ]
  }),
})

const isHydrating = isHydratingRef()
</script>

<template>
  <div>
    <UMain class="relative mb-20 px-5">
      <svg viewBox="0 0 1440 181" fill="none" xmlns="http://www.w3.org/2000/svg" class="left-0 text-amber-300/30 dark:text-amber-900/30 pointer-events-none absolute w-full top-[1px] transition-all flex-shrink-0 opacity-100 duration-[400ms] z-20"><mask id="path-1-inside-1_414_5526" fill="white"><path d="M0 0H1440V181H0V0Z" /></mask><path d="M0 0H1440V181H0V0Z" fill="url(#paint0_linear_414_5526)" fill-opacity="0.22" /><path d="M0 2H1440V-2H0V2Z" fill="url(#paint1_linear_414_5526)" mask="url(#path-1-inside-1_414_5526)" /><defs><linearGradient id="paint0_linear_414_5526" x1="720" y1="0" x2="720" y2="181" gradientUnits="userSpaceOnUse"><stop stop-color="currentColor" /><stop offset="1" stop-color="currentColor" stop-opacity="0" /></linearGradient><linearGradient id="paint1_linear_414_5526" x1="0" y1="90.5" x2="1440" y2="90.5" gradientUnits="userSpaceOnUse"><stop stop-color="currentColor" stop-opacity="0" /><stop offset="0.395" stop-color="currentColor" /><stop offset="1" stop-color="currentColor" stop-opacity="0" /></linearGradient></defs></svg>
      <div class="max-w-[1400px] mx-auto lg:pt-5">
        <UPage :ui="{ left: 'lg:col-span-3 xl:col-span-2', center: 'col-span-5 lg:col-span-7 xl:col-span-8' }">
          <template #left>
            <UPageAside class="max-w-[300px]">
              <div class="flex flex-col">
                <!-- Header Card -->
                <div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 border border-amber-500/10 mb-6">
                  <div class="flex items-center gap-3">
                    <div class="flex items-center justify-center size-10 rounded-lg bg-amber-500/15">
                      <UIcon name="i-heroicons-academic-cap" class="size-5 text-amber-500" />
                    </div>
                    <div>
                      <div class="text-sm font-bold text-[var(--ui-text-highlighted)]">
                        Learn Lighthouse
                      </div>
                      <div class="text-xs text-[var(--ui-text-muted)]">
                        Master Core Web Vitals
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Navigation Sections -->
                <nav aria-label="Learn Lighthouse Navigation" class="space-y-6">
                  <div v-for="section in navigation" :key="section.label" class="space-y-1">
                    <!-- Section Header -->
                    <div class="flex items-center gap-2 px-2 py-1.5 text-[11px] font-semibold text-[var(--ui-text-dimmed)] uppercase tracking-wider">
                      <UIcon :name="section.icon" class="size-3.5 opacity-60" />
                      {{ section.label }}
                    </div>

                    <!-- Section Items -->
                    <div class="space-y-0.5">
                      <template v-for="item in section.items" :key="item.path">
                        <!-- Standalone link (no children) -->
                        <NuxtLink
                          v-if="!item.children?.length"
                          :to="item.to || item.path"
                          class="group flex items-center gap-2.5 px-2.5 py-2 text-[13px] rounded-lg transition-all duration-150"
                          :class="[
                            isActive(item.to || item.path)
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium'
                              : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-highlighted)] hover:bg-[var(--ui-bg-elevated)]',
                          ]"
                        >
                          <UIcon
                            :name="item.icon!"
                            class="size-4 flex-shrink-0 transition-colors"
                            :class="isActive(item.to || item.path) ? 'text-amber-500' : 'text-[var(--ui-text-dimmed)] group-hover:text-amber-500/70'"
                          />
                          <span class="truncate">{{ item.title }}</span>
                        </NuxtLink>

                        <!-- Expandable section (has children) -->
                        <div v-else class="space-y-0.5">
                          <!-- Section toggle button -->
                          <button
                            type="button"
                            class="group w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] rounded-lg transition-all duration-150"
                            :class="[
                              isInSection(item.path)
                                ? 'bg-[var(--ui-bg-elevated)] text-[var(--ui-text-highlighted)]'
                                : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-highlighted)] hover:bg-[var(--ui-bg-elevated)]',
                            ]"
                            @click="toggleSection(item.path)"
                          >
                            <UIcon
                              :name="item.icon!"
                              class="size-4 flex-shrink-0 transition-colors"
                              :class="isInSection(item.path) ? 'text-amber-500' : 'text-[var(--ui-text-dimmed)] group-hover:text-amber-500/70'"
                            />
                            <span class="truncate flex-1 text-left font-medium">{{ item.title }}</span>
                            <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--ui-bg-accented)] text-[var(--ui-text-dimmed)] font-medium">
                              {{ countArticles(item) }}
                            </span>
                            <UIcon
                              name="i-heroicons-chevron-right-20-solid"
                              class="size-3.5 text-[var(--ui-text-dimmed)] transition-transform duration-200"
                              :class="{ 'rotate-90': expandedSections.has(item.path) }"
                            />
                          </button>

                          <!-- Expanded children -->
                          <div
                            v-show="expandedSections.has(item.path)"
                            class="ml-4 pl-3 border-l border-[var(--ui-border)] space-y-0.5"
                          >
                            <!-- Overview link -->
                            <NuxtLink
                              v-if="item.to"
                              :to="item.to"
                              class="block px-2.5 py-1.5 text-[13px] rounded-md transition-all duration-150"
                              :class="[
                                isActive(item.to)
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium'
                                  : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-highlighted)] hover:bg-[var(--ui-bg-elevated)]',
                              ]"
                            >
                              Overview
                            </NuxtLink>
                            <!-- Child links -->
                            <NuxtLink
                              v-for="child in item.children"
                              :key="child.path"
                              :to="child.path"
                              class="block px-2.5 py-1.5 text-[13px] rounded-md transition-all duration-150"
                              :class="[
                                isActive(child.path)
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium'
                                  : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-highlighted)] hover:bg-[var(--ui-bg-elevated)]',
                              ]"
                            >
                              {{ child.title }}
                            </NuxtLink>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </nav>
              </div>
            </UPageAside>
          </template>
          <UBreadcrumb :items="breadcrumbs" class="mt-10" />
          <ClientOnly>
            <AnimatePresence mode="wait">
              <motion.div
                :key="route.path"
                :initial="isHydrating ? {} : { opacity: 0, y: 16, filter: 'blur(0.2rem)' }"
                :animate="{ opacity: 1, y: 0, filter: 'blur(0)' }"
                :exit="{ opacity: 0, y: 16, filter: 'blur(0.2rem)' }"
                :transition="{ duration: 0.2 }"
              >
                <slot />
              </motion.div>
            </AnimatePresence>
            <template #fallback>
              <slot />
            </template>
          </ClientOnly>
        </UPage>
      </div>
    </UMain>
  </div>
</template>
