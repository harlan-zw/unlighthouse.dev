<script setup lang="ts">
defineProps<{
  url?: string
  status?: 'idle' | 'loading' | 'complete'
}>()
</script>

<template>
  <div class="rounded-lg border border-[var(--ui-border)] overflow-hidden bg-[var(--ui-bg)]">
    <!-- Browser chrome -->
    <div class="flex items-center gap-2 px-3 py-2 bg-[var(--ui-bg-accented)] border-b border-[var(--ui-border)]">
      <div class="flex gap-1.5">
        <div class="size-2.5 rounded-full bg-red-400/60" />
        <div class="size-2.5 rounded-full bg-yellow-400/60" />
        <div class="size-2.5 rounded-full bg-green-400/60" />
      </div>
      <div class="flex-1 mx-2">
        <div class="flex items-center gap-2 bg-[var(--ui-bg)] rounded-md px-3 py-1 text-xs text-[var(--ui-text-muted)] font-mono">
          <svg class="size-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
          <span class="truncate">{{ url ?? 'example.com' }}</span>
        </div>
      </div>
      <div v-if="status" class="flex items-center gap-1.5 text-xs">
        <span
          class="size-2 rounded-full"
          :class="status === 'loading' ? 'bg-warning animate-pulse' : status === 'complete' ? 'bg-success' : 'bg-[var(--ui-border)]'"
        />
        <span class="text-[var(--ui-text-muted)]">{{ status === 'loading' ? 'Loading' : status === 'complete' ? 'Loaded' : 'Ready' }}</span>
      </div>
    </div>

    <!-- Content area -->
    <div class="relative bg-[var(--ui-bg)]">
      <slot />
    </div>
  </div>
</template>
