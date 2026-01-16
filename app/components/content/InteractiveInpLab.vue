<script setup lang="ts">
// Demo is slowed down 2x for visibility
const SLOWDOWN_FACTOR = 2

const cartCount = ref(0)
const isProcessing = ref(false)
const lastInp = ref<number | null>(null)
const showFeedback = ref(false)

// Main thread visualization
const mainThreadBlocks = ref<{ id: number, type: string, width: number, label: string }[]>([])
const blockId = ref(0)

// Current scenario
const scenarios = [
  {
    id: 'optimized',
    label: 'Optimized',
    icon: '⚡',
    delay: 50,
    description: 'Fast event handler, minimal work',
    whatHappens: 'Click fires → handler runs (20ms) → browser paints (30ms) → done!',
    blocks: [
      { type: 'handler', duration: 20, label: 'Handler' },
      { type: 'paint', duration: 30, label: 'Paint' },
    ],
  },
  {
    id: 'sync-js',
    label: 'Heavy JS',
    icon: '🧮',
    delay: 450,
    description: 'Synchronous computation blocks thread',
    whatHappens: 'Click fires → JS sorts 10,000 items (350ms) → handler (50ms) → paint (50ms). UI frozen!',
    blocks: [
      { type: 'js', duration: 350, label: 'Sorting array...' },
      { type: 'handler', duration: 50, label: 'Handler' },
      { type: 'paint', duration: 50, label: 'Paint' },
    ],
  },
  {
    id: 'dom-thrash',
    label: 'DOM Thrashing',
    icon: '🔄',
    delay: 320,
    description: 'Forced layout recalculations',
    whatHappens: 'Click fires → read width (60ms) → write style (60ms) → read again (60ms) → more reflows...',
    blocks: [
      { type: 'layout', duration: 60, label: 'Read layout' },
      { type: 'layout', duration: 60, label: 'Write style' },
      { type: 'layout', duration: 60, label: 'Read layout' },
      { type: 'handler', duration: 40, label: 'Handler' },
      { type: 'paint', duration: 100, label: 'Repaint' },
    ],
  },
  {
    id: 'third-party',
    label: '3rd Party',
    icon: '📊',
    delay: 400,
    description: 'Analytics script blocking main thread',
    whatHappens: 'Click fires → analytics tracking (250ms) runs first → then your handler (50ms) → paint (100ms)',
    blocks: [
      { type: 'third-party', duration: 250, label: 'Analytics...' },
      { type: 'handler', duration: 50, label: 'Handler' },
      { type: 'paint', duration: 100, label: 'Paint' },
    ],
  },
]

const selectedScenario = ref(scenarios[0])

function getRating(ms: number) {
  if (ms <= 200)
    return { label: 'Good', color: 'success' }
  if (ms <= 500)
    return { label: 'Needs Improvement', color: 'warning' }
  return { label: 'Poor', color: 'error' }
}

const currentExplanation = computed(() => {
  if (isProcessing.value) {
    const currentBlock = mainThreadBlocks.value[mainThreadBlocks.value.length - 1]
    if (currentBlock) {
      const labels: Record<string, string> = {
        'handler': 'Running your click handler...',
        'paint': 'Browser painting the update...',
        'js': 'JavaScript blocking main thread...',
        'layout': 'Forced layout recalculation...',
        'third-party': 'Third-party script executing...',
      }
      return labels[currentBlock.type] || 'Processing...'
    }
    return 'Processing click...'
  }
  if (lastInp.value !== null) {
    const rating = getRating(lastInp.value)
    if (rating.color === 'success')
      return `Great! ${lastInp.value}ms is fast enough that users perceive it as instant.`
    if (rating.color === 'warning')
      return `${lastInp.value}ms is noticeable. Users may feel the interface is sluggish.`
    return `${lastInp.value}ms is too slow. Users will think the button is broken and may click again.`
  }
  return 'Click "Add to Cart" to measure how long until you see visual feedback.'
})

// Simulate the interaction with visible main thread blocking
async function addToCart() {
  if (isProcessing.value)
    return

  isProcessing.value = true
  showFeedback.value = false
  mainThreadBlocks.value = []
  const startTime = performance.now()

  const scenario = selectedScenario.value
  const totalDuration = scenario.blocks.reduce((sum, b) => sum + b.duration, 0)

  // Visualize each block on the main thread
  for (const block of scenario.blocks) {
    const id = blockId.value++
    mainThreadBlocks.value.push({
      id,
      type: block.type,
      width: 0,
      label: block.label,
    })

    // Animate the block growing (slowed down for demo)
    const blockIndex = mainThreadBlocks.value.length - 1
    const targetWidth = (block.duration / totalDuration) * 100
    const animDuration = block.duration * SLOWDOWN_FACTOR
    const blockStart = performance.now()

    await new Promise<void>((resolve) => {
      function animateBlock() {
        const progress = Math.min(1, (performance.now() - blockStart) / animDuration)
        if (mainThreadBlocks.value[blockIndex]) {
          mainThreadBlocks.value[blockIndex].width = targetWidth * progress
        }

        if (progress < 1) {
          requestAnimationFrame(animateBlock)
        }
        else {
          resolve()
        }
      }
      requestAnimationFrame(animateBlock)
    })
  }

  // Visual feedback appears NOW - this is the "next paint"
  showFeedback.value = true
  cartCount.value++

  // Record actual simulated INP (not slowed)
  lastInp.value = scenario.delay
  isProcessing.value = false

  // Hide feedback after a moment
  setTimeout(() => {
    showFeedback.value = false
  }, 1000)

  // Clear blocks after a moment
  setTimeout(() => {
    mainThreadBlocks.value = []
  }, 2000)
}

function reset() {
  cartCount.value = 0
  lastInp.value = null
  mainThreadBlocks.value = []
  showFeedback.value = false
}

const blockColors: Record<string, string> = {
  'handler': 'bg-emerald-500',
  'paint': 'bg-blue-500',
  'js': 'bg-red-500',
  'layout': 'bg-amber-500',
  'third-party': 'bg-purple-500',
}
</script>

<template>
  <ClientOnly>
    <div class="not-prose">
      <div class="flex items-center justify-between mb-1">
        <h3 class="font-semibold">
          INP Demo
        </h3>
        <div v-if="lastInp !== null" class="flex items-center gap-2">
          <span class="font-mono text-xl font-bold tabular-nums">{{ lastInp }}ms</span>
          <UBadge :color="getRating(lastInp).color" variant="subtle" size="sm">
            {{ getRating(lastInp).label }}
          </UBadge>
        </div>
      </div>
      <p class="text-sm text-[var(--ui-text-muted)] mb-3">
        INP measures time from click to visual feedback. Animation slowed 2× so you can see what's blocking.
      </p>

      <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] overflow-hidden">
        <div class="grid lg:grid-cols-5 gap-0">
          <!-- Browser simulation -->
          <div class="lg:col-span-3 p-4 border-b lg:border-b-0 lg:border-r border-[var(--ui-border)]">
            <DemoBrowser url="shop.example.com/headphones">
              <div class="p-4">
                <!-- Product card -->
                <div class="flex gap-4 mb-4">
                  <div class="size-20 bg-[var(--ui-bg-accented)] rounded-lg flex items-center justify-center text-3xl shrink-0">
                    🎧
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium mb-1">
                      Wireless Headphones
                    </div>
                    <div class="text-sm text-[var(--ui-text-muted)] mb-3">
                      $99.00
                    </div>

                    <!-- Add to Cart button - stays frozen during processing to demonstrate INP delay -->
                    <button
                      class="px-4 py-2 rounded-lg font-medium text-sm transition-all relative overflow-hidden bg-[var(--ui-primary)] text-white"
                      :class="[
                        isProcessing
                          ? 'scale-95 opacity-80 cursor-wait'
                          : 'hover:opacity-90 active:scale-95',
                      ]"
                      :disabled="isProcessing"
                      @click="addToCart"
                    >
                      <span :class="showFeedback ? 'opacity-0' : ''">
                        Add to Cart
                      </span>

                      <!-- Success flash - THIS is the "next paint" -->
                      <Transition
                        enter-active-class="transition-all duration-150"
                        enter-from-class="opacity-0 scale-110"
                        enter-to-class="opacity-100 scale-100"
                        leave-active-class="transition-opacity duration-200"
                        leave-from-class="opacity-100"
                        leave-to-class="opacity-0"
                      >
                        <span
                          v-if="showFeedback"
                          class="absolute inset-0 flex items-center justify-center bg-success text-white rounded-lg"
                        >
                          ✓ Added!
                        </span>
                      </Transition>
                    </button>
                  </div>
                </div>

                <!-- Cart status -->
                <div class="flex items-center justify-between text-sm text-[var(--ui-text-muted)] mb-4">
                  <span>Cart: {{ cartCount }} item{{ cartCount !== 1 ? 's' : '' }}</span>
                  <button v-if="cartCount > 0" class="text-xs hover:text-[var(--ui-text)]" @click="reset">
                    Clear
                  </button>
                </div>

                <!-- Main Thread Visualization -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-[var(--ui-text-muted)]">Main Thread</span>
                    <span v-if="isProcessing" class="text-warning flex items-center gap-1">
                      <span class="size-1.5 rounded-full bg-warning animate-pulse" /> Blocked
                    </span>
                    <span v-else class="text-[var(--ui-text-muted)]">Idle</span>
                  </div>

                  <div class="h-10 bg-[var(--ui-bg-accented)] rounded-lg overflow-hidden flex relative">
                    <div
                      v-for="block in mainThreadBlocks"
                      :key="block.id"
                      class="h-full transition-all duration-75 flex items-center justify-center shrink-0"
                      :class="blockColors[block.type] ?? 'bg-gray-500'"
                      :style="{ width: `${block.width}%` }"
                    >
                      <span v-if="block.width > 20" class="text-xs text-white font-medium truncate px-2">
                        {{ block.label }}
                      </span>
                    </div>

                    <div
                      v-if="mainThreadBlocks.length === 0"
                      class="absolute inset-0 flex items-center justify-center text-xs text-[var(--ui-text-muted)]"
                    >
                      Waiting for interaction...
                    </div>
                  </div>

                  <!-- Legend -->
                  <div class="flex flex-wrap gap-3 text-xs">
                    <div class="flex items-center gap-1">
                      <div class="size-2 rounded-sm bg-emerald-500" />
                      <span class="text-[var(--ui-text-muted)]">Handler</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="size-2 rounded-sm bg-blue-500" />
                      <span class="text-[var(--ui-text-muted)]">Paint</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="size-2 rounded-sm bg-red-500" />
                      <span class="text-[var(--ui-text-muted)]">JS</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="size-2 rounded-sm bg-amber-500" />
                      <span class="text-[var(--ui-text-muted)]">Layout</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="size-2 rounded-sm bg-purple-500" />
                      <span class="text-[var(--ui-text-muted)]">3rd Party</span>
                    </div>
                  </div>
                </div>
              </div>
            </DemoBrowser>

            <!-- Explanation -->
            <div class="mt-3 p-3 bg-[var(--ui-bg)] rounded-lg border border-[var(--ui-border)]">
              <p class="text-sm">
                {{ currentExplanation }}
              </p>
            </div>
          </div>

          <!-- Scenario selector -->
          <div class="lg:col-span-2 p-4 flex flex-col">
            <div class="text-xs text-[var(--ui-text-muted)] mb-2">
              What's blocking the response?
            </div>

            <div class="space-y-2 mb-4">
              <button
                v-for="scenario in scenarios"
                :key="scenario.id"
                class="w-full flex items-start gap-3 p-2 rounded-lg border transition-all text-left"
                :class="[
                  selectedScenario.id === scenario.id
                    ? 'border-[var(--ui-primary)] bg-[var(--ui-primary)]/5'
                    : 'border-[var(--ui-border)] hover:border-[var(--ui-primary)]/50',
                ]"
                @click="selectedScenario = scenario; reset()"
              >
                <span class="text-xl">{{ scenario.icon }}</span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">{{ scenario.label }}</span>
                    <span
                      class="text-xs font-mono px-1.5 py-0.5 rounded"
                      :class="getRating(scenario.delay).color === 'success' ? 'bg-success/10 text-success' : getRating(scenario.delay).color === 'warning' ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'"
                    >
                      {{ scenario.delay }}ms
                    </span>
                  </div>
                  <div class="text-xs text-[var(--ui-text-muted)]">
                    {{ scenario.description }}
                  </div>
                </div>
              </button>
            </div>

            <div class="flex-1" />

            <!-- What happens breakdown -->
            <div class="p-3 bg-[var(--ui-bg)] rounded-lg text-xs mb-4">
              <div class="text-[var(--ui-text-muted)] mb-1">
                Sequence:
              </div>
              <div class="text-[var(--ui-text)]">
                {{ selectedScenario.whatHappens }}
              </div>
            </div>

            <UButton variant="outline" color="neutral" class="w-full" @click="reset">
              Reset
            </UButton>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-3 bg-[var(--ui-bg)] border-t border-[var(--ui-border)] flex items-center justify-between text-xs">
          <span class="text-[var(--ui-text-muted)]">
            <strong class="text-[var(--ui-text)]">Fix:</strong> Break up long tasks, defer analytics, avoid layout thrashing.
          </span>
          <div class="flex items-center gap-3 text-[var(--ui-text-muted)]">
            <span class="flex items-center gap-1"><span class="size-2 rounded-full bg-success" /> ≤200ms</span>
            <span class="flex items-center gap-1"><span class="size-2 rounded-full bg-warning" /> 200-500ms</span>
            <span class="flex items-center gap-1"><span class="size-2 rounded-full bg-error" /> >500ms</span>
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
