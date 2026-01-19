<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string
  icon?: string
  color: 'violet' | 'blue' | 'green' | 'purple' | 'cyan' | 'red' | 'orange' | 'emerald' | 'amber'
  to?: string
}>(), {
  color: 'violet',
})

const colorClasses = computed(() => {
  const map: Record<typeof props.color, { bg: string, border: string, borderHover: string, icon: string }> = {
    violet: { bg: 'from-violet-500/5 to-transparent', border: 'border-violet-500/10', borderHover: 'hover:border-violet-500/20', icon: 'text-violet-400' },
    blue: { bg: 'from-blue-500/5 to-transparent', border: 'border-blue-500/10', borderHover: 'hover:border-blue-500/20', icon: 'text-blue-400' },
    green: { bg: 'from-green-500/5 to-transparent', border: 'border-green-500/10', borderHover: 'hover:border-green-500/20', icon: 'text-green-400' },
    purple: { bg: 'from-purple-500/5 to-transparent', border: 'border-purple-500/10', borderHover: 'hover:border-purple-500/20', icon: 'text-purple-400' },
    cyan: { bg: 'from-cyan-500/5 to-transparent', border: 'border-cyan-500/10', borderHover: 'hover:border-cyan-500/20', icon: 'text-cyan-400' },
    red: { bg: 'from-red-500/5 to-transparent', border: 'border-red-500/10', borderHover: 'hover:border-red-500/20', icon: 'text-red-400' },
    orange: { bg: 'from-orange-500/5 to-transparent', border: 'border-orange-500/10', borderHover: 'hover:border-orange-500/20', icon: 'text-orange-400' },
    emerald: { bg: 'from-emerald-500/5 to-transparent', border: 'border-emerald-500/10', borderHover: 'hover:border-emerald-500/20', icon: 'text-emerald-400' },
    amber: { bg: 'from-amber-500/5 to-transparent', border: 'border-amber-500/10', borderHover: 'hover:border-amber-500/20', icon: 'text-amber-400' },
  }
  return map[props.color]
})

const Component = computed(() => props.to ? resolveComponent('NuxtLink') : 'div')
</script>

<template>
  <component
    :is="Component"
    :to="to"
    class="p-4 rounded-xl bg-gradient-to-br border transition-colors block"
    :class="[colorClasses.bg, colorClasses.border, colorClasses.borderHover]"
  >
    <h3 v-if="title" class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mt-0">
      <UIcon v-if="icon" :name="icon" class="w-5 h-5" :class="colorClasses.icon" />
      {{ title }}
    </h3>
    <slot />
    <div v-if="$slots.footer" class="mt-3">
      <slot name="footer" />
    </div>
  </component>
</template>
