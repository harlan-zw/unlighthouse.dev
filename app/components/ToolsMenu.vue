<script setup lang="ts">
const toolCategories = [
  {
    label: 'Core Web Vitals',
    description: 'Debug individual metrics',
    color: 'emerald',
    tools: [
      { label: 'LCP Finder', icon: 'i-heroicons-photo', to: '/tools/lcp-finder', badge: 'LCP' },
      { label: 'CLS Debugger', icon: 'i-heroicons-arrows-pointing-out', to: '/tools/cls-debugger', badge: 'CLS' },
      { label: 'INP Analyzer', icon: 'i-heroicons-cursor-arrow-rays', to: '/tools/inp-analyzer', badge: 'INP' },
    ],
  },
  {
    label: 'Site Analysis',
    description: 'Measure & compare',
    color: 'violet',
    tools: [
      { label: 'CWV Checker', icon: 'i-heroicons-check-badge', to: '/tools/cwv-checker', badge: 'CrUX' },
      { label: 'CWV History', icon: 'i-heroicons-chart-bar', to: '/tools/cwv-history', badge: '25w' },
      { label: 'CWV Compare', icon: 'i-heroicons-scale', to: '/tools/cwv-compare', badge: 'vs' },
      { label: 'TTFB Checker', icon: 'i-heroicons-clock', to: '/tools/ttfb-checker', badge: 'TTFB' },
    ],
  },
  {
    label: 'Lighthouse',
    description: 'Scores & reports',
    color: 'amber',
    tools: [
      { label: 'Score Calculator', icon: 'i-heroicons-calculator', to: '/tools/lighthouse-score-calculator' },
      { label: 'Report Viewer', icon: 'i-heroicons-document-chart-bar', to: '/tools/lighthouse-report-viewer' },
      { label: 'Bulk PageSpeed', icon: 'i-heroicons-squares-2x2', to: '/tools/bulk-pagespeed', badge: '10×' },
      { label: 'PSI Performance', icon: 'i-heroicons-chart-bar', to: '/tools/pagespeed-insights-performance' },
    ],
  },
]

const colorClasses = {
  emerald: {
    dot: 'bg-emerald-500',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    icon: 'text-emerald-600 dark:text-emerald-400',
    hover: 'hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
  violet: {
    dot: 'bg-violet-500',
    iconBg: 'bg-violet-500/10 dark:bg-violet-500/15',
    icon: 'text-violet-600 dark:text-violet-400',
    hover: 'hover:bg-violet-500/5 dark:hover:bg-violet-500/10',
    badge: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  },
  amber: {
    dot: 'bg-amber-500',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    icon: 'text-amber-600 dark:text-amber-400',
    hover: 'hover:bg-amber-500/5 dark:hover:bg-amber-500/10',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
}
</script>

<template>
  <div class="tools-menu grid grid-cols-3 gap-0 p-0 min-w-[540px]">
    <div
      v-for="(category, catIdx) in toolCategories"
      :key="category.label"
      class="category-column relative"
      :class="[
        catIdx < toolCategories.length - 1 ? 'border-r border-[var(--ui-border)]' : '',
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

      <!-- Tools list -->
      <div class="px-2 pb-3 space-y-0.5">
        <NuxtLink
          v-for="(tool, toolIdx) in category.tools"
          :key="tool.to"
          :to="tool.to"
          class="tool-item group flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all duration-200"
          :class="colorClasses[category.color].hover"
          :style="{ '--tool-delay': toolIdx }"
        >
          <!-- Icon -->
          <div
            class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
            :class="colorClasses[category.color].iconBg"
          >
            <UIcon
              :name="tool.icon"
              class="w-4 h-4 transition-colors"
              :class="colorClasses[category.color].icon"
            />
          </div>

          <!-- Label + badge -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-sm font-medium text-[var(--ui-text)] truncate group-hover:text-[var(--ui-text-highlighted)] transition-colors">
                {{ tool.label }}
              </span>
              <span
                v-if="tool.badge"
                class="shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded"
                :class="colorClasses[category.color].badge"
              >
                {{ tool.badge }}
              </span>
            </div>
          </div>

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
        to="/tools"
        class="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors group"
      >
        <UIcon name="i-heroicons-squares-2x2" class="w-4 h-4" />
        <span>View all tools</span>
        <UIcon
          name="i-heroicons-arrow-right"
          class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
        />
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.tools-menu {
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

.tool-item {
  animation: tool-fade 0.2s ease-out backwards;
  animation-delay: calc(var(--stagger) * 40ms + var(--tool-delay) * 30ms + 80ms);
}

@keyframes tool-fade {
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
