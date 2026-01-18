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

  const items = res?.[0]?.children || []
  for (const group of items) {
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
})
provide('navigation', navigation)

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
                <div class="flex items-center gap-2 mb-5 px-1">
                  <UIcon name="i-heroicons-academic-cap" class="size-4 text-amber-500" />
                  <span class="text-sm font-semibold text-[var(--ui-text-highlighted)]">Learn Lighthouse</span>
                </div>

                <!-- Navigation -->
                <nav aria-label="Learn Lighthouse Navigation" class="space-y-5">
                  <div v-for="section in navigation" :key="section.label">
                    <!-- Section Label -->
                    <div class="flex items-center gap-2 mb-1.5 px-1">
                      <span class="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ui-text-dimmed)]">
                        {{ section.label }}
                      </span>
                    </div>

                    <!-- Items -->
                    <div class="space-y-0.5">
                      <template v-for="item in section.items" :key="item.path">
                        <!-- Standalone link (no children) -->
                        <NuxtLink
                          v-if="!item.children?.length"
                          :to="item.to || item.path"
                          class="group relative flex items-center gap-2 px-2 py-1 rounded-md transition-colors"
                          :class="[
                            isActive(item.to || item.path)
                              ? 'text-amber-600 dark:text-amber-400 font-medium'
                              : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-highlighted)]',
                          ]"
                        >
                          <UIcon
                            :name="item.icon!"
                            class="size-3.5 flex-shrink-0"
                            :class="isActive(item.to || item.path) ? 'text-amber-500' : 'text-[var(--ui-text-dimmed)] group-hover:text-amber-500/70'"
                          />
                          <span class="text-[13px]">{{ item.title }}</span>
                        </NuxtLink>

                        <!-- Section with children (always expanded) -->
                        <div v-else>
                          <!-- Section header as link -->
                          <NuxtLink
                            v-if="item.to"
                            :to="item.to"
                            class="group relative flex items-center gap-2 px-2 py-1 rounded-md transition-colors"
                            :class="[
                              isActive(item.to)
                                ? 'text-amber-600 dark:text-amber-400 font-medium'
                                : isInSection(item.path)
                                  ? 'text-[var(--ui-text-highlighted)] font-medium'
                                  : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-highlighted)]',
                            ]"
                          >
                            <UIcon
                              :name="item.icon!"
                              class="size-3.5 flex-shrink-0"
                              :class="isInSection(item.path) ? 'text-amber-500' : 'text-[var(--ui-text-dimmed)] group-hover:text-amber-500/70'"
                            />
                            <span class="text-[13px]">{{ item.title }}</span>
                          </NuxtLink>

                          <!-- Children -->
                          <div class="ml-3 pl-3 mt-0.5 border-l border-[var(--ui-border)]">
                            <NuxtLink
                              v-for="child in item.children"
                              :key="child.path"
                              :to="child.path"
                              class="block px-2 py-0.5 text-[12px] transition-colors"
                              :class="[
                                isActive(child.path)
                                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                                  : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-highlighted)]',
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

          <slot />
        </UPage>
      </div>
    </UMain>
  </div>
</template>
