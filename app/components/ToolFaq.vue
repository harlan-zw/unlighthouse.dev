<script setup lang="ts">
interface FAQ {
  question: string
  answer: string
}

const props = withDefaults(defineProps<{
  faqs: FAQ[]
  color?: 'emerald' | 'blue' | 'green' | 'purple' | 'cyan' | 'red' | 'amber' | 'orange' | 'violet'
}>(), {
  color: 'emerald',
})

const colorClasses = computed(() => {
  const map: Record<typeof props.color, { accent: string, bg: string, border: string, glow: string, number: string }> = {
    emerald: { accent: 'text-emerald-500', bg: 'from-emerald-500/8 to-green-500/4', border: 'border-emerald-500/20 group-open:border-emerald-500/40', glow: 'group-hover:shadow-emerald-500/5', number: 'bg-emerald-500/10 text-emerald-500' },
    blue: { accent: 'text-blue-500', bg: 'from-blue-500/8 to-cyan-500/4', border: 'border-blue-500/20 group-open:border-blue-500/40', glow: 'group-hover:shadow-blue-500/5', number: 'bg-blue-500/10 text-blue-500' },
    green: { accent: 'text-green-500', bg: 'from-green-500/8 to-emerald-500/4', border: 'border-green-500/20 group-open:border-green-500/40', glow: 'group-hover:shadow-green-500/5', number: 'bg-green-500/10 text-green-500' },
    purple: { accent: 'text-purple-500', bg: 'from-purple-500/8 to-violet-500/4', border: 'border-purple-500/20 group-open:border-purple-500/40', glow: 'group-hover:shadow-purple-500/5', number: 'bg-purple-500/10 text-purple-500' },
    cyan: { accent: 'text-cyan-500', bg: 'from-cyan-500/8 to-teal-500/4', border: 'border-cyan-500/20 group-open:border-cyan-500/40', glow: 'group-hover:shadow-cyan-500/5', number: 'bg-cyan-500/10 text-cyan-500' },
    red: { accent: 'text-red-500', bg: 'from-red-500/8 to-orange-500/4', border: 'border-red-500/20 group-open:border-red-500/40', glow: 'group-hover:shadow-red-500/5', number: 'bg-red-500/10 text-red-500' },
    amber: { accent: 'text-amber-500', bg: 'from-amber-500/8 to-orange-500/4', border: 'border-amber-500/20 group-open:border-amber-500/40', glow: 'group-hover:shadow-amber-500/5', number: 'bg-amber-500/10 text-amber-500' },
    orange: { accent: 'text-orange-500', bg: 'from-orange-500/8 to-amber-500/4', border: 'border-orange-500/20 group-open:border-orange-500/40', glow: 'group-hover:shadow-orange-500/5', number: 'bg-orange-500/10 text-orange-500' },
    violet: { accent: 'text-violet-500', bg: 'from-violet-500/8 to-purple-500/4', border: 'border-violet-500/20 group-open:border-violet-500/40', glow: 'group-hover:shadow-violet-500/5', number: 'bg-violet-500/10 text-violet-500' },
  }
  return map[props.color]
})
</script>

<template>
  <section class="mt-16">
    <ToolsToolSectionHeader title="Frequently Asked Questions" icon="i-carbon-help" :color="color" />

    <div class="space-y-3">
      <details
        v-for="(faq, index) in faqs"
        :key="index"
        :open="index === 0"
        class="group rounded-xl border overflow-hidden transition-all duration-300 shadow-lg shadow-black/[0.02] dark:shadow-black/10"
        :class="[colorClasses.border, colorClasses.glow]"
      >
        <summary
          class="flex items-center gap-4 p-5 cursor-pointer select-none transition-colors duration-200 bg-gradient-to-r"
          :class="colorClasses.bg"
        >
          <!-- Question number -->
          <span
            class="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold shrink-0 transition-transform duration-300 group-open:scale-110"
            :class="colorClasses.number"
          >
            {{ String(index + 1).padStart(2, '0') }}
          </span>

          <!-- Question text -->
          <h3 class="flex-1 font-medium text-gray-900 dark:text-white leading-snug pr-2 text-base">
            {{ faq.question }}
          </h3>

          <!-- Expand icon with rotation -->
          <span class="relative w-6 h-6 shrink-0">
            <UIcon
              name="i-carbon-add"
              class="absolute inset-0 w-6 h-6 transition-all duration-300 group-open:rotate-45 group-open:opacity-0"
              :class="colorClasses.accent"
            />
            <UIcon
              name="i-carbon-subtract"
              class="absolute inset-0 w-6 h-6 transition-all duration-300 opacity-0 group-open:opacity-100"
              :class="colorClasses.accent"
            />
          </span>
        </summary>

        <!-- Answer with left accent border -->
        <div class="relative">
          <div
            class="absolute left-0 top-0 bottom-0 w-0.5 opacity-60"
            :class="colorClasses.accent.replace('text-', 'bg-')"
          />
          <div class="pl-16 pr-6 pb-5 pt-1">
            <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {{ faq.answer }}
            </p>
          </div>
        </div>
      </details>
    </div>
  </section>
</template>
