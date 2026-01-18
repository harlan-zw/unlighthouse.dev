<script setup lang="ts">
import type { MetricDefinition } from '~/composables/useLighthouseScoring'
import { motion } from 'motion-v'
import { calculateRating, formatMetricValue, getRatingColor } from '~/composables/useLighthouseScoring'

const props = defineProps<{
  metric: MetricDefinition
  value: number
  score: number
}>()

const emit = defineEmits<{
  'update:value': [value: number]
}>()

const rating = computed(() => calculateRating(props.score))
const ratingColor = computed(() => getRatingColor(rating.value))
const displayValue = computed(() => formatMetricValue(props.value, props.metric.unit))
const displayScore = computed(() => Math.round(props.score * 100))

// Slider range based on metric type
const sliderMin = computed(() => {
  if (props.metric.unit === 'unitless')
    return 0
  return 0
})

const sliderMax = computed(() => {
  if (props.metric.unit === 'unitless')
    return 1
  // For ms metrics, go to ~3x median for full range
  return props.metric.curve.median * 3
})

const sliderStep = computed(() => {
  if (props.metric.unit === 'unitless')
    return 0.01
  return 10
})

// Normalize value to 0-1 for slider position
const normalizedValue = computed(() => {
  return (props.value - sliderMin.value) / (sliderMax.value - sliderMin.value)
})

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  const newValue = Number.parseFloat(target.value)
  emit('update:value', newValue)
}

// Thresholds for visual markers
const thresholds = computed(() => {
  const p10 = props.metric.curve.p10
  const median = props.metric.curve.median
  return {
    good: (p10 - sliderMin.value) / (sliderMax.value - sliderMin.value) * 100,
    average: (median - sliderMin.value) / (sliderMax.value - sliderMin.value) * 100,
  }
})
</script>

<template>
  <div class="group">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <span
          class="size-2.5 rounded-full"
          :style="{ backgroundColor: metric.color }"
        />
        <span class="font-medium text-sm">{{ metric.name }}</span>
        <UBadge v-if="metric.isCWV" color="primary" variant="subtle" size="xs">
          CWV
        </UBadge>
      </div>
      <div class="flex items-center gap-3">
        <span class="font-mono text-sm tabular-nums">{{ displayValue }}</span>
        <UBadge
          :style="{ backgroundColor: `${ratingColor}20`, color: ratingColor }"
          variant="subtle"
          size="sm"
          class="font-mono tabular-nums min-w-[3rem] justify-center"
        >
          {{ displayScore }}
        </UBadge>
      </div>
    </div>

    <div class="relative h-6">
      <!-- Track background with threshold zones -->
      <div class="absolute inset-y-0 left-0 right-0 flex items-center">
        <div class="relative w-full h-2 rounded-full bg-[var(--ui-border)] overflow-hidden">
          <!-- Good zone -->
          <div
            class="absolute left-0 h-full bg-success/20"
            :style="{ width: `${thresholds.good}%` }"
          />
          <!-- Average zone -->
          <div
            class="absolute h-full bg-warning/20"
            :style="{ left: `${thresholds.good}%`, width: `${thresholds.average - thresholds.good}%` }"
          />
          <!-- Poor zone (rest) -->
          <div
            class="absolute right-0 h-full bg-error/10"
            :style="{ left: `${thresholds.average}%` }"
          />
        </div>
      </div>

      <!-- Filled track -->
      <ClientOnly>
        <motion.div
          class="absolute inset-y-0 left-0 flex items-center pointer-events-none"
          :style="{ width: `${normalizedValue * 100}%` }"
        >
          <div
            class="w-full h-2 rounded-full transition-colors"
            :style="{
              backgroundColor: ratingColor,
              boxShadow: `0 0 12px ${ratingColor}60`,
            }"
          />
        </motion.div>
      </ClientOnly>

      <!-- Input slider -->
      <input
        type="range"
        :min="sliderMin"
        :max="sliderMax"
        :step="sliderStep"
        :value="value"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        @input="handleInput"
      >

      <!-- Thumb -->
      <ClientOnly>
        <motion.div
          class="absolute top-1/2 -translate-y-1/2 pointer-events-none"
          :style="{ left: `calc(${normalizedValue * 100}% - 8px)` }"
        >
          <div
            class="size-4 rounded-full border-2 border-white dark:border-[var(--ui-bg)] shadow-md transition-transform group-hover:scale-110"
            :style="{ backgroundColor: ratingColor }"
          />
        </motion.div>
      </ClientOnly>
    </div>

    <div class="flex justify-between mt-1 text-xs text-[var(--ui-text-muted)]">
      <span>{{ formatMetricValue(sliderMin, metric.unit) }}</span>
      <span class="opacity-60">{{ metric.description }}</span>
      <span>{{ formatMetricValue(sliderMax, metric.unit) }}</span>
    </div>
  </div>
</template>
