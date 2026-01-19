<script setup lang="ts">
type CheckListItem = string | { text: string, highlight?: string }

const props = withDefaults(defineProps<{
  items: CheckListItem[]
  color?: 'green' | 'violet' | 'blue' | 'amber'
}>(), {
  color: 'green',
})

const iconClass = computed(() => {
  const map: Record<typeof props.color, string> = {
    green: 'text-green-400',
    violet: 'text-violet-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
  }
  return map[props.color]
})

function normalizeItem(item: CheckListItem) {
  return typeof item === 'string' ? { text: item } : item
}
</script>

<template>
  <ul class="text-gray-600 dark:text-gray-400 space-y-2 list-none pl-0">
    <li v-for="(item, idx) in items" :key="idx" class="flex items-start gap-2 text-sm">
      <UIcon name="i-heroicons-check-circle" class="w-4 h-4 mt-0.5 shrink-0" :class="iconClass" />
      <span>
        {{ normalizeItem(item).text }}
        <strong v-if="normalizeItem(item).highlight" class="text-gray-900 dark:text-white">
          {{ normalizeItem(item).highlight }}
        </strong>
      </span>
    </li>
  </ul>
</template>
