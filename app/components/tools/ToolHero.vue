<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  description: string
  prefix?: string
  colorScheme?: 'violet' | 'blue' | 'purple' | 'green' | 'cyan' | 'amber'
}>(), {
  prefix: '$ unlighthouse tools',
  colorScheme: 'violet',
})

const gradientClass = computed(() => {
  const map: Record<typeof props.colorScheme, string> = {
    violet: 'from-violet-500/5 via-purple-500/5 to-violet-500/5',
    blue: 'from-blue-500/5 via-cyan-500/5 to-purple-500/5',
    purple: 'from-purple-500/5 via-pink-500/5 to-blue-500/5',
    green: 'from-green-500/5 via-emerald-500/5 to-teal-500/5',
    cyan: 'from-cyan-500/5 via-teal-500/5 to-cyan-500/5',
    amber: 'from-amber-500/5 via-orange-500/5 to-yellow-500/5',
  }
  return map[props.colorScheme]
})
</script>

<template>
  <div class="max-w-2xl mb-12 relative">
    <div
      class="absolute -inset-x-4 -inset-y-2 bg-gradient-to-r rounded-2xl blur-2xl opacity-60"
      :class="gradientClass"
    />
    <div class="relative">
      <p class="font-mono text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
        <span class="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        {{ prefix }}
      </p>
      <h1 class="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
        {{ title }}
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
        {{ description }}
      </p>
    </div>
  </div>
</template>
