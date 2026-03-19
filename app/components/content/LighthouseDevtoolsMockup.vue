<script setup lang="ts">
const metrics = [
  { label: 'First Contentful Paint', value: '1.2 s', status: 'good' as const },
  { label: 'Largest Contentful Paint', value: '2.1 s', status: 'good' as const },
  { label: 'Total Blocking Time', value: '120 ms', status: 'good' as const },
  { label: 'Cumulative Layout Shift', value: '0.05', status: 'good' as const },
  { label: 'Speed Index', value: '2.8 s', status: 'warning' as const },
]

const score = 92
const tabs = ['Elements', 'Console', 'Sources', 'Network', 'Performance', 'Lighthouse', 'Application']
</script>

<template>
  <div class="my-6 not-prose">
    <div class="rounded-xl border border-default overflow-hidden bg-[#1e1e1e] shadow-xl">
      <!-- Title bar -->
      <div class="flex items-center gap-2 px-4 h-10 bg-[#2d2d2d]">
        <span class="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <span class="w-3 h-3 rounded-full bg-[#febc2e]" />
        <span class="w-3 h-3 rounded-full bg-[#28c840]" />
        <div class="flex-1 ml-4 px-3 py-1 rounded-md bg-[#1e1e1e] text-[13px] text-white/50 font-mono">
          https://example.com
        </div>
      </div>

      <!-- DevTools tabs -->
      <div class="flex items-center gap-0 px-3 h-9 bg-[#252525] border-b border-[#3d3d3d]">
        <div
          v-for="tab in tabs"
          :key="tab"
          class="px-4 py-2 text-xs relative"
          :class="tab === 'Lighthouse' ? 'text-[#8B5CF6]' : 'text-white/40'"
        >
          {{ tab }}
          <div
            v-if="tab === 'Lighthouse'"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B5CF6]"
          />
        </div>
      </div>

      <!-- Score + Metrics -->
      <div class="flex flex-col items-center py-6">
        <!-- Score gauge -->
        <div class="relative w-32 h-32 mb-2">
          <svg viewBox="0 0 120 120" class="w-full h-full">
            <circle cx="60" cy="60" r="48" fill="none" stroke="#333" stroke-width="6" />
            <circle
              cx="60" cy="60" r="48"
              fill="none"
              stroke="#0cce6b"
              stroke-width="6"
              stroke-linecap="round"
              :stroke-dasharray="2 * Math.PI * 48"
              :stroke-dashoffset="2 * Math.PI * 48 * (1 - score / 100)"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-4xl font-bold text-[#0cce6b] tabular-nums">{{ score }}</span>
          </div>
        </div>
        <span class="text-sm text-white/50">Performance</span>

        <!-- Metrics grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 w-full px-6 mt-6">
          <div
            v-for="m in metrics"
            :key="m.label"
            class="rounded-lg border border-[#3d3d3d] bg-[#252525] p-3"
          >
            <div class="flex items-center gap-1.5 mb-1">
              <span
                class="w-2 h-2 rounded-full"
                :class="m.status === 'good' ? 'bg-[#0cce6b]' : 'bg-[#ffa400]'"
              />
              <span class="text-[11px] text-white/50 truncate">{{ m.label }}</span>
            </div>
            <div class="text-lg font-bold text-white tabular-nums">
              {{ m.value }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
