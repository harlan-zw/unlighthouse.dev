<script setup lang="ts">
import type { FieldSource } from '~~/shared/field-assessment'

const { source } = defineProps<{ source: FieldSource }>()
</script>

<template>
  <div class="space-y-1 text-xs text-gray-500 dark:text-gray-400">
    <p class="font-medium">
      {{ source.scope === 'url' ? 'URL field data' : 'Origin field data' }} · Chrome UX Report · {{ source.device === 'all' ? 'All devices' : source.device }}
    </p>
    <p class="break-all">
      {{ source.url }}
    </p>
    <p>
      {{ source.collectionPeriod._tag === 'Dates' ? `${source.collectionPeriod.start} to ${source.collectionPeriod.end}` : 'Last 28 days' }}
    </p>
  </div>
</template>
