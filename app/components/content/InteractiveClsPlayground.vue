<script setup lang="ts">
interface ShiftEvent {
  id: number
  type: string
  icon: string
  impact: number
  distance: number
  score: number
}

const shifts = ref<ShiftEvent[]>([])
const shiftIdCounter = ref(0)
const protectedMode = ref(false)

// Shift scenarios
const scenarios = [
  { id: 'ad', label: 'Late Ad', icon: '📢', impact: 0.25, distance: 0.6, description: 'Ad banner loads after content, pushing everything down' },
  { id: 'image', label: 'Image Load', icon: '🖼️', impact: 0.15, distance: 0.5, description: 'Image without width/height expands when loaded' },
  { id: 'font', label: 'Font Swap', icon: '🔤', impact: 0.08, distance: 0.3, description: 'Web font loads and changes text size' },
  { id: 'dynamic', label: 'Banner', icon: '📝', impact: 0.12, distance: 0.4, description: 'Cookie consent or promo injected at top' },
]

// Active shift elements state
const activeShifts = ref<Record<string, boolean>>({
  ad: false,
  image: false,
  font: false,
  dynamic: false,
})

const totalCls = computed(() =>
  shifts.value.reduce((sum, s) => sum + s.score, 0),
)

const rating = computed(() => {
  if (totalCls.value <= 0.1)
    return { label: 'Good', color: 'success' }
  if (totalCls.value <= 0.25)
    return { label: 'Needs Improvement', color: 'warning' }
  return { label: 'Poor', color: 'error' }
})

const currentExplanation = computed(() => {
  if (protectedMode.value) {
    return 'Protected mode: All elements have reserved space. Trigger shifts to see how placeholders prevent movement.'
  }
  if (shifts.value.length === 0) {
    return 'Click a shift trigger to see how unexpected layout changes affect CLS score.'
  }
  const lastShift = shifts.value[shifts.value.length - 1]
  return `${lastShift.icon} ${lastShift.type}: Moved ${(lastShift.distance * 100).toFixed(0)}% of viewport, affecting ${(lastShift.impact * 100).toFixed(0)}% of visible area.`
})

function triggerShift(scenario: typeof scenarios[0]) {
  if (activeShifts.value[scenario.id])
    return

  activeShifts.value[scenario.id] = true

  // In protected mode, show element but don't add to CLS
  if (protectedMode.value)
    return

  const score = +(scenario.impact * scenario.distance).toFixed(4)
  shifts.value.push({
    id: shiftIdCounter.value++,
    type: scenario.label,
    icon: scenario.icon,
    impact: scenario.impact,
    distance: scenario.distance,
    score,
  })
}

function reset() {
  shifts.value = []
  activeShifts.value = {
    ad: false,
    image: false,
    font: false,
    dynamic: false,
  }
}

function toggleProtectedMode() {
  reset()
  protectedMode.value = !protectedMode.value
}
</script>

<template>
  <ClientOnly>
    <div class="not-prose">
      <div class="flex items-center justify-between mb-1">
        <div class="flex items-center gap-2">
          <h3 class="font-semibold">
            CLS Demo
          </h3>
          <UBadge v-if="protectedMode" color="success" variant="subtle" size="xs">
            Protected
          </UBadge>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-mono text-xl font-bold tabular-nums">{{ totalCls.toFixed(3) }}</span>
          <UBadge :color="rating.color" variant="subtle" size="sm">
            {{ rating.label }}
          </UBadge>
        </div>
      </div>
      <p class="text-sm text-[var(--ui-text-muted)] mb-3">
        Experience how layout shifts frustrate users. Each shift adds to cumulative score based on area affected × distance moved.
      </p>

      <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] overflow-hidden">
        <div class="grid lg:grid-cols-5 gap-0">
          <!-- Browser simulation -->
          <div class="lg:col-span-3 p-4 border-b lg:border-b-0 lg:border-r border-[var(--ui-border)]">
            <DemoBrowser url="news.example.com/article">
              <!-- contain: layout prevents demo shifts from affecting page CLS -->
              <div class="p-4 min-h-[220px] relative" style="contain: layout;">
                <!-- Dynamic banner injection point -->
                <Transition
                  enter-active-class="transition-all duration-500 ease-out"
                  enter-from-class="opacity-0 -translate-y-2 max-h-0"
                  enter-to-class="opacity-100 translate-y-0 max-h-12"
                >
                  <div
                    v-if="activeShifts.dynamic"
                    class="mb-3 p-2 rounded border border-dashed flex items-center justify-center text-xs"
                    :class="protectedMode ? 'border-[var(--ui-border)] bg-[var(--ui-bg-accented)]' : 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'"
                  >
                    {{ protectedMode ? '📝 Banner (reserved space)' : '📝 Cookie consent banner appeared!' }}
                  </div>
                </Transition>
                <div
                  v-if="protectedMode && !activeShifts.dynamic"
                  class="mb-3 h-10 rounded border border-dashed border-[var(--ui-border)] flex items-center justify-center text-xs text-[var(--ui-text-muted)]"
                >
                  Reserved for banner
                </div>

                <!-- Article header -->
                <div class="h-5 bg-[var(--ui-text-highlighted)] rounded w-3/4 mb-2" />
                <div class="h-3 bg-[var(--ui-text-muted)]/30 rounded w-1/2 mb-4" />

                <!-- Ad injection point -->
                <Transition
                  enter-active-class="transition-all duration-500 ease-out"
                  enter-from-class="opacity-0 max-h-0"
                  enter-to-class="opacity-100 max-h-20"
                >
                  <div
                    v-if="activeShifts.ad"
                    class="mb-3 h-16 rounded border border-dashed flex items-center justify-center text-xs"
                    :class="protectedMode ? 'border-[var(--ui-border)] bg-[var(--ui-bg-accented)]' : 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400'"
                  >
                    {{ protectedMode ? '📢 Ad (reserved space)' : '📢 Advertisement loaded late!' }}
                  </div>
                </Transition>
                <div
                  v-if="protectedMode && !activeShifts.ad"
                  class="mb-3 h-16 rounded border border-dashed border-[var(--ui-border)] flex items-center justify-center text-xs text-[var(--ui-text-muted)]"
                >
                  Reserved for ad
                </div>

                <!-- Text content with font shift -->
                <div
                  class="space-y-1.5 mb-4 transition-all duration-300"
                  :class="activeShifts.font && !protectedMode ? 'tracking-wide' : ''"
                >
                  <div class="h-3 bg-[var(--ui-text-muted)]/30 rounded w-full" />
                  <div class="h-3 bg-[var(--ui-text-muted)]/30 rounded w-11/12" />
                  <div class="h-3 bg-[var(--ui-text-muted)]/30 rounded w-full" />
                  <div class="h-3 bg-[var(--ui-text-muted)]/30 rounded w-4/5" />
                </div>

                <!-- Image with/without dimensions -->
                <div
                  class="rounded transition-all duration-500 flex items-center justify-center text-xs"
                  :class="[
                    protectedMode || activeShifts.image ? 'h-20' : 'h-6',
                    activeShifts.image
                      ? protectedMode
                        ? 'border border-dashed border-[var(--ui-border)] bg-[var(--ui-bg-accented)]'
                        : 'border border-dashed border-cyan-500/50 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                      : 'bg-[var(--ui-bg-accented)] text-[var(--ui-text-muted)]',
                  ]"
                >
                  <span v-if="activeShifts.image">
                    {{ protectedMode ? '🖼️ Image (dimensions set)' : '🖼️ Image expanded!' }}
                  </span>
                  <span v-else-if="protectedMode">Reserved for image</span>
                  <span v-else>Loading image...</span>
                </div>

                <!-- Font loaded indicator -->
                <div
                  v-if="activeShifts.font"
                  class="absolute bottom-2 right-2 px-2 py-1 rounded text-xs"
                  :class="protectedMode ? 'bg-[var(--ui-bg-accented)] text-[var(--ui-text-muted)]' : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'"
                >
                  🔤 {{ protectedMode ? 'Font (fallback sized)' : 'Font swapped!' }}
                </div>
              </div>
            </DemoBrowser>

            <!-- Explanation -->
            <div class="mt-3 p-3 bg-[var(--ui-bg)] rounded-lg border border-[var(--ui-border)]">
              <div class="flex items-start gap-2">
                <span class="text-sm">{{ currentExplanation }}</span>
              </div>
            </div>
          </div>

          <!-- Controls -->
          <div class="lg:col-span-2 p-4 flex flex-col">
            <div class="text-xs text-[var(--ui-text-muted)] mb-2">
              Trigger layout shifts:
            </div>

            <div class="space-y-2 mb-4">
              <button
                v-for="scenario in scenarios"
                :key="scenario.id"
                class="w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-left"
                :class="[
                  activeShifts[scenario.id]
                    ? 'border-[var(--ui-border)] bg-[var(--ui-bg-accented)] opacity-60'
                    : 'border-[var(--ui-border)] hover:border-[var(--ui-primary)] hover:bg-[var(--ui-bg)]',
                ]"
                :disabled="activeShifts[scenario.id]"
                @click="triggerShift(scenario)"
              >
                <span class="text-lg">{{ scenario.icon }}</span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">{{ scenario.label }}</span>
                    <span v-if="!protectedMode" class="text-xs font-mono text-error">+{{ (scenario.impact * scenario.distance).toFixed(3) }}</span>
                    <span v-else class="text-xs text-success">Protected</span>
                  </div>
                  <div class="text-xs text-[var(--ui-text-muted)] truncate">
                    {{ scenario.description }}
                  </div>
                </div>
              </button>
            </div>

            <!-- Shift log -->
            <div v-if="shifts.length > 0" class="mb-4">
              <div class="text-xs text-[var(--ui-text-muted)] mb-2">
                Shift log:
              </div>
              <div class="space-y-1 max-h-24 overflow-y-auto">
                <div
                  v-for="shift in [...shifts].reverse()"
                  :key="shift.id"
                  class="flex items-center justify-between text-xs p-2 rounded bg-[var(--ui-bg)]"
                >
                  <span>{{ shift.icon }} {{ shift.type }}</span>
                  <span class="font-mono text-[var(--ui-text-muted)]">
                    {{ shift.impact.toFixed(2) }} × {{ shift.distance.toFixed(2) }} = <span class="text-error">{{ shift.score.toFixed(4) }}</span>
                  </span>
                </div>
              </div>
            </div>

            <div class="flex-1" />

            <!-- Formula -->
            <div class="p-2 bg-[var(--ui-bg)] rounded-lg text-xs mb-4">
              <span class="text-[var(--ui-text-muted)]">Formula:</span>
              <code class="ml-1">CLS = impact × distance</code>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <UButton
                :color="protectedMode ? 'success' : 'neutral'"
                :variant="protectedMode ? 'soft' : 'outline'"
                class="flex-1"
                @click="toggleProtectedMode"
              >
                {{ protectedMode ? '🛡️ Protection On' : '🛡️ Enable Protection' }}
              </UButton>
              <UButton variant="outline" color="neutral" @click="reset">
                Reset
              </UButton>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-3 bg-[var(--ui-bg)] border-t border-[var(--ui-border)] flex items-center justify-between text-xs">
          <span class="text-[var(--ui-text-muted)]">
            <strong class="text-[var(--ui-text)]">Fix:</strong> Set width/height on images, reserve space for ads and dynamic content.
          </span>
          <div class="flex items-center gap-3 text-[var(--ui-text-muted)]">
            <span class="flex items-center gap-1"><span class="size-2 rounded-full bg-success" /> ≤0.1</span>
            <span class="flex items-center gap-1"><span class="size-2 rounded-full bg-warning" /> 0.1-0.25</span>
            <span class="flex items-center gap-1"><span class="size-2 rounded-full bg-error" /> >0.25</span>
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
    </div>
  </ClientOnly>
</template>
