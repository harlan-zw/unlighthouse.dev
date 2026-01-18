<script setup lang="ts">
import { motion } from 'motion-v'
import { calculateRating, getScoreColor } from '~/composables/useLighthouseScoring'

interface MetricContribution {
  id: string
  color: string
  weight: number
  score: number
}

const props = defineProps<{
  score: number
  metrics: MetricContribution[]
}>()

const displayScore = computed(() => Math.round(props.score * 100))
const rating = computed(() => calculateRating(props.score))
const scoreColor = computed(() => getScoreColor(props.score))

// SVG gauge parameters
const size = 200
const strokeWidth = 12
const radius = (size - strokeWidth) / 2
const circumference = 2 * Math.PI * radius
const center = size / 2

// Score arc (main gauge)
const scoreArcLength = computed(() => props.score * circumference * 0.75) // 270 degrees max
const scoreArcOffset = computed(() => circumference * 0.75 - scoreArcLength.value)

// Calculate metric arcs (stacked segments)
const metricArcs = computed(() => {
  const arcs: { id: string, color: string, offset: number, length: number }[] = []
  let currentOffset = 0

  for (const metric of props.metrics) {
    const contribution = metric.weight * metric.score
    const length = contribution * circumference * 0.75
    arcs.push({
      id: metric.id,
      color: metric.color,
      offset: circumference * 0.75 - currentOffset - length,
      length,
    })
    currentOffset += length
  }

  return arcs
})

const ratingLabel = computed(() => {
  switch (rating.value) {
    case 'pass': return 'Good'
    case 'average': return 'Needs Work'
    case 'fail': return 'Poor'
  }
})
</script>

<template>
  <div class="relative flex flex-col items-center">
    <ClientOnly>
      <svg :width="size" :height="size * 0.65" :viewBox="`0 0 ${size} ${size * 0.65}`" class="overflow-visible">
        <!-- Background arc -->
        <circle
          :cx="center"
          :cy="center"
          :r="radius"
          fill="none"
          stroke="currentColor"
          class="text-[var(--ui-border)]"
          :stroke-width="strokeWidth"
          :stroke-dasharray="`${circumference * 0.75} ${circumference}`"
          :stroke-dashoffset="0"
          stroke-linecap="round"
          :transform="`rotate(135 ${center} ${center})`"
        />

        <!-- Metric contribution arcs (outer ring) -->
        <motion.circle
          v-for="(arc, i) in metricArcs"
          :key="arc.id"
          :cx="center"
          :cy="center"
          :r="radius + strokeWidth + 4"
          fill="none"
          :stroke="arc.color"
          :stroke-width="4"
          :initial="{ strokeDasharray: `0 ${circumference}` }"
          :animate="{ strokeDasharray: `${arc.length} ${circumference}` }"
          :transition="{ duration: 0.6, delay: 0.1 + i * 0.05 }"
          :stroke-dashoffset="arc.offset"
          stroke-linecap="round"
          :transform="`rotate(135 ${center} ${center})`"
          class="opacity-60"
        />

        <!-- Score arc (main) -->
        <motion.circle
          :cx="center"
          :cy="center"
          :r="radius"
          fill="none"
          :stroke="scoreColor"
          :stroke-width="strokeWidth"
          :initial="{ strokeDasharray: `0 ${circumference}` }"
          :animate="{ strokeDasharray: `${scoreArcLength} ${circumference}` }"
          :transition="{ type: 'spring', stiffness: 60, damping: 15 }"
          :stroke-dashoffset="scoreArcOffset"
          stroke-linecap="round"
          :transform="`rotate(135 ${center} ${center})`"
          class="drop-shadow-lg"
          :style="{ filter: `drop-shadow(0 0 8px ${scoreColor}40)` }"
        />

        <!-- Score text -->
        <motion.text
          :x="center"
          :y="center - 8"
          text-anchor="middle"
          dominant-baseline="middle"
          class="text-4xl font-bold tabular-nums fill-current"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :transition="{ delay: 0.3 }"
        >
          {{ displayScore }}
        </motion.text>

        <!-- Rating label -->
        <motion.text
          :x="center"
          :y="center + 20"
          text-anchor="middle"
          dominant-baseline="middle"
          class="text-sm fill-[var(--ui-text-muted)]"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :transition="{ delay: 0.4 }"
        >
          {{ ratingLabel }}
        </motion.text>
      </svg>

      <template #fallback>
        <div :style="{ width: `${size}px`, height: `${size * 0.65}px` }" class="flex items-center justify-center">
          <span class="text-4xl font-bold tabular-nums">{{ displayScore }}</span>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
