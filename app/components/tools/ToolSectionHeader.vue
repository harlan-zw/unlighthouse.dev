<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  icon: string
  color?: 'violet' | 'blue' | 'green' | 'purple' | 'cyan' | 'red' | 'emerald' | 'orange' | 'amber'
}>(), {
  color: 'violet',
})

const colorClasses = computed(() => {
  const map: Record<typeof props.color, { bg: string, icon: string }> = {
    violet: { bg: 'from-violet-500/20 to-purple-500/10', icon: 'text-violet-500' },
    blue: { bg: 'from-blue-500/20 to-cyan-500/10', icon: 'text-blue-500' },
    green: { bg: 'from-green-500/20 to-emerald-500/10', icon: 'text-green-500' },
    purple: { bg: 'from-purple-500/20 to-violet-500/10', icon: 'text-purple-500' },
    cyan: { bg: 'from-cyan-500/20 to-teal-500/10', icon: 'text-cyan-500' },
    red: { bg: 'from-red-500/20 to-orange-500/10', icon: 'text-red-500' },
    emerald: { bg: 'from-emerald-500/20 to-green-500/10', icon: 'text-emerald-500' },
    orange: { bg: 'from-orange-500/20 to-amber-500/10', icon: 'text-orange-500' },
    amber: { bg: 'from-amber-500/20 to-orange-500/10', icon: 'text-amber-500' },
  }
  return map[props.color]
})
</script>

<template>
  <div class="flex items-center gap-3 mb-6">
    <div class="p-2 rounded-lg bg-gradient-to-br" :class="colorClasses.bg">
      <UIcon :name="icon" class="w-6 h-6" :class="colorClasses.icon" />
    </div>
    <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
      {{ title }}
    </h2>
  </div>
</template>
