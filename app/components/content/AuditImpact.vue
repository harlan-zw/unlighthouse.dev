<script setup lang="ts">
const props = defineProps<{
  metric: 'lcp' | 'cls' | 'tbt' | 'fcp' | 'si' | 'inp'
}>()

const metrics = {
  lcp: {
    name: 'Largest Contentful Paint',
    abbr: 'LCP',
    weight: 25,
    thresholds: { good: 2.5, poor: 4.0 },
    format: (v: number) => `${v.toFixed(1)}s`,
    isCWV: true,
    description: 'Time until largest content element is visible',
  },
  cls: {
    name: 'Cumulative Layout Shift',
    abbr: 'CLS',
    weight: 25,
    thresholds: { good: 0.1, poor: 0.25 },
    format: (v: number) => v.toFixed(2),
    isCWV: true,
    description: 'Movement of visible elements during load',
  },
  tbt: {
    name: 'Total Blocking Time',
    abbr: 'TBT',
    weight: 30,
    thresholds: { good: 200, poor: 600 },
    format: (v: number) => `${Math.round(v)}ms`,
    isCWV: false,
    description: 'Sum of blocking time for long tasks',
  },
  fcp: {
    name: 'First Contentful Paint',
    abbr: 'FCP',
    weight: 10,
    thresholds: { good: 1.8, poor: 3.0 },
    format: (v: number) => `${v.toFixed(1)}s`,
    isCWV: false,
    description: 'Time until first text or image is painted',
  },
  si: {
    name: 'Speed Index',
    abbr: 'SI',
    weight: 10,
    thresholds: { good: 3.4, poor: 5.8 },
    format: (v: number) => `${v.toFixed(1)}s`,
    isCWV: false,
    description: 'How quickly content visually populates',
  },
  inp: {
    name: 'Interaction to Next Paint',
    abbr: 'INP',
    weight: 0,
    thresholds: { good: 200, poor: 500 },
    format: (v: number) => `${Math.round(v)}ms`,
    isCWV: true,
    description: 'Responsiveness to user interactions (field only)',
  },
}

const config = computed(() => metrics[props.metric])

const thresholdScale = computed(() => {
  const { good, poor } = config.value.thresholds
  const max = poor * 1.5
  return {
    goodPercent: (good / max) * 100,
    poorPercent: (poor / max) * 100,
  }
})
</script>

<template>
  <div class="not-prose my-6">
    <div class="rounded-lg border border-default bg-elevated/50 overflow-hidden">
      <div class="flex items-center justify-between px-4 py-3">
        <div class="flex items-center gap-2">
          <span class="font-semibold">{{ config.abbr }}</span>
          <span class="text-sm text-muted">{{ config.name }}</span>
          <UTooltip v-if="config.isCWV" text="Core Web Vital - a key metric Google uses for ranking">
            <UBadge color="primary" variant="subtle" size="xs" class="cursor-help">
              CWV
            </UBadge>
          </UTooltip>
        </div>
        <UTooltip :text="`${config.weight}% of Lighthouse Performance score`">
          <UBadge variant="subtle" class="cursor-help tabular-nums">
            {{ config.weight }}% weight
          </UBadge>
        </UTooltip>
      </div>
      <div class="px-4 pb-3">
        <div class="h-1.5 rounded-full overflow-hidden flex">
          <div class="h-full bg-success" :style="{ width: `${thresholdScale.goodPercent}%` }" />
          <div class="h-full bg-warning" :style="{ width: `${thresholdScale.poorPercent - thresholdScale.goodPercent}%` }" />
          <div class="h-full bg-error flex-1" />
        </div>
        <div class="flex justify-between mt-1.5 text-xs text-muted">
          <span><span class="text-success">Good</span> ≤{{ config.format(config.thresholds.good) }}</span>
          <span><span class="text-error">Poor</span> >{{ config.format(config.thresholds.poor) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
