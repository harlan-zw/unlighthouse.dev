<script setup lang="ts">
import type { LighthouseAudit } from '~/types/lighthouse'
import { formatBytes, formatMs, getScoreBgClass, getScoreRating } from '~/composables/useLighthouseReport'

const props = defineProps<{
  audits: LighthouseAudit[]
  title: string
  icon: string
  emptyMessage?: string
  defaultExpanded?: boolean
}>()

const expanded = ref<Set<string>>(new Set())
const showAll = ref(false)

const displayedAudits = computed(() => {
  if (showAll.value)
    return props.audits
  return props.audits.slice(0, 5)
})

function toggleAudit(id: string) {
  if (expanded.value.has(id)) {
    expanded.value.delete(id)
  }
  else {
    expanded.value.add(id)
  }
  expanded.value = new Set(expanded.value)
}

function getSavings(audit: LighthouseAudit): string | null {
  if (audit.details?.type === 'opportunity') {
    const parts: string[] = []
    if (audit.details.overallSavingsMs)
      parts.push(formatMs(audit.details.overallSavingsMs))
    if (audit.details.overallSavingsBytes)
      parts.push(formatBytes(audit.details.overallSavingsBytes))
    return parts.length ? parts.join(' · ') : null
  }
  return null
}

function getScoreIcon(score: number | null): string {
  const rating = getScoreRating(score)
  switch (rating) {
    case 'pass':
      return 'i-heroicons-check-circle'
    case 'average':
      return 'i-heroicons-exclamation-circle'
    case 'fail':
      return 'i-heroicons-x-circle'
    default:
      return 'i-heroicons-information-circle'
  }
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon :name="icon" class="w-4 h-4 text-violet-500" />
          <span class="text-sm font-semibold">{{ title }}</span>
          <span class="px-1.5 py-0.5 text-[10px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
            {{ audits.length }}
          </span>
        </div>
      </div>
    </div>

    <!-- Audits -->
    <div v-if="audits.length" class="divide-y divide-gray-100 dark:divide-gray-800">
      <div
        v-for="audit in displayedAudits"
        :key="audit.id"
        class="bg-white dark:bg-gray-900"
      >
        <!-- Audit Header -->
        <button
          type="button"
          class="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          @click="toggleAudit(audit.id)"
        >
          <div class="flex items-start gap-3">
            <!-- Score indicator -->
            <div
              class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
              :class="getScoreBgClass(audit.score)"
            >
              <UIcon
                :name="getScoreIcon(audit.score)"
                class="w-4 h-4 text-white"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ audit.title }}
              </p>
              <div class="flex items-center gap-2 mt-0.5">
                <span v-if="audit.displayValue" class="text-xs text-gray-600 dark:text-gray-400">
                  {{ audit.displayValue }}
                </span>
                <span v-if="getSavings(audit)" class="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  Save {{ getSavings(audit) }}
                </span>
              </div>
            </div>

            <!-- Expand icon -->
            <UIcon
              name="i-heroicons-chevron-down"
              class="w-4 h-4 text-gray-400 transition-transform shrink-0"
              :class="{ 'rotate-180': expanded.has(audit.id) }"
            />
          </div>
        </button>

        <!-- Expanded Details -->
        <div
          v-if="expanded.has(audit.id)"
          class="px-4 pb-4 pt-0"
        >
          <div class="ml-9 space-y-3">
            <!-- Description -->
            <p v-if="audit.description" class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {{ audit.description.split('[Learn more]')[0] }}
            </p>

            <!-- Table details -->
            <div
              v-if="audit.details?.type === 'table' || audit.details?.type === 'opportunity'"
              class="overflow-x-auto"
            >
              <table class="w-full text-[10px] sm:text-xs">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th
                      v-for="heading in (audit.details as any).headings?.slice(0, 3)"
                      :key="heading.key"
                      class="text-left py-2 pr-2 sm:pr-4 font-medium text-gray-500"
                    >
                      {{ heading.label || heading.text || heading.key }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, idx) in (audit.details as any).items?.slice(0, 5)"
                    :key="idx"
                    class="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td
                      v-for="heading in (audit.details as any).headings?.slice(0, 3)"
                      :key="heading.key"
                      class="py-2 pr-2 sm:pr-4 text-gray-700 dark:text-gray-300 max-w-[120px] sm:max-w-[200px] truncate text-[10px] sm:text-xs"
                    >
                      <template v-if="heading.key === 'url' || heading.key === 'node'">
                        <span v-if="item.url" class="text-violet-600 dark:text-violet-400">
                          {{ item.url?.split('/').pop() || item.url }}
                        </span>
                        <span v-else-if="item.node?.snippet" class="font-mono text-[10px]">
                          {{ item.node?.snippet }}
                        </span>
                        <span v-else>{{ item[heading.key] }}</span>
                      </template>
                      <template v-else-if="heading.valueType === 'bytes'">
                        {{ formatBytes(item[heading.key] || 0) }}
                      </template>
                      <template v-else-if="heading.valueType === 'timespanMs'">
                        {{ formatMs(item[heading.key] || 0) }}
                      </template>
                      <template v-else>
                        {{ item[heading.key] }}
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p
                v-if="(audit.details as any).items?.length > 5"
                class="text-[10px] text-gray-500 mt-2"
              >
                + {{ (audit.details as any).items.length - 5 }} more items
              </p>
            </div>

            <!-- Warnings -->
            <div v-if="audit.warnings?.length" class="space-y-1">
              <div
                v-for="(warning, idx) in audit.warnings"
                :key="idx"
                class="flex items-start gap-2 text-xs text-orange-600 dark:text-orange-400"
              >
                <UIcon name="i-heroicons-exclamation-triangle" class="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{{ warning }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="p-6 text-center">
      <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-green-500 mx-auto mb-2" />
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ emptyMessage || 'No items to display' }}
      </p>
    </div>

    <!-- Show more -->
    <div v-if="audits.length > 5" class="px-4 py-2 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
      <button
        type="button"
        class="text-xs text-violet-600 dark:text-violet-400 hover:underline"
        @click="showAll = !showAll"
      >
        {{ showAll ? 'Show less' : `Show all ${audits.length} items` }}
      </button>
    </div>
  </div>
</template>
