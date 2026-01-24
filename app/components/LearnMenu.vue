<script setup lang="ts">
const learnCategories = [
  {
    label: 'Core Web Vitals',
    description: 'Fix performance issues',
    color: 'emerald',
    items: [
      { label: 'Overview', icon: 'i-heroicons-chart-pie', to: '/learn-lighthouse/core-web-vitals' },
      { label: 'LCP', icon: 'i-heroicons-photo', to: '/learn-lighthouse/lcp' },
      { label: 'CLS', icon: 'i-heroicons-arrows-pointing-out', to: '/learn-lighthouse/cls' },
      { label: 'INP', icon: 'i-heroicons-cursor-arrow-rays', to: '/learn-lighthouse/inp' },
    ],
  },
  {
    label: 'Lighthouse Audits',
    description: 'Category deep-dives',
    color: 'violet',
    items: [
      { label: 'Accessibility', icon: 'i-heroicons-eye', to: '/learn-lighthouse/accessibility' },
      { label: 'SEO', icon: 'i-heroicons-magnifying-glass', to: '/learn-lighthouse/seo' },
      { label: 'Best Practices', icon: 'i-heroicons-shield-check', to: '/learn-lighthouse/best-practices' },
    ],
  },
  {
    label: 'Automation',
    description: 'CI/CD & APIs',
    color: 'amber',
    items: [
      { label: 'Lighthouse CI', icon: 'i-heroicons-play-circle', to: '/learn-lighthouse/lighthouse-ci' },
      { label: 'PSI API', icon: 'i-heroicons-code-bracket', to: '/learn-lighthouse/pagespeed-insights-api' },
      { label: 'Bulk Testing', icon: 'i-heroicons-squares-2x2', to: '/learn-lighthouse/bulk-lighthouse-testing' },
    ],
  },
]

const colorClasses = {
  emerald: {
    dot: 'bg-emerald-500',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    icon: 'text-emerald-600 dark:text-emerald-400',
    hover: 'hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10',
  },
  violet: {
    dot: 'bg-violet-500',
    iconBg: 'bg-violet-500/10 dark:bg-violet-500/15',
    icon: 'text-violet-600 dark:text-violet-400',
    hover: 'hover:bg-violet-500/5 dark:hover:bg-violet-500/10',
  },
  amber: {
    dot: 'bg-amber-500',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    icon: 'text-amber-600 dark:text-amber-400',
    hover: 'hover:bg-amber-500/5 dark:hover:bg-amber-500/10',
  },
}
</script>

<template>
  <div class="learn-menu grid grid-cols-3 gap-0 p-0 min-w-[580px]">
    <div
      v-for="(category, catIdx) in learnCategories"
      :key="category.label"
      class="category-column relative"
      :class="[
        catIdx < learnCategories.length - 1 ? 'border-r border-[var(--ui-border)]' : '',
      ]"
      :style="{ '--stagger': catIdx }"
    >
      <!-- Category header -->
      <div class="px-4 pt-4 pb-2">
        <div class="flex items-center gap-2 mb-0.5">
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="colorClasses[category.color].dot"
          />
          <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--ui-text-muted)]">
            {{ category.label }}
          </span>
        </div>
        <p class="text-[10px] text-[var(--ui-text-dimmed)] pl-3.5">
          {{ category.description }}
        </p>
      </div>

      <!-- Items list -->
      <div class="px-2 pb-3 space-y-0.5">
        <NuxtLink
          v-for="(item, itemIdx) in category.items"
          :key="item.to"
          :to="item.to"
          class="learn-item group flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all duration-200"
          :class="colorClasses[category.color].hover"
          :style="{ '--item-delay': itemIdx }"
        >
          <!-- Icon -->
          <div
            class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
            :class="colorClasses[category.color].iconBg"
          >
            <UIcon
              :name="item.icon"
              class="w-4 h-4 transition-colors"
              :class="colorClasses[category.color].icon"
            />
          </div>

          <!-- Label -->
          <span class="text-sm font-medium text-[var(--ui-text)] group-hover:text-[var(--ui-text-highlighted)] transition-colors whitespace-nowrap">
            {{ item.label }}
          </span>

          <!-- Arrow on hover -->
          <UIcon
            name="i-heroicons-chevron-right-20-solid"
            class="w-3.5 h-3.5 text-[var(--ui-text-dimmed)] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
          />
        </NuxtLink>
      </div>
    </div>

    <!-- Footer: View all link -->
    <div class="col-span-3 border-t border-[var(--ui-border)] bg-[var(--ui-bg-elevated)]/50">
      <NuxtLink
        to="/learn-lighthouse"
        class="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors group"
      >
        <UIcon name="i-heroicons-academic-cap" class="w-4 h-4" />
        <span>Browse all guides</span>
        <UIcon
          name="i-heroicons-arrow-right"
          class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
        />
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.learn-menu {
  animation: menu-enter 0.2s ease-out;
}

@keyframes menu-enter {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.category-column {
  animation: column-stagger 0.25s ease-out backwards;
  animation-delay: calc(var(--stagger) * 40ms);
}

@keyframes column-stagger {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.learn-item {
  animation: item-fade 0.2s ease-out backwards;
  animation-delay: calc(var(--stagger) * 40ms + var(--item-delay) * 30ms + 80ms);
}

@keyframes item-fade {
  from {
    opacity: 0;
    transform: translateX(-6px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
