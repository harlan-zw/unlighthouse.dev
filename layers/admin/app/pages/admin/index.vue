<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { h } from 'vue'

definePageMeta({
  layout: false,
})

const ADMIN_EMAILS = ['harlan@harlanzw.com']

const { loggedIn, user, clear } = useUserSession()

const isAdmin = computed(() => user.value?.email && ADMIN_EMAILS.includes(user.value.email))

const timeRange = ref('7d')
const timeRanges = [
  { label: '1 Hour', value: '1h' },
  { label: '24 Hours', value: '24h' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
]

const { data: analytics, refresh, status } = useFetch('/api/admin/tool-analytics', {
  query: { range: timeRange },
  watch: [timeRange],
})

const toolMetadata: Record<string, { name: string, icon: string }> = {
  'pagespeed-insights': { name: 'PageSpeed Insights', icon: 'i-carbon-meter' },
  'lcp': { name: 'LCP Finder', icon: 'i-carbon-image' },
  'cls': { name: 'CLS Debugger', icon: 'i-carbon-move' },
  'inp': { name: 'INP Analyzer', icon: 'i-carbon-touch-interaction' },
  'lighthouse-report-viewer': { name: 'Report Viewer', icon: 'i-carbon-document' },
  'lighthouse-score-calculator': { name: 'Score Calculator', icon: 'i-carbon-calculator' },
}

function getToolMeta(id: string) {
  return toolMetadata[id] || { name: id, icon: 'i-carbon-tool-box' }
}

// Tool Lookups (D1 database)
interface ToolLookup {
  id: string
  user_id: string | null
  tool: 'pagespeed-insights' | 'lcp' | 'cls' | 'inp'
  query: string
  strategy: 'mobile' | 'desktop' | null
  created_at: number
}

interface LookupResponse {
  lookups: ToolLookup[]
  stats: Record<string, number>
  total: number
}

const { data: lookupData, status: lookupStatus } = useFetch<LookupResponse>('/api/admin/tool-lookups')

const lookupTools = [
  { value: 'all', label: 'All', icon: 'i-carbon-grid' },
  { value: 'pagespeed-insights', label: 'PageSpeed', icon: 'i-carbon-meter' },
  { value: 'lcp', label: 'LCP', icon: 'i-carbon-image' },
  { value: 'cls', label: 'CLS', icon: 'i-carbon-move' },
  { value: 'inp', label: 'INP', icon: 'i-carbon-touch-interaction' },
]

const activeLookupTab = ref('all')

const filteredLookups = computed(() => {
  if (!lookupData.value?.lookups)
    return []
  if (activeLookupTab.value === 'all')
    return lookupData.value.lookups
  return lookupData.value.lookups.filter(l => l.tool === activeLookupTab.value)
})

const lookupColumns: TableColumn<ToolLookup>[] = [
  {
    accessorKey: 'tool',
    header: 'Tool',
    cell: ({ row }) => {
      const tool = lookupTools.find(t => t.value === row.original.tool)
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', { class: `${tool?.icon} w-4 h-4 text-[var(--ui-primary)]` }),
        h('span', { class: 'font-medium' }, row.original.tool),
      ])
    },
  },
  {
    accessorKey: 'query',
    header: 'Domain',
    cell: ({ row }) => h('code', { class: 'text-sm bg-[var(--ui-bg)] px-2 py-0.5 rounded' }, row.original.query),
  },
  {
    accessorKey: 'strategy',
    header: 'Strategy',
    cell: ({ row }) => {
      const strategy = row.original.strategy
      if (!strategy)
        return h('span', { class: 'text-[var(--ui-text-dimmed)]' }, '—')
      const icon = strategy === 'mobile' ? 'i-carbon-mobile' : 'i-carbon-laptop'
      return h('div', { class: 'flex items-center gap-1.5' }, [
        h('span', { class: `${icon} w-4 h-4` }),
        h('span', {}, strategy),
      ])
    },
  },
  {
    accessorKey: 'user_id',
    header: 'User',
    cell: ({ row }) => {
      const userId = row.original.user_id
      if (!userId)
        return h('span', { class: 'text-xs text-[var(--ui-text-dimmed)] italic' }, 'anon')
      return h('span', { class: 'text-xs font-mono text-[var(--ui-primary)]' }, userId.slice(0, 8))
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Time',
    cell: ({ row }) => {
      const date = new Date(row.original.created_at * 1000)
      return h('time', {
        class: 'text-sm text-[var(--ui-text-muted)]',
        datetime: date.toISOString(),
      }, formatRelativeTime(date))
    },
  },
]

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1)
    return 'just now'
  if (diffMins < 60)
    return `${diffMins}m ago`
  if (diffHours < 24)
    return `${diffHours}h ago`
  if (diffDays < 7)
    return `${diffDays}d ago`
  return date.toLocaleDateString()
}
</script>

<template>
  <div class="min-h-screen bg-[var(--ui-bg)]">
    <header class="border-b border-[var(--ui-border)] bg-[var(--ui-bg-elevated)]">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <NuxtLink to="/" class="text-[var(--ui-text-muted)] hover:text-[var(--ui-text-highlighted)]">
            <UIcon name="i-carbon-arrow-left" class="w-5 h-5" />
          </NuxtLink>
          <h1 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
            Admin Dashboard
          </h1>
        </div>
        <div v-if="loggedIn" class="flex items-center gap-3">
          <span class="text-sm text-[var(--ui-text-muted)]">{{ user?.email }}</span>
          <UButton variant="ghost" size="sm" @click="clear">
            Logout
          </UButton>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 py-8">
      <div v-if="!loggedIn" class="text-center py-20">
        <UIcon name="i-carbon-locked" class="w-12 h-12 text-[var(--ui-text-dimmed)] mx-auto mb-4" />
        <h2 class="text-xl font-semibold text-[var(--ui-text-highlighted)] mb-2">
          Admin Access Required
        </h2>
        <p class="text-[var(--ui-text-muted)] mb-6">
          Sign in with GitHub to access the admin dashboard.
        </p>
        <UButton to="/auth/github" external icon="i-carbon-logo-github">
          Sign in with GitHub
        </UButton>
      </div>

      <div v-else-if="!isAdmin" class="text-center py-20">
        <UIcon name="i-carbon-warning" class="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 class="text-xl font-semibold text-[var(--ui-text-highlighted)] mb-2">
          Access Denied
        </h2>
        <p class="text-[var(--ui-text-muted)] mb-6">
          Your account ({{ user?.email }}) does not have admin access.
        </p>
        <UButton variant="soft" @click="clear">
          Sign out
        </UButton>
      </div>

      <div v-else class="space-y-8">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-[var(--ui-text-highlighted)]">
            Tool Analytics
          </h2>
          <div class="flex items-center gap-2">
            <USelect v-model="timeRange" :items="timeRanges" value-key="value" size="sm" class="w-32" />
            <UButton variant="ghost" size="sm" icon="i-carbon-renew" :loading="status === 'pending'" @click="refresh" />
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-4 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
            <p class="text-sm text-[var(--ui-text-muted)]">
              Total Events
            </p>
            <p class="text-2xl font-bold text-[var(--ui-text-highlighted)]">
              {{ analytics?.totalEvents.toLocaleString() || 0 }}
            </p>
          </div>
          <div class="p-4 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
            <p class="text-sm text-[var(--ui-text-muted)]">
              Unique Sessions
            </p>
            <p class="text-2xl font-bold text-[var(--ui-text-highlighted)]">
              {{ analytics?.uniqueSessions.toLocaleString() || 0 }}
            </p>
          </div>
          <div class="p-4 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
            <p class="text-sm text-[var(--ui-text-muted)]">
              Tools
            </p>
            <p class="text-2xl font-bold text-[var(--ui-text-highlighted)]">
              {{ analytics?.topTools.length || 0 }}
            </p>
          </div>
          <div class="p-4 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
            <p class="text-sm text-[var(--ui-text-muted)]">
              Error Rate
            </p>
            <p class="text-2xl font-bold" :class="(analytics?.errorRate || 0) > 5 ? 'text-red-500' : 'text-green-500'">
              {{ (analytics?.errorRate || 0).toFixed(1) }}%
            </p>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <div class="p-5 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
            <h3 class="text-sm font-medium text-[var(--ui-text-muted)] uppercase tracking-wider mb-4">
              Tool Usage
            </h3>
            <div v-if="analytics?.topTools.length" class="space-y-3">
              <div v-for="tool in analytics.topTools" :key="tool.tool" class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UIcon :name="getToolMeta(tool.tool).icon" class="w-4 h-4 text-[var(--ui-text-muted)]" />
                  <span class="text-sm text-[var(--ui-text-highlighted)]">{{ getToolMeta(tool.tool).name }}</span>
                </div>
                <span class="text-sm font-mono text-[var(--ui-text-muted)]">{{ tool.count.toLocaleString() }}</span>
              </div>
            </div>
            <p v-else class="text-sm text-[var(--ui-text-dimmed)]">
              No data yet
            </p>
          </div>

          <div class="p-5 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
            <h3 class="text-sm font-medium text-[var(--ui-text-muted)] uppercase tracking-wider mb-4">
              Action Breakdown
            </h3>
            <div v-if="analytics?.topActions.length" class="space-y-3">
              <div v-for="action in analytics.topActions" :key="action.action" class="flex items-center justify-between">
                <span class="text-sm text-[var(--ui-text-highlighted)] capitalize">{{ action.action }}</span>
                <span class="text-sm font-mono text-[var(--ui-text-muted)]">{{ action.count.toLocaleString() }}</span>
              </div>
            </div>
            <p v-else class="text-sm text-[var(--ui-text-dimmed)]">
              No data yet
            </p>
          </div>
        </div>

        <!-- Tool Lookups (D1) -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-[var(--ui-text-highlighted)]">
              Tool Lookups
            </h2>
            <span class="text-sm text-[var(--ui-text-muted)]">from D1 database</span>
          </div>

          <!-- Filter tabs -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tool in lookupTools"
              :key="tool.value"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
              :class="[
                activeLookupTab === tool.value
                  ? 'bg-[var(--ui-primary)] text-white'
                  : 'bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)] hover:text-[var(--ui-text-highlighted)] border border-[var(--ui-border)]',
              ]"
              @click="activeLookupTab = tool.value"
            >
              <UIcon :name="tool.icon" class="w-4 h-4" />
              <span>{{ tool.label }}</span>
              <span
                v-if="lookupData?.stats"
                class="ml-1 px-1.5 py-0.5 rounded text-xs"
                :class="activeLookupTab === tool.value ? 'bg-white/20' : 'bg-[var(--ui-bg)]'"
              >
                {{ tool.value === 'all' ? lookupData.total : (lookupData.stats[tool.value] || 0) }}
              </span>
            </button>
          </div>

          <!-- Table -->
          <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] overflow-hidden">
            <UTable
              v-if="lookupStatus !== 'pending' && filteredLookups.length"
              :data="filteredLookups"
              :columns="lookupColumns"
            />

            <div v-else-if="lookupStatus === 'pending'" class="p-8 text-center">
              <UIcon name="i-carbon-renew" class="w-5 h-5 text-[var(--ui-text-dimmed)] animate-spin mx-auto mb-2" />
              <p class="text-sm text-[var(--ui-text-muted)]">
                Loading lookups...
              </p>
            </div>

            <div v-else class="p-8 text-center">
              <UIcon name="i-carbon-data-table" class="w-6 h-6 text-[var(--ui-text-dimmed)] mx-auto mb-2" />
              <p class="text-sm text-[var(--ui-text-muted)]">
                No lookups found
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
