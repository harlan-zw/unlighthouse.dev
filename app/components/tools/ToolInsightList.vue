<script setup lang="ts">
defineProps<{
  insights: ToolInsight[]
}>()
</script>

<template>
  <div v-if="insights.length" class="mb-6">
    <div class="flex items-center gap-2 mb-3">
      <UIcon name="i-heroicons-light-bulb" class="w-4 h-4 text-cyan-500" />
      <span class="text-sm font-semibold">Insights</span>
    </div>
    <div class="space-y-2">
      <div
        v-for="(insight, idx) in insights"
        :key="idx"
        class="p-3 rounded-lg border"
        :class="{
          'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800': insight.type === 'positive',
          'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800': insight.type === 'info',
          'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800': insight.type === 'warning',
        }"
      >
        <div class="flex items-start gap-3">
          <UIcon
            :name="insight.icon"
            class="w-5 h-5 shrink-0 mt-0.5"
            :class="{
              'text-green-500': insight.type === 'positive',
              'text-blue-500': insight.type === 'info',
              'text-orange-500': insight.type === 'warning',
            }"
          />
          <div>
            <p
              class="text-sm font-medium"
              :class="{
                'text-green-800 dark:text-green-200': insight.type === 'positive',
                'text-blue-800 dark:text-blue-200': insight.type === 'info',
                'text-orange-800 dark:text-orange-200': insight.type === 'warning',
              }"
            >
              {{ insight.title }}
            </p>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {{ insight.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
