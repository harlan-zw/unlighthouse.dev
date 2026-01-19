<script setup lang="ts">
const props = withDefaults(defineProps<{
  colorScheme?: 'violet' | 'blue' | 'purple' | 'green' | 'cyan' | 'amber'
}>(), {
  colorScheme: 'violet',
})

const orbClasses = computed(() => {
  const map: Record<typeof props.colorScheme, { topRight: string, left: string }> = {
    violet: {
      topRight: 'bg-gradient-to-br from-violet-500/8 via-purple-500/5 to-transparent',
      left: 'bg-gradient-to-tr from-purple-500/6 via-violet-500/4 to-transparent',
    },
    blue: {
      topRight: 'bg-gradient-to-br from-blue-500/8 via-purple-500/5 to-transparent',
      left: 'bg-gradient-to-tr from-cyan-500/6 via-blue-500/4 to-transparent',
    },
    purple: {
      topRight: 'bg-gradient-to-br from-purple-500/8 via-pink-500/5 to-transparent',
      left: 'bg-gradient-to-tr from-blue-500/6 via-purple-500/4 to-transparent',
    },
    green: {
      topRight: 'bg-gradient-to-br from-green-500/8 via-emerald-500/5 to-transparent',
      left: 'bg-gradient-to-tr from-teal-500/6 via-green-500/4 to-transparent',
    },
    cyan: {
      topRight: 'bg-gradient-to-br from-cyan-500/8 via-blue-500/5 to-transparent',
      left: 'bg-gradient-to-tr from-teal-500/6 via-cyan-500/4 to-transparent',
    },
    amber: {
      topRight: 'bg-gradient-to-br from-amber-500/8 via-orange-500/5 to-transparent',
      left: 'bg-gradient-to-tr from-yellow-500/6 via-amber-500/4 to-transparent',
    },
  }
  return map[props.colorScheme]
})
</script>

<template>
  <div class="min-h-screen relative overflow-hidden">
    <!-- Background gradient orbs -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl"
        :class="orbClasses.topRight"
      />
      <div
        class="absolute top-1/3 -left-40 w-80 h-80 rounded-full blur-3xl"
        :class="orbClasses.left"
      />
    </div>

    <UContainer class="py-16 md:py-24 relative">
      <slot />
    </UContainer>
  </div>
</template>
