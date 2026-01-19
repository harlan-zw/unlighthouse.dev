<script setup lang="ts">
const props = withDefaults(defineProps<{
  loading?: boolean
  focused?: boolean
  colorScheme?: 'violet' | 'blue' | 'purple' | 'green' | 'cyan' | 'amber'
}>(), {
  colorScheme: 'violet',
})

const internalFocused = ref(false)
const isFocused = computed(() => props.focused ?? internalFocused.value)

const gradientClass = computed(() => {
  const map: Record<typeof props.colorScheme, string> = {
    violet: 'from-violet-500/50 via-purple-500/50 to-violet-500/50',
    blue: 'from-blue-500/50 via-purple-500/50 to-cyan-500/50',
    purple: 'from-purple-500/50 via-pink-500/50 to-blue-500/50',
    green: 'from-green-500/50 via-emerald-500/50 to-teal-500/50',
    cyan: 'from-cyan-500/50 via-teal-500/50 to-cyan-500/50',
    amber: 'from-amber-500/50 via-orange-500/50 to-yellow-500/50',
  }
  return map[props.colorScheme]
})

provide('toolInputGlow', {
  onFocus: () => internalFocused.value = true,
  onBlur: () => internalFocused.value = false,
})
</script>

<template>
  <div class="mb-8 max-w-4xl relative">
    <div
      class="absolute -inset-0.5 rounded-xl bg-gradient-to-r opacity-0 blur-sm transition-opacity duration-300"
      :class="[gradientClass, { 'opacity-100': isFocused, 'opacity-30': loading }]"
    />
    <UCard class="relative">
      <slot />
    </UCard>
  </div>
</template>
