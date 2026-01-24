<script lang="ts" setup>
const route = useRoute()

interface NavItem {
  path: string
  title: string
  icon?: string
  to?: string
  children?: NavItem[]
}

interface NavSection {
  key: string
  label: string
  description: string
  icon: string
  items: NavItem[]
}

// Three main contextual sections
const sectionConfig: Record<string, { label: string, description: string, icon: string, paths: string[] }> = {
  'core-web-vitals': {
    label: 'Core Web Vitals',
    description: 'Fix performance issues',
    icon: 'i-heroicons-bolt',
    paths: ['core-web-vitals', 'lcp', 'cls', 'inp'],
  },
  'audits': {
    label: 'Lighthouse Audits',
    description: 'Category deep-dives',
    icon: 'i-heroicons-clipboard-document-check',
    paths: ['accessibility', 'seo', 'best-practices'],
  },
  'automation': {
    label: 'Automation',
    description: 'CI/CD & APIs',
    icon: 'i-heroicons-cog-6-tooth',
    paths: ['lighthouse-ci', 'pagespeed-insights-api', 'bulk-lighthouse-testing'],
  },
}

// Item config for icons and titles
const itemConfig: Record<string, { icon: string, title: string }> = {
  'core-web-vitals': { icon: 'i-heroicons-chart-bar', title: 'Overview' },
  'lcp': { icon: 'i-heroicons-photo', title: 'LCP' },
  'cls': { icon: 'i-heroicons-arrows-pointing-in', title: 'CLS' },
  'inp': { icon: 'i-heroicons-cursor-arrow-ripple', title: 'INP' },
  'accessibility': { icon: 'i-heroicons-eye', title: 'Accessibility' },
  'seo': { icon: 'i-heroicons-magnifying-glass', title: 'SEO' },
  'best-practices': { icon: 'i-heroicons-shield-check', title: 'Best Practices' },
  'lighthouse-ci': { icon: 'i-heroicons-play-circle', title: 'Lighthouse CI' },
  'pagespeed-insights-api': { icon: 'i-heroicons-code-bracket', title: 'PSI API' },
  'bulk-lighthouse-testing': { icon: 'i-heroicons-squares-2x2', title: 'Bulk Testing' },
}

function transformLearnNav(res: any): NavSection[] {
  const rawItems = res?.[0]?.children || []

  // Build lookup of raw items by path segment
  const itemsBySegment: Record<string, any> = {}
  for (const group of rawItems) {
    const segment = group.path?.split('/').pop()
    if (segment)
      itemsBySegment[segment] = group
  }

  // Build sections
  return Object.entries(sectionConfig).map(([key, config]) => {
    const items: NavItem[] = []

    for (const pathSegment of config.paths) {
      const raw = itemsBySegment[pathSegment]
      const cfg = itemConfig[pathSegment]
      if (!cfg)
        continue

      const item: NavItem = {
        path: raw?.path || `/learn-lighthouse/${pathSegment}`,
        title: cfg.title,
        icon: cfg.icon,
      }

      // Standalone page (no children in raw data or is a single file)
      if (!raw?.children?.length || pathSegment === 'core-web-vitals' || pathSegment === 'bulk-lighthouse-testing') {
        item.to = item.path
        items.push(item)
        continue
      }

      // Has children - check for index
      const indexChild = raw.children.find((c: any) => c.path === raw.path)
      if (indexChild)
        item.to = raw.path

      // Flatten fix folder into main children
      const children: NavItem[] = []
      for (const child of raw.children) {
        if (child.path === raw.path)
          continue
        if (child.title === 'fix' && child.children?.length) {
          for (const fixChild of child.children) {
            if (fixChild.path !== child.path) {
              children.push({
                path: fixChild.path,
                title: fixChild.title,
              })
            }
          }
        }
        else if (!child.children?.length || child.path !== raw.path) {
          children.push({
            path: child.path,
            title: child.title,
          })
        }
      }
      item.children = children
      items.push(item)
    }

    return {
      key,
      label: config.label,
      description: config.description,
      icon: config.icon,
      items,
    }
  })
}

// Detect active section from current route
function detectActiveSection(path: string): string {
  const segment = path.replace('/learn-lighthouse/', '').split('/')[0]
  for (const [key, config] of Object.entries(sectionConfig)) {
    if (config.paths.includes(segment))
      return key
  }
  return 'core-web-vitals' // default
}

const activeSection = computed(() => detectActiveSection(route.path))

const { data: navigation } = await useAsyncData('learn-nav', () => queryCollectionNavigation('learnLighthouse'), {
  default: () => [],
  transform: transformLearnNav,
})
provide('navigation', navigation)

// Current section's nav items
const currentSectionNav = computed(() => {
  return navigation.value.find(s => s.key === activeSection.value)
})

// All sections for the tab switcher
const allSections = computed(() => navigation.value)

function isActive(path: string) {
  return route.path === path
}

function isInSection(path: string) {
  return route.path.startsWith(path)
}

const breadcrumbs = useBreadcrumbItems({
  rootSegment: '/learn-lighthouse',
  overrides: computed(() => {
    let currItem: NavItem | undefined
    let currSection: NavSection | undefined
    for (const section of navigation.value) {
      for (const item of section.items) {
        if (item.path === route.path || item.to === route.path) {
          currItem = item
          currSection = section
          break
        }
        if (item.children) {
          const child = item.children.find(c => c.path === route.path)
          if (child) {
            currItem = child
            currSection = section
            break
          }
        }
      }
    }
    return [
      { icon: 'i-heroicons-academic-cap', label: 'Learn Lighthouse' },
      currSection ? { label: currSection.label } : false,
      { label: currItem?.title },
    ]
  }),
})
</script>

<template>
  <div>
    <UMain class="relative mb-20 px-5">
      <!-- Ambient glow -->
      <div class="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-amber-500/[0.07] to-transparent pointer-events-none" />
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

      <div class="max-w-[1400px] mx-auto lg:pt-5 relative">
        <UPage :ui="{ left: 'lg:col-span-3 xl:col-span-2', center: 'col-span-5 lg:col-span-7 xl:col-span-8' }">
          <template #left>
            <UPageAside class="max-w-[280px]">
              <div class="flex flex-col pt-4">
                <!-- Header -->
                <div class="flex items-center gap-2 mb-4 px-1">
                  <UIcon name="i-heroicons-academic-cap" class="size-4 text-amber-500" />
                  <span class="text-sm font-semibold text-[var(--ui-text-highlighted)]">Learn Lighthouse</span>
                </div>

                <!-- Section Switcher -->
                <div class="mb-5 space-y-1">
                  <NuxtLink
                    v-for="section in allSections"
                    :key="section.key"
                    :to="section.items[0]?.to || section.items[0]?.path"
                    class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200"
                    :class="[
                      activeSection === section.key
                        ? 'bg-amber-500/10 dark:bg-amber-500/15'
                        : 'hover:bg-[var(--ui-bg-elevated)]/50',
                    ]"
                  >
                    <!-- Active indicator -->
                    <div
                      class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full transition-all duration-200"
                      :class="activeSection === section.key ? 'bg-amber-500' : 'bg-transparent'"
                    />

                    <div
                      class="flex items-center justify-center size-8 rounded-md transition-colors"
                      :class="[
                        activeSection === section.key
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          : 'bg-[var(--ui-bg-elevated)] text-[var(--ui-text-dimmed)] group-hover:text-[var(--ui-text-muted)]',
                      ]"
                    >
                      <UIcon :name="section.icon" class="size-4" />
                    </div>

                    <div class="flex-1 min-w-0">
                      <div
                        class="text-[13px] font-medium truncate transition-colors"
                        :class="[
                          activeSection === section.key
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-[var(--ui-text-muted)] group-hover:text-[var(--ui-text-highlighted)]',
                        ]"
                      >
                        {{ section.label }}
                      </div>
                      <div class="text-[11px] text-[var(--ui-text-dimmed)] truncate">
                        {{ section.description }}
                      </div>
                    </div>
                  </NuxtLink>
                </div>

                <!-- Divider -->
                <div class="h-px bg-gradient-to-r from-transparent via-[var(--ui-border)] to-transparent mb-4" />

                <!-- Current Section Navigation -->
                <nav v-if="currentSectionNav" aria-label="Section Navigation" class="space-y-1">
                  <template v-for="item in currentSectionNav.items" :key="item.path">
                    <!-- Standalone link (no children) -->
                    <NuxtLink
                      v-if="!item.children?.length"
                      :to="item.to || item.path"
                      class="group relative flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all duration-150"
                      :class="[
                        isActive(item.to || item.path)
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium'
                          : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-highlighted)] hover:bg-[var(--ui-bg-elevated)]/50',
                      ]"
                    >
                      <UIcon
                        :name="item.icon!"
                        class="size-3.5 flex-shrink-0 transition-colors"
                        :class="isActive(item.to || item.path) ? 'text-amber-500' : 'text-[var(--ui-text-dimmed)] group-hover:text-amber-500/70'"
                      />
                      <span class="text-[13px]">{{ item.title }}</span>
                    </NuxtLink>

                    <!-- Section with children -->
                    <div v-else>
                      <!-- Section header as link -->
                      <NuxtLink
                        v-if="item.to"
                        :to="item.to"
                        class="group relative flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all duration-150"
                        :class="[
                          isActive(item.to)
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium'
                            : isInSection(item.path)
                              ? 'text-[var(--ui-text-highlighted)] font-medium'
                              : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-highlighted)] hover:bg-[var(--ui-bg-elevated)]/50',
                        ]"
                      >
                        <UIcon
                          :name="item.icon!"
                          class="size-3.5 flex-shrink-0 transition-colors"
                          :class="isInSection(item.path) ? 'text-amber-500' : 'text-[var(--ui-text-dimmed)] group-hover:text-amber-500/70'"
                        />
                        <span class="text-[13px]">{{ item.title }}</span>
                      </NuxtLink>

                      <!-- Children (collapsible based on active section) -->
                      <div
                        v-if="isInSection(item.path)"
                        class="ml-4 pl-3 mt-1 mb-2 border-l border-[var(--ui-border)] space-y-0.5"
                      >
                        <NuxtLink
                          v-for="child in item.children"
                          :key="child.path"
                          :to="child.path"
                          class="block px-2 py-1 text-[12px] rounded transition-colors"
                          :class="[
                            isActive(child.path)
                              ? 'text-amber-600 dark:text-amber-400 font-medium bg-amber-500/5'
                              : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-highlighted)]',
                          ]"
                        >
                          {{ child.title }}
                        </NuxtLink>
                      </div>
                    </div>
                  </template>
                </nav>
              </div>
            </UPageAside>
          </template>

          <UBreadcrumb :items="breadcrumbs" class="mt-10" />

          <slot />
        </UPage>
      </div>
    </UMain>
  </div>
</template>
