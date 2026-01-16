<script setup lang="ts">
// LCP phases with educational descriptions
const phases = [
  { id: 'ttfb', label: 'TTFB', color: '#3b82f6', description: 'Server responds' },
  { id: 'loadDelay', label: 'Discovery', color: '#8b5cf6', description: 'Find LCP resource' },
  { id: 'loadDuration', label: 'Download', color: '#06b6d4', description: 'Fetch the image' },
  { id: 'renderDelay', label: 'Render', color: '#f59e0b', description: 'Paint to screen' },
]

const timings = ref({
  ttfb: 600,
  loadDelay: 150,
  loadDuration: 800,
  renderDelay: 50,
})

const isPlaying = ref(false)
const currentPhase = ref(-1)
const elapsedTime = ref(0)
const animationFrame = ref<number | null>(null)
const startTime = ref(0)

const total = computed(() =>
  timings.value.ttfb + timings.value.loadDelay + timings.value.loadDuration + timings.value.renderDelay,
)

const rating = computed(() => {
  if (total.value <= 2500)
    return { label: 'Good', color: 'success', bg: 'bg-success/10' }
  if (total.value <= 4000)
    return { label: 'Needs Improvement', color: 'warning', bg: 'bg-warning/10' }
  return { label: 'Poor', color: 'error', bg: 'bg-error/10' }
})

const phaseEndTimes = computed(() => {
  let cumulative = 0
  return phases.map((phase) => {
    cumulative += timings.value[phase.id as keyof typeof timings.value]
    return cumulative
  })
})

// Page simulation state
const pageState = computed(() => {
  if (!isPlaying.value && currentPhase.value === -1)
    return 'idle'
  if (currentPhase.value === 0)
    return 'connecting'
  if (currentPhase.value === 1)
    return 'parsing'
  if (currentPhase.value === 2)
    return 'loading'
  if (currentPhase.value === 3)
    return 'rendering'
  return 'complete'
})

const currentStepExplanation = computed(() => {
  switch (pageState.value) {
    case 'connecting': return 'Browser sent request, waiting for server to respond with HTML...'
    case 'parsing': return 'HTML received! Browser parsing document, discovering the hero image...'
    case 'loading': return 'Found the LCP element! Downloading the hero image bytes...'
    case 'rendering': return 'Image downloaded! Browser painting pixels to screen...'
    case 'complete': return `Done! User saw the main content after ${(total.value / 1000).toFixed(2)}s`
    default: return 'Click "Simulate Load" to see how LCP is measured during page load.'
  }
})

const lcpProgress = computed(() => {
  if (currentPhase.value < 2)
    return 0
  if (currentPhase.value > 2)
    return 100
  const phaseStart = phaseEndTimes.value[1]
  const phaseDuration = timings.value.loadDuration
  const phaseElapsed = elapsedTime.value - phaseStart
  return Math.min(100, Math.max(0, (phaseElapsed / phaseDuration) * 100))
})

function animate(timestamp: number) {
  if (!startTime.value)
    startTime.value = timestamp

  const elapsed = timestamp - startTime.value
  elapsedTime.value = Math.min(elapsed, total.value)

  // Determine current phase
  let phase = -1
  for (let i = 0; i < phaseEndTimes.value.length; i++) {
    if (elapsed < phaseEndTimes.value[i]) {
      phase = i
      break
    }
  }
  currentPhase.value = phase === -1 ? 3 : phase

  if (elapsed < total.value) {
    animationFrame.value = requestAnimationFrame(animate)
  }
  else {
    isPlaying.value = false
    currentPhase.value = 4 // complete
  }
}

function play() {
  if (isPlaying.value)
    return
  reset()
  isPlaying.value = true
  startTime.value = 0
  animationFrame.value = requestAnimationFrame(animate)
}

function reset() {
  if (animationFrame.value)
    cancelAnimationFrame(animationFrame.value)
  isPlaying.value = false
  currentPhase.value = -1
  elapsedTime.value = 0
  startTime.value = 0
}

// Presets for learning
const presets = [
  { label: 'Fast', ttfb: 200, loadDelay: 50, loadDuration: 400, renderDelay: 50, tip: 'CDN + optimized images' },
  { label: 'Typical', ttfb: 600, loadDelay: 150, loadDuration: 800, renderDelay: 50, tip: 'Average website' },
  { label: 'Slow Server', ttfb: 2000, loadDelay: 100, loadDuration: 600, renderDelay: 50, tip: 'Server bottleneck' },
  { label: 'Large Image', ttfb: 400, loadDelay: 100, loadDuration: 2500, renderDelay: 50, tip: 'Unoptimized hero' },
]

function applyPreset(preset: typeof presets[0]) {
  reset()
  timings.value = {
    ttfb: preset.ttfb,
    loadDelay: preset.loadDelay,
    loadDuration: preset.loadDuration,
    renderDelay: preset.renderDelay,
  }
}

onUnmounted(() => {
  if (animationFrame.value)
    cancelAnimationFrame(animationFrame.value)
})
</script>

<script lang="ts">
function getRating(ms: number) {
  if (ms <= 2500)
    return { color: 'success' }
  if (ms <= 4000)
    return { color: 'warning' }
  return { color: 'error' }
}
</script>

<template>
  <ClientOnly>
    <div class="not-prose">
      <div class="flex items-center justify-between mb-1">
        <h3 class="font-semibold">
          LCP Demo
        </h3>
        <div v-if="pageState === 'complete' || elapsedTime > 0" class="flex items-center gap-2">
          <span class="font-mono text-xl font-bold tabular-nums">{{ (elapsedTime / 1000).toFixed(2) }}s</span>
          <UBadge v-if="pageState === 'complete'" :color="rating.color" variant="subtle" size="sm">
            {{ rating.label }}
          </UBadge>
        </div>
      </div>
      <p class="text-sm text-[var(--ui-text-muted)] mb-3">
        Watch how browser measures time to largest content. LCP includes server response, resource discovery, download, and render.
      </p>

      <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] overflow-hidden">
        <div class="grid lg:grid-cols-5 gap-0">
          <!-- Browser simulation -->
          <div class="lg:col-span-3 p-4 border-b lg:border-b-0 lg:border-r border-[var(--ui-border)]">
            <DemoBrowser
              url="shop.example.com/product"
              :status="pageState === 'idle' ? 'idle' : pageState === 'complete' ? 'complete' : 'loading'"
            >
              <div class="h-44 p-4 relative overflow-hidden">
                <!-- Idle state -->
                <div
                  class="absolute inset-4 transition-opacity duration-200"
                  :class="pageState === 'idle' ? 'opacity-100' : 'opacity-0 pointer-events-none'"
                >
                  <div class="space-y-3">
                    <div class="h-5 bg-[var(--ui-bg-accented)] rounded w-1/3" />
                    <div class="h-3 bg-[var(--ui-bg-accented)] rounded w-2/3" />
                    <div class="h-20 bg-[var(--ui-bg-accented)] rounded w-full flex items-center justify-center">
                      <span class="text-xs text-[var(--ui-text-muted)]">Hero Image</span>
                    </div>
                  </div>
                </div>

                <!-- Connecting -->
                <div
                  class="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
                  :class="pageState === 'connecting' ? 'opacity-100' : 'opacity-0 pointer-events-none'"
                >
                  <div class="flex flex-col items-center gap-2">
                    <div class="size-8 border-2 border-[var(--ui-border)] border-t-blue-500 rounded-full animate-spin" />
                    <span class="text-xs text-blue-500 font-medium">Waiting for server...</span>
                  </div>
                </div>

                <!-- Parsing -->
                <div
                  class="absolute inset-4 transition-opacity duration-200"
                  :class="pageState === 'parsing' ? 'opacity-100' : 'opacity-0 pointer-events-none'"
                >
                  <div class="space-y-3">
                    <div class="h-5 bg-[var(--ui-text-highlighted)] rounded w-1/3 animate-pulse" />
                    <div class="h-3 bg-[var(--ui-text-muted)]/30 rounded w-2/3" />
                    <div class="h-20 bg-purple-500/20 border-2 border-dashed border-purple-500/50 rounded flex items-center justify-center">
                      <span class="text-xs text-purple-500 font-medium">🔍 Discovering LCP element...</span>
                    </div>
                  </div>
                </div>

                <!-- Loading -->
                <div
                  class="absolute inset-4 transition-opacity duration-200"
                  :class="pageState === 'loading' ? 'opacity-100' : 'opacity-0 pointer-events-none'"
                >
                  <div class="space-y-3">
                    <div class="h-5 bg-[var(--ui-text-highlighted)] rounded w-1/3" />
                    <div class="h-3 bg-[var(--ui-text-muted)]/50 rounded w-2/3" />
                    <div class="h-20 bg-[var(--ui-bg-accented)] rounded overflow-hidden relative">
                      <div
                        class="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500/30 to-cyan-500/50 transition-all duration-100"
                        :style="{ width: `${lcpProgress}%` }"
                      />
                      <div class="absolute inset-0 flex items-center justify-center">
                        <span class="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                          ⬇️ Downloading {{ Math.round(lcpProgress) }}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Rendering -->
                <div
                  class="absolute inset-4 transition-opacity duration-200"
                  :class="pageState === 'rendering' ? 'opacity-100' : 'opacity-0 pointer-events-none'"
                >
                  <div class="space-y-3">
                    <div class="h-5 bg-[var(--ui-text-highlighted)] rounded w-1/3" />
                    <div class="h-3 bg-[var(--ui-text-muted)]/50 rounded w-2/3" />
                    <div class="h-20 bg-gradient-to-br from-amber-500/30 to-amber-500/50 rounded flex items-center justify-center animate-pulse">
                      <span class="text-xs text-amber-600 dark:text-amber-400 font-medium">🎨 Painting...</span>
                    </div>
                  </div>
                </div>

                <!-- Complete -->
                <div
                  class="absolute inset-4 transition-opacity duration-300"
                  :class="pageState === 'complete' ? 'opacity-100' : 'opacity-0 pointer-events-none'"
                >
                  <div class="space-y-3">
                    <div class="h-5 bg-[var(--ui-text-highlighted)] rounded w-1/3" />
                    <div class="h-3 bg-[var(--ui-text-muted)]/50 rounded w-2/3" />
                    <div
                      class="h-20 rounded flex items-center justify-center border-2 border-dashed transition-colors"
                      :class="rating.color === 'success' ? 'border-success bg-success/10' : rating.color === 'warning' ? 'border-warning bg-warning/10' : 'border-error bg-error/10'"
                    >
                      <div class="text-center">
                        <div class="text-lg font-bold font-mono">
                          {{ (total / 1000).toFixed(2) }}s
                        </div>
                        <div class="text-xs text-[var(--ui-text-muted)]">
                          LCP ✓
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DemoBrowser>

            <!-- Step explanation -->
            <div class="mt-3 p-3 bg-[var(--ui-bg)] rounded-lg border border-[var(--ui-border)] min-h-[52px]">
              <div class="flex items-start gap-2">
                <span
                  class="size-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5"
                  :class="pageState === 'complete' ? rating.bg : 'bg-[var(--ui-bg-accented)]'"
                >
                  {{ pageState === 'idle' ? '💡' : pageState === 'complete' ? '✓' : currentPhase + 1 }}
                </span>
                <p class="text-sm text-[var(--ui-text-muted)]">
                  {{ currentStepExplanation }}
                </p>
              </div>
            </div>
          </div>

          <!-- Controls -->
          <div class="lg:col-span-2 p-4 flex flex-col">
            <!-- Timeline -->
            <div class="mb-4">
              <div class="text-xs text-[var(--ui-text-muted)] mb-2">
                Timeline breakdown:
              </div>
              <div class="h-6 rounded-md overflow-hidden flex bg-[var(--ui-bg)]">
                <div
                  v-for="(phase, i) in phases"
                  :key="phase.id"
                  class="h-full transition-all duration-150 flex items-center justify-center relative group"
                  :style="{
                    width: `${(timings[phase.id as keyof typeof timings] / total) * 100}%`,
                    backgroundColor: currentPhase >= i ? phase.color : 'transparent',
                    opacity: currentPhase === i ? 1 : currentPhase > i ? 0.7 : 0.3,
                  }"
                >
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[var(--ui-bg-inverted)] text-[var(--ui-bg)] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {{ phase.label }}: {{ timings[phase.id as keyof typeof timings] }}ms
                  </div>
                </div>
              </div>
              <div class="flex justify-between mt-1.5 text-xs text-[var(--ui-text-muted)]">
                <div v-for="phase in phases" :key="phase.id" class="flex items-center gap-1">
                  <div class="size-2 rounded-sm" :style="{ backgroundColor: phase.color }" />
                  <span>{{ phase.label }}</span>
                </div>
              </div>
            </div>

            <!-- Presets -->
            <div class="mb-4">
              <div class="text-xs text-[var(--ui-text-muted)] mb-2">
                Try different scenarios:
              </div>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="preset in presets"
                  :key="preset.label"
                  class="p-2 rounded-lg border border-[var(--ui-border)] hover:border-[var(--ui-primary)] hover:bg-[var(--ui-bg)] transition-colors text-left"
                  @click="applyPreset(preset)"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">{{ preset.label }}</span>
                    <span
                      class="text-xs font-mono px-1 rounded"
                      :class="getRating(preset.ttfb + preset.loadDelay + preset.loadDuration + preset.renderDelay).color === 'success' ? 'text-success' : getRating(preset.ttfb + preset.loadDelay + preset.loadDuration + preset.renderDelay).color === 'warning' ? 'text-warning' : 'text-error'"
                    >
                      {{ ((preset.ttfb + preset.loadDelay + preset.loadDuration + preset.renderDelay) / 1000).toFixed(1) }}s
                    </span>
                  </div>
                  <div class="text-xs text-[var(--ui-text-muted)]">
                    {{ preset.tip }}
                  </div>
                </button>
              </div>
            </div>

            <div class="flex-1" />

            <!-- Play button -->
            <div class="flex gap-2">
              <UButton
                :color="isPlaying ? 'neutral' : 'primary'"
                :disabled="isPlaying"
                class="flex-1"
                @click="play"
              >
                <template #leading>
                  <svg class="size-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </template>
                {{ isPlaying ? 'Loading...' : 'Simulate Load' }}
              </UButton>
              <UButton variant="outline" color="neutral" :disabled="currentPhase === -1" @click="reset">
                Reset
              </UButton>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-3 bg-[var(--ui-bg)] border-t border-[var(--ui-border)] flex items-center justify-between text-xs">
          <span class="text-[var(--ui-text-muted)]">
            <strong class="text-[var(--ui-text)]">Tip:</strong> Optimize TTFB with CDN, preload LCP images, use modern formats.
          </span>
          <div class="flex items-center gap-3 text-[var(--ui-text-muted)]">
            <span class="flex items-center gap-1"><span class="size-2 rounded-full bg-success" /> ≤2.5s</span>
            <span class="flex items-center gap-1"><span class="size-2 rounded-full bg-warning" /> 2.5-4s</span>
            <span class="flex items-center gap-1"><span class="size-2 rounded-full bg-error" /> >4s</span>
          </div>
        </div>
      </div>
    </div>

    <template #fallback>
      <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] h-96 flex items-center justify-center">
        <div class="flex items-center gap-2 text-[var(--ui-text-muted)]">
          <div class="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading demo...</span>
        </div>
      </div>
    </template>
  </ClientOnly>
</template>
