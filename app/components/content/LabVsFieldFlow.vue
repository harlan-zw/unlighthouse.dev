<script setup lang="ts">
const labSteps = [
  { title: 'Your Machine', desc: 'Chrome DevTools or CLI', icon: 'i-heroicons-computer-desktop' },
  { title: 'Lighthouse', desc: 'Simulated or applied throttling', icon: 'i-simple-icons-lighthouse' },
  { title: 'Synthetic Score', desc: 'Single controlled test', badge: '1 page load', icon: 'i-heroicons-chart-bar' },
]

const fieldSteps = [
  { title: 'Real Chrome Users', desc: 'Diverse devices & networks', icon: 'i-heroicons-user-group' },
  { title: 'CrUX Dataset', desc: '28-day rolling window, P75', icon: 'i-heroicons-circle-stack' },
  { title: 'PSI Field Metrics', desc: 'Real-world performance', badge: '1000+ visits', icon: 'i-heroicons-globe-alt' },
]
</script>

<template>
  <div class="my-6 not-prose">
    <div class="rounded-xl border border-default overflow-hidden bg-elevated">
      <!-- Lab row -->
      <div class="p-4 sm:p-5">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs font-bold tracking-wider uppercase text-primary">Lab Data</span>
          <span class="text-xs text-dimmed">Lighthouse</span>
        </div>
        <div class="flex items-center gap-2 sm:gap-3">
          <template v-for="(step, i) in labSteps" :key="step.title">
            <div class="flex-1 rounded-lg border border-[var(--ui-primary)]/20 bg-[var(--ui-primary)]/5 p-3 sm:p-4 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <UIcon :name="step.icon" class="text-primary shrink-0 size-4" />
                <span class="font-semibold text-sm sm:text-base truncate">{{ step.title }}</span>
              </div>
              <p class="text-xs text-dimmed hidden sm:block">
                {{ step.desc }}
              </p>
              <UBadge v-if="step.badge" color="primary" variant="subtle" size="xs" class="mt-1.5">
                {{ step.badge }}
              </UBadge>
            </div>
            <UIcon v-if="i < labSteps.length - 1" name="i-heroicons-arrow-right" class="text-primary shrink-0 size-4" />
          </template>
        </div>
      </div>

      <div class="h-px bg-[var(--ui-border)]" />

      <!-- Field row -->
      <div class="p-4 sm:p-5">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs font-bold tracking-wider uppercase text-emerald-500">Field Data</span>
          <span class="text-xs text-dimmed">CrUX / PSI</span>
        </div>
        <div class="flex items-center gap-2 sm:gap-3">
          <template v-for="(step, i) in fieldSteps" :key="step.title">
            <div class="flex-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 sm:p-4 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <UIcon :name="step.icon" class="text-emerald-500 shrink-0 size-4" />
                <span class="font-semibold text-sm sm:text-base truncate">{{ step.title }}</span>
              </div>
              <p class="text-xs text-dimmed hidden sm:block">
                {{ step.desc }}
              </p>
              <UBadge v-if="step.badge" color="success" variant="subtle" size="xs" class="mt-1.5">
                {{ step.badge }}
              </UBadge>
            </div>
            <UIcon v-if="i < fieldSteps.length - 1" name="i-heroicons-arrow-right" class="text-emerald-500 shrink-0 size-4" />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
