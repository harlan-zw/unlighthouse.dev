<script setup lang="ts">
import { motion } from 'motion-v'

const props = defineProps<{
  metric: 'lcp' | 'cls' | 'tbt' | 'fcp' | 'si' | 'inp'
  currentValue?: number
  targetValue?: number
}>()

const metrics = {
  lcp: {
    name: 'Largest Contentful Paint',
    abbr: 'LCP',
    weight: 25,
    unit: 's',
    thresholds: { good: 2.5, poor: 4.0 },
    format: (v: number) => `${v.toFixed(1)}s`,
    isCWV: true,
    description: 'Time until largest content element is visible',
  },
  cls: {
    name: 'Cumulative Layout Shift',
    abbr: 'CLS',
    weight: 25,
    unit: '',
    thresholds: { good: 0.1, poor: 0.25 },
    format: (v: number) => v.toFixed(2),
    isCWV: true,
    description: 'Movement of visible elements during load',
  },
  tbt: {
    name: 'Total Blocking Time',
    abbr: 'TBT',
    weight: 30,
    unit: 'ms',
    thresholds: { good: 200, poor: 600 },
    format: (v: number) => `${Math.round(v)}ms`,
    isCWV: false,
    description: 'Sum of blocking time for long tasks',
  },
  fcp: {
    name: 'First Contentful Paint',
    abbr: 'FCP',
    weight: 10,
    unit: 's',
    thresholds: { good: 1.8, poor: 3.0 },
    format: (v: number) => `${v.toFixed(1)}s`,
    isCWV: false,
    description: 'Time until first text or image is painted',
  },
  si: {
    name: 'Speed Index',
    abbr: 'SI',
    weight: 10,
    unit: 's',
    thresholds: { good: 3.4, poor: 5.8 },
    format: (v: number) => `${v.toFixed(1)}s`,
    isCWV: false,
    description: 'How quickly content visually populates',
  },
  inp: {
    name: 'Interaction to Next Paint',
    abbr: 'INP',
    weight: 0,
    unit: 'ms',
    thresholds: { good: 200, poor: 500 },
    format: (v: number) => `${Math.round(v)}ms`,
    isCWV: true,
    description: 'Responsiveness to user interactions (field only)',
  },
}

const config = computed(() => metrics[props.metric])

// Mini arc gauge parameters
const gaugeSize = 72
const gaugeStroke = 6
const gaugeRadius = (gaugeSize - gaugeStroke) / 2
const gaugeCircumference = 2 * Math.PI * gaugeRadius
const gaugeArcLength = computed(() => (config.value.weight / 100) * gaugeCircumference * 0.75)

function getRating(value: number) {
  const { good, poor } = config.value.thresholds
  if (value <= good)
    return { label: 'Good', color: 'success' }
  if (value <= poor)
    return { label: 'Needs Improvement', color: 'warning' }
  return { label: 'Poor', color: 'error' }
}

const currentRating = computed(() =>
  props.currentValue ? getRating(props.currentValue) : null,
)

const targetRating = computed(() =>
  props.targetValue ? getRating(props.targetValue) : null,
)

// Estimate score improvement
const estimatedImprovement = computed(() => {
  if (!props.currentValue || !props.targetValue)
    return null

  const { good, poor } = config.value.thresholds
  const weight = config.value.weight

  const currentScore = props.currentValue <= good
    ? 100
    : props.currentValue >= poor
      ? 0
      : 100 - ((props.currentValue - good) / (poor - good)) * 100

  const targetScore = props.targetValue <= good
    ? 100
    : props.targetValue >= poor
      ? 0
      : 100 - ((props.targetValue - good) / (poor - good)) * 100

  const scoreDiff = targetScore - currentScore
  const perfImpact = Math.round((scoreDiff * weight) / 100)

  return perfImpact > 0 ? perfImpact : null
})

// Threshold scale calculation
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
    <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] overflow-hidden shadow-sm">
      <!-- Main content row -->
      <div class="flex items-stretch">
        <!-- Left: Metric identity + gauge -->
        <div class="flex items-center gap-4 p-4 pr-5 border-r border-[var(--ui-border)] bg-[var(--ui-bg-accented)]/30">
          <!-- Mini arc gauge for weight -->
          <ClientOnly>
            <div class="relative flex-shrink-0">
              <svg :width="gaugeSize" :height="gaugeSize * 0.6" :viewBox="`0 0 ${gaugeSize} ${gaugeSize * 0.6}`" class="overflow-visible">
                <!-- Background arc -->
                <circle
                  :cx="gaugeSize / 2"
                  :cy="gaugeSize / 2"
                  :r="gaugeRadius"
                  fill="none"
                  stroke="currentColor"
                  class="text-[var(--ui-border)]"
                  :stroke-width="gaugeStroke"
                  :stroke-dasharray="`${gaugeCircumference * 0.75} ${gaugeCircumference}`"
                  stroke-linecap="round"
                  :transform="`rotate(135 ${gaugeSize / 2} ${gaugeSize / 2})`"
                />
                <!-- Weight arc -->
                <motion.circle
                  :cx="gaugeSize / 2"
                  :cy="gaugeSize / 2"
                  :r="gaugeRadius"
                  fill="none"
                  stroke="currentColor"
                  class="text-[var(--ui-primary)]"
                  :stroke-width="gaugeStroke"
                  :initial="{ strokeDasharray: `0 ${gaugeCircumference}` }"
                  :animate="{ strokeDasharray: `${gaugeArcLength} ${gaugeCircumference}` }"
                  :transition="{ type: 'spring', stiffness: 60, damping: 15, delay: 0.1 }"
                  :stroke-dashoffset="gaugeCircumference * 0.75 - gaugeArcLength"
                  stroke-linecap="round"
                  :transform="`rotate(135 ${gaugeSize / 2} ${gaugeSize / 2})`"
                />
                <!-- Weight text -->
                <text
                  :x="gaugeSize / 2"
                  :y="gaugeSize / 2 - 4"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  class="text-sm font-bold tabular-nums fill-current"
                >
                  {{ config.weight }}%
                </text>
              </svg>
              <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-[var(--ui-text-muted)] whitespace-nowrap">
                weight
              </div>
            </div>
            <template #fallback>
              <div class="size-[72px] flex items-center justify-center text-sm font-bold">
                {{ config.weight }}%
              </div>
            </template>
          </ClientOnly>

          <!-- Metric name -->
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xl font-bold tracking-tight">{{ config.abbr }}</span>
              <span
                v-if="config.isCWV"
                class="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--ui-primary)]/10 text-[var(--ui-primary)]"
              >
                CWV
              </span>
            </div>
            <div class="text-sm text-[var(--ui-text-muted)] truncate">
              {{ config.name }}
            </div>
          </div>
        </div>

        <!-- Right: Thresholds as gradient scale -->
        <div class="flex-1 p-4 flex flex-col justify-center min-w-0">
          <div class="text-[10px] uppercase tracking-wider text-[var(--ui-text-muted)] mb-2 font-medium">
            Thresholds
          </div>

          <!-- Gradient threshold bar -->
          <div class="relative">
            <div class="h-2 rounded-full overflow-hidden flex">
              <div
                class="h-full bg-success"
                :style="{ width: `${thresholdScale.goodPercent}%` }"
              />
              <div
                class="h-full bg-warning"
                :style="{ width: `${thresholdScale.poorPercent - thresholdScale.goodPercent}%` }"
              />
              <div class="h-full bg-error flex-1" />
            </div>

            <!-- Threshold markers -->
            <div class="flex justify-between mt-2 text-xs">
              <div class="flex items-center gap-1">
                <span class="size-1.5 rounded-full bg-success" />
                <span class="text-[var(--ui-text-muted)]">≤{{ config.format(config.thresholds.good) }}</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="size-1.5 rounded-full bg-warning" />
                <span class="text-[var(--ui-text-muted)]">{{ config.format(config.thresholds.good) }}–{{ config.format(config.thresholds.poor) }}</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="size-1.5 rounded-full bg-error" />
                <span class="text-[var(--ui-text-muted)]">>{{ config.format(config.thresholds.poor) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Description footer -->
      <div class="px-4 py-2.5 bg-[var(--ui-bg)] border-t border-[var(--ui-border)] text-xs text-[var(--ui-text-muted)]">
        {{ config.description }}
      </div>

      <!-- Before/After comparison if values provided -->
      <div v-if="currentValue && targetValue" class="border-t border-[var(--ui-border)] bg-[var(--ui-bg-accented)]/20">
        <div class="p-4">
          <div class="text-[10px] uppercase tracking-wider text-[var(--ui-text-muted)] mb-3 font-medium">
            Improvement Estimate
          </div>
          <div class="flex items-center gap-3">
            <!-- Current -->
            <div class="flex-1 text-center p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)]">
              <div class="text-[10px] uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
                Current
              </div>
              <div class="font-mono text-lg font-bold tabular-nums" :class="`text-${currentRating?.color}`">
                {{ config.format(currentValue) }}
              </div>
              <UBadge :color="currentRating?.color" variant="subtle" size="xs" class="mt-1.5">
                {{ currentRating?.label }}
              </UBadge>
            </div>

            <!-- Arrow -->
            <div class="flex-shrink-0">
              <svg class="size-5 text-[var(--ui-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>

            <!-- Target -->
            <div class="flex-1 text-center p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)]">
              <div class="text-[10px] uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
                Target
              </div>
              <div class="font-mono text-lg font-bold tabular-nums" :class="`text-${targetRating?.color}`">
                {{ config.format(targetValue) }}
              </div>
              <UBadge :color="targetRating?.color" variant="subtle" size="xs" class="mt-1.5">
                {{ targetRating?.label }}
              </UBadge>
            </div>

            <!-- Score impact -->
            <div v-if="estimatedImprovement" class="flex-1 text-center p-3 rounded-lg bg-success/5 border border-success/20">
              <div class="text-[10px] uppercase tracking-wider text-success mb-1">
                Score Impact
              </div>
              <div class="font-mono text-lg font-bold tabular-nums text-success">
                +{{ estimatedImprovement }}
              </div>
              <div class="text-[10px] text-success/70 mt-1.5">
                points
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Slot for additional context -->
      <div v-if="$slots.default" class="p-4 border-t border-[var(--ui-border)] text-sm text-[var(--ui-text-muted)]">
        <slot />
      </div>
    </div>
  </div>
</template>
