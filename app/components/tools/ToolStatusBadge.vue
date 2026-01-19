<script setup lang="ts">
const props = withDefaults(defineProps<{
  status: 'success' | 'warning' | 'error' | 'info' | 'good'
  label: string
  showDot?: boolean
}>(), {
  showDot: true,
})

const normalizedStatus = computed(() => props.status === 'good' ? 'success' : props.status)

const classes = computed(() => {
  const map: Record<string, { badge: string, dot: string }> = {
    success: { badge: 'bg-green-500/15 text-green-400 ring-1 ring-green-500/20', dot: 'bg-green-400' },
    warning: { badge: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20', dot: 'bg-amber-400' },
    error: { badge: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/20', dot: 'bg-red-400' },
    info: { badge: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20', dot: 'bg-blue-400' },
  }
  return map[normalizedStatus.value]
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
    :class="classes.badge"
  >
    <span
      v-if="showDot"
      class="w-1.5 h-1.5 rounded-full"
      :class="classes.dot"
    />
    {{ label }}
  </span>
</template>
