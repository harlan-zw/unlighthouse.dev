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

const toolMetadata: Record<string, { name: string, icon: string, color: string }> = {
  'pagespeed-insights': { name: 'PageSpeed Insights', icon: 'i-carbon-meter', color: 'emerald' },
  'lcp': { name: 'LCP Finder', icon: 'i-carbon-image', color: 'blue' },
  'cls': { name: 'CLS Debugger', icon: 'i-carbon-move', color: 'amber' },
  'inp': { name: 'INP Analyzer', icon: 'i-carbon-touch-interaction', color: 'violet' },
  'lighthouse-report-viewer': { name: 'Report Viewer', icon: 'i-carbon-document', color: 'rose' },
  'lighthouse-score-calculator': { name: 'Score Calculator', icon: 'i-carbon-calculator', color: 'cyan' },
}

function getToolMeta(id: string) {
  return toolMetadata[id] || { name: id, icon: 'i-carbon-tool-box', color: 'gray' }
}

// Computed for progress bars
const maxToolCount = computed(() => {
  if (!analytics.value?.topTools?.length)
    return 1
  return Math.max(...analytics.value.topTools.map(t => t.count))
})

// Tool Lookups (D1 database)
interface ToolLookup {
  id: string
  user_id: string | null
  tool: 'pagespeed-insights' | 'lcp' | 'cls' | 'inp'
  query: string
  strategy: 'mobile' | 'desktop' | null
  created_at: number | string | Date
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
      const meta = getToolMeta(row.original.tool)
      return h('div', { class: 'flex items-center gap-2.5' }, [
        h('div', { class: `w-8 h-8 rounded-lg bg-${meta.color}-500/10 flex items-center justify-center` }, [
          h('span', { class: `${meta.icon} w-4 h-4 text-${meta.color}-500` }),
        ]),
        h('span', { class: 'font-medium text-[var(--ui-text-highlighted)]' }, meta.name),
      ])
    },
  },
  {
    accessorKey: 'query',
    header: 'Domain',
    cell: ({ row }) => h('code', { class: 'text-[13px] font-mono bg-[var(--ui-bg)] px-2 py-1 rounded-md text-[var(--ui-text-muted)]' }, row.original.query),
  },
  {
    accessorKey: 'strategy',
    header: 'Device',
    cell: ({ row }) => {
      const strategy = row.original.strategy
      if (!strategy)
        return h('span', { class: 'text-[var(--ui-text-dimmed)]' }, '—')
      const icon = strategy === 'mobile' ? 'i-carbon-mobile' : 'i-carbon-laptop'
      const label = strategy === 'mobile' ? 'Mobile' : 'Desktop'
      return h('div', { class: 'flex items-center gap-2 text-[var(--ui-text-muted)]' }, [
        h('span', { class: `${icon} w-4 h-4` }),
        h('span', { class: 'text-sm' }, label),
      ])
    },
  },
  {
    accessorKey: 'user_id',
    header: 'User',
    cell: ({ row }) => {
      const userId = row.original.user_id
      if (!userId) {
        return h('span', { class: 'inline-flex items-center gap-1.5 text-xs text-[var(--ui-text-dimmed)]' }, [
          h('span', { class: 'w-1.5 h-1.5 rounded-full bg-gray-400' }),
          'Anonymous',
        ])
      }
      return h('span', { class: 'inline-flex items-center gap-1.5 text-xs' }, [
        h('span', { class: 'w-1.5 h-1.5 rounded-full bg-emerald-500' }),
        h('code', { class: 'font-mono text-[var(--ui-primary)]' }, userId.slice(0, 8)),
      ])
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Time',
    cell: ({ row }) => {
      const raw = row.original.created_at
      const date = raw instanceof Date ? raw : new Date(typeof raw === 'number' ? raw * 1000 : raw)
      if (Number.isNaN(date.getTime()))
        return h('span', { class: 'text-[var(--ui-text-dimmed)]' }, '—')
      return h('time', {
        class: 'text-sm font-mono text-[var(--ui-text-muted)] tabular-nums',
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

// Feedback (D1 database)
interface FeedbackEntry {
  id: string
  path: string
  thumb: 'up' | 'down' | null
  comment: string | null
  metadata: Record<string, unknown> | null
  userId: string | null
  createdAt: number | string | Date
}

interface FeedbackResponse {
  entries: FeedbackEntry[]
  stats: { up: number, down: number }
  byPath: Record<string, number>
  commentCount: number
  total: number
}

const { data: feedbackData, status: feedbackStatus } = useFetch<FeedbackResponse>('/api/admin/feedback')

const feedbackPaths = computed(() => {
  if (!feedbackData.value?.byPath)
    return [{ value: 'all', label: 'All' }]
  return [
    { value: 'all', label: 'All' },
    ...Object.keys(feedbackData.value.byPath).map(p => ({ value: p, label: p })),
  ]
})

const activeFeedbackPath = ref('all')

const filteredFeedback = computed(() => {
  if (!feedbackData.value?.entries)
    return []
  if (activeFeedbackPath.value === 'all')
    return feedbackData.value.entries
  return feedbackData.value.entries.filter(e => e.path === activeFeedbackPath.value)
})

const feedbackColumns: TableColumn<FeedbackEntry>[] = [
  {
    accessorKey: 'path',
    header: 'Path / Tool',
    cell: ({ row }) => {
      const path = row.original.path
      const meta = getToolMeta(path)
      return h('div', { class: 'flex items-center gap-2.5' }, [
        h('div', { class: `w-8 h-8 rounded-lg bg-${meta.color}-500/10 flex items-center justify-center` }, [
          h('span', { class: `${meta.icon} w-4 h-4 text-${meta.color}-500` }),
        ]),
        h('span', { class: 'font-medium text-[var(--ui-text-highlighted)] text-sm' }, meta.name),
      ])
    },
  },
  {
    accessorKey: 'thumb',
    header: 'Thumb',
    cell: ({ row }) => {
      const thumb = row.original.thumb
      if (!thumb)
        return h('span', { class: 'text-[var(--ui-text-dimmed)]' }, '—')
      const icon = thumb === 'up' ? 'i-carbon-thumbs-up-filled' : 'i-carbon-thumbs-down-filled'
      const color = thumb === 'up' ? 'text-emerald-500' : 'text-red-500'
      return h('span', { class: `${icon} w-4 h-4 ${color}` })
    },
  },
  {
    accessorKey: 'comment',
    header: 'Comment',
    cell: ({ row }) => {
      const comment = row.original.comment
      if (!comment)
        return h('span', { class: 'text-[var(--ui-text-dimmed)]' }, '—')
      return h('span', { class: 'text-sm text-[var(--ui-text-muted)] max-w-xs truncate block' }, comment)
    },
  },
  {
    accessorKey: 'userId',
    header: 'User',
    cell: ({ row }) => {
      const userId = row.original.userId
      if (!userId) {
        return h('span', { class: 'inline-flex items-center gap-1.5 text-xs text-[var(--ui-text-dimmed)]' }, [
          h('span', { class: 'w-1.5 h-1.5 rounded-full bg-gray-400' }),
          'Anonymous',
        ])
      }
      return h('span', { class: 'inline-flex items-center gap-1.5 text-xs' }, [
        h('span', { class: 'w-1.5 h-1.5 rounded-full bg-emerald-500' }),
        h('code', { class: 'font-mono text-[var(--ui-primary)]' }, userId.slice(0, 8)),
      ])
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Time',
    cell: ({ row }) => {
      const raw = row.original.createdAt
      const date = raw instanceof Date ? raw : new Date(typeof raw === 'number' ? raw * 1000 : raw)
      if (Number.isNaN(date.getTime()))
        return h('span', { class: 'text-[var(--ui-text-dimmed)]' }, '—')
      return h('time', {
        class: 'text-sm font-mono text-[var(--ui-text-muted)] tabular-nums',
        datetime: date.toISOString(),
      }, formatRelativeTime(date))
    },
  },
]

const statCards = computed(() => [
  {
    label: 'Total Events',
    value: analytics.value?.totalEvents ?? 0,
    icon: 'i-carbon-activity',
    color: 'blue',
  },
  {
    label: 'Unique Sessions',
    value: analytics.value?.uniqueSessions ?? 0,
    icon: 'i-carbon-user-multiple',
    color: 'violet',
  },
  {
    label: 'Active Tools',
    value: analytics.value?.topTools?.length ?? 0,
    icon: 'i-carbon-tool-box',
    color: 'emerald',
  },
  {
    label: 'Error Rate',
    value: analytics.value?.errorRate ?? 0,
    icon: 'i-carbon-warning-alt',
    color: (analytics.value?.errorRate ?? 0) > 5 ? 'red' : 'emerald',
    isPercent: true,
  },
])
</script>

<template>
  <div class="min-h-screen bg-[var(--ui-bg)]">
    <!-- Header -->
    <header class="sticky top-0 z-50 border-b border-[var(--ui-border)] bg-[var(--ui-bg-elevated)]/80 backdrop-blur-xl">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/"
            class="w-9 h-9 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)] flex items-center justify-center text-[var(--ui-text-muted)] hover:text-[var(--ui-text-highlighted)] hover:border-[var(--ui-border-hover)] transition-all"
          >
            <UIcon name="i-carbon-arrow-left" class="w-4 h-4" />
          </NuxtLink>
          <div>
            <h1 class="text-base font-semibold text-[var(--ui-text-highlighted)]">
              Admin Dashboard
            </h1>
            <p class="text-xs text-[var(--ui-text-dimmed)]">
              Analytics & Tool Usage
            </p>
          </div>
        </div>
        <div v-if="loggedIn" class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span class="text-sm text-[var(--ui-text-muted)]">{{ user?.email }}</span>
          </div>
          <UButton variant="ghost" size="sm" color="neutral" @click="clear">
            Sign out
          </UButton>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-6 py-8">
      <!-- Auth States -->
      <div v-if="!loggedIn" class="flex flex-col items-center justify-center py-24">
        <div class="w-20 h-20 rounded-2xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] flex items-center justify-center mb-6">
          <UIcon name="i-carbon-locked" class="w-8 h-8 text-[var(--ui-text-dimmed)]" />
        </div>
        <h2 class="text-xl font-semibold text-[var(--ui-text-highlighted)] mb-2">
          Authentication Required
        </h2>
        <p class="text-[var(--ui-text-muted)] mb-8 text-center max-w-sm">
          Sign in with your GitHub account to access the admin dashboard.
        </p>
        <UButton to="/auth/github" external size="lg" icon="i-carbon-logo-github">
          Continue with GitHub
        </UButton>
      </div>

      <div v-else-if="!isAdmin" class="flex flex-col items-center justify-center py-24">
        <div class="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
          <UIcon name="i-carbon-warning" class="w-8 h-8 text-amber-500" />
        </div>
        <h2 class="text-xl font-semibold text-[var(--ui-text-highlighted)] mb-2">
          Access Denied
        </h2>
        <p class="text-[var(--ui-text-muted)] mb-8 text-center max-w-sm">
          <code class="text-sm bg-[var(--ui-bg)] px-2 py-0.5 rounded">{{ user?.email }}</code>
          is not authorized to access this dashboard.
        </p>
        <UButton variant="soft" color="neutral" @click="clear">
          Sign out
        </UButton>
      </div>

      <!-- Dashboard Content -->
      <div v-else class="space-y-10">
        <!-- Section: Analytics Overview -->
        <section>
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                Analytics Overview
              </h2>
              <p class="text-sm text-[var(--ui-text-dimmed)]">
                Real-time tool usage metrics
              </p>
            </div>
            <div class="flex items-center gap-2">
              <USelect
                v-model="timeRange"
                :items="timeRanges"
                value-key="value"
                size="sm"
                class="w-32"
              />
              <UButton
                variant="ghost"
                size="sm"
                color="neutral"
                icon="i-carbon-renew"
                :loading="status === 'pending'"
                @click="refresh"
              />
            </div>
          </div>

          <!-- Stat Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div
              v-for="stat in statCards"
              :key="stat.label"
              class="group relative p-5 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] hover:border-[var(--ui-border-hover)] transition-all"
            >
              <div class="flex items-start justify-between mb-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="`bg-${stat.color}-500/10`"
                >
                  <UIcon :name="stat.icon" class="w-5 h-5" :class="`text-${stat.color}-500`" />
                </div>
                <div v-if="status === 'pending'" class="w-12 h-4 rounded bg-[var(--ui-bg)] animate-pulse" />
              </div>
              <p class="text-sm text-[var(--ui-text-muted)] mb-1">
                {{ stat.label }}
              </p>
              <p class="text-2xl font-bold font-mono tabular-nums text-[var(--ui-text-highlighted)]">
                <template v-if="status !== 'pending'">
                  {{ stat.isPercent ? `${stat.value.toFixed(1)}%` : stat.value.toLocaleString() }}
                </template>
                <span v-else class="opacity-30">--</span>
              </p>
            </div>
          </div>

          <!-- Tool Usage with Progress Bars -->
          <div class="grid lg:grid-cols-2 gap-6">
            <div class="p-6 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
              <h3 class="text-sm font-medium text-[var(--ui-text-muted)] uppercase tracking-wider mb-5">
                Tool Usage
              </h3>
              <div v-if="analytics?.topTools?.length" class="space-y-4">
                <div v-for="tool in analytics.topTools" :key="tool.tool">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="w-7 h-7 rounded-md flex items-center justify-center"
                        :class="`bg-${getToolMeta(tool.tool).color}-500/10`"
                      >
                        <UIcon
                          :name="getToolMeta(tool.tool).icon"
                          class="w-3.5 h-3.5"
                          :class="`text-${getToolMeta(tool.tool).color}-500`"
                        />
                      </div>
                      <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                        {{ getToolMeta(tool.tool).name }}
                      </span>
                    </div>
                    <span class="text-sm font-mono tabular-nums text-[var(--ui-text-muted)]">
                      {{ tool.count.toLocaleString() }}
                    </span>
                  </div>
                  <div class="h-1.5 rounded-full bg-[var(--ui-bg)] overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="`bg-${getToolMeta(tool.tool).color}-500`"
                      :style="{ width: `${(tool.count / maxToolCount) * 100}%` }"
                    />
                  </div>
                </div>
              </div>
              <div v-else-if="status === 'pending'" class="space-y-4">
                <div v-for="i in 3" :key="i" class="space-y-2">
                  <div class="flex justify-between">
                    <div class="w-32 h-4 rounded bg-[var(--ui-bg)] animate-pulse" />
                    <div class="w-8 h-4 rounded bg-[var(--ui-bg)] animate-pulse" />
                  </div>
                  <div class="h-1.5 rounded-full bg-[var(--ui-bg)]" />
                </div>
              </div>
              <p v-else class="text-sm text-[var(--ui-text-dimmed)] text-center py-8">
                No tool usage data yet
              </p>
            </div>

            <div class="p-6 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
              <h3 class="text-sm font-medium text-[var(--ui-text-muted)] uppercase tracking-wider mb-5">
                Action Breakdown
              </h3>
              <div v-if="analytics?.topActions?.length" class="space-y-3">
                <div
                  v-for="action in analytics.topActions"
                  :key="action.action"
                  class="flex items-center justify-between py-2 border-b border-[var(--ui-border)] last:border-0"
                >
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-[var(--ui-primary)]" />
                    <span class="text-sm text-[var(--ui-text-highlighted)] capitalize">
                      {{ action.action }}
                    </span>
                  </div>
                  <span class="text-sm font-mono tabular-nums text-[var(--ui-text-muted)]">
                    {{ action.count.toLocaleString() }}
                  </span>
                </div>
              </div>
              <div v-else-if="status === 'pending'" class="space-y-3">
                <div v-for="i in 3" :key="i" class="flex justify-between py-2 border-b border-[var(--ui-border)] last:border-0">
                  <div class="w-24 h-4 rounded bg-[var(--ui-bg)] animate-pulse" />
                  <div class="w-12 h-4 rounded bg-[var(--ui-bg)] animate-pulse" />
                </div>
              </div>
              <p v-else class="text-sm text-[var(--ui-text-dimmed)] text-center py-8">
                No action data yet
              </p>
            </div>
          </div>
        </section>

        <!-- Section: Feedback -->
        <section>
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                User Feedback
              </h2>
              <p class="text-sm text-[var(--ui-text-dimmed)]">
                Thumbs &amp; comments from D1
              </p>
            </div>
            <div class="text-sm font-mono text-[var(--ui-text-dimmed)]">
              {{ feedbackData?.total ?? 0 }} total
            </div>
          </div>

          <!-- Feedback Summary Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="p-4 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
              <p class="text-sm text-[var(--ui-text-muted)] mb-1">
                Total
              </p>
              <p class="text-xl font-bold font-mono tabular-nums text-[var(--ui-text-highlighted)]">
                {{ feedbackData?.total ?? 0 }}
              </p>
            </div>
            <div class="p-4 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
              <p class="text-sm text-[var(--ui-text-muted)] mb-1">
                Thumbs Up
              </p>
              <p class="text-xl font-bold font-mono tabular-nums text-emerald-500">
                {{ feedbackData?.stats?.up ?? 0 }}
              </p>
            </div>
            <div class="p-4 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
              <p class="text-sm text-[var(--ui-text-muted)] mb-1">
                Thumbs Down
              </p>
              <p class="text-xl font-bold font-mono tabular-nums text-red-500">
                {{ feedbackData?.stats?.down ?? 0 }}
              </p>
            </div>
            <div class="p-4 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
              <p class="text-sm text-[var(--ui-text-muted)] mb-1">
                Comments
              </p>
              <p class="text-xl font-bold font-mono tabular-nums text-[var(--ui-text-highlighted)]">
                {{ feedbackData?.commentCount ?? 0 }}
              </p>
            </div>
          </div>

          <!-- Filter Pills -->
          <div class="flex flex-wrap gap-2 mb-5">
            <button
              v-for="fp in feedbackPaths"
              :key="fp.value"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
              :class="[
                activeFeedbackPath === fp.value
                  ? 'bg-[var(--ui-primary)] text-white shadow-lg shadow-[var(--ui-primary)]/25'
                  : 'bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)] hover:text-[var(--ui-text-highlighted)] border border-[var(--ui-border)] hover:border-[var(--ui-border-hover)]',
              ]"
              @click="activeFeedbackPath = fp.value"
            >
              <span>{{ fp.label }}</span>
              <span
                v-if="feedbackData?.byPath"
                class="ml-0.5 px-2 py-0.5 rounded-md text-xs font-mono"
                :class="activeFeedbackPath === fp.value ? 'bg-white/20' : 'bg-[var(--ui-bg)]'"
              >
                {{ fp.value === 'all' ? feedbackData.total : (feedbackData.byPath[fp.value] || 0) }}
              </span>
            </button>
          </div>

          <!-- Table -->
          <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] overflow-hidden mb-10">
            <UTable
              v-if="feedbackStatus !== 'pending' && filteredFeedback.length"
              :data="filteredFeedback"
              :columns="feedbackColumns"
            />

            <div v-else-if="feedbackStatus === 'pending'" class="p-12">
              <div class="flex flex-col items-center">
                <div class="w-12 h-12 rounded-xl bg-[var(--ui-bg)] flex items-center justify-center mb-4">
                  <UIcon name="i-carbon-renew" class="w-5 h-5 text-[var(--ui-text-dimmed)] animate-spin" />
                </div>
                <p class="text-sm text-[var(--ui-text-muted)]">
                  Loading feedback...
                </p>
              </div>
            </div>

            <div v-else class="p-12">
              <div class="flex flex-col items-center">
                <div class="w-12 h-12 rounded-xl bg-[var(--ui-bg)] flex items-center justify-center mb-4">
                  <UIcon name="i-carbon-chat" class="w-5 h-5 text-[var(--ui-text-dimmed)]" />
                </div>
                <p class="text-sm font-medium text-[var(--ui-text-highlighted)] mb-1">
                  No feedback yet
                </p>
                <p class="text-xs text-[var(--ui-text-dimmed)]">
                  User feedback will appear here
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Section: Tool Lookups -->
        <section>
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                Recent Lookups
              </h2>
              <p class="text-sm text-[var(--ui-text-dimmed)]">
                Domain queries from D1 database
              </p>
            </div>
            <div class="text-sm font-mono text-[var(--ui-text-dimmed)]">
              {{ lookupData?.total ?? 0 }} total
            </div>
          </div>

          <!-- Filter Pills -->
          <div class="flex flex-wrap gap-2 mb-5">
            <button
              v-for="tool in lookupTools"
              :key="tool.value"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
              :class="[
                activeLookupTab === tool.value
                  ? 'bg-[var(--ui-primary)] text-white shadow-lg shadow-[var(--ui-primary)]/25'
                  : 'bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)] hover:text-[var(--ui-text-highlighted)] border border-[var(--ui-border)] hover:border-[var(--ui-border-hover)]',
              ]"
              @click="activeLookupTab = tool.value"
            >
              <UIcon :name="tool.icon" class="w-4 h-4" />
              <span>{{ tool.label }}</span>
              <span
                v-if="lookupData?.stats"
                class="ml-0.5 px-2 py-0.5 rounded-md text-xs font-mono"
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

            <div v-else-if="lookupStatus === 'pending'" class="p-12">
              <div class="flex flex-col items-center">
                <div class="w-12 h-12 rounded-xl bg-[var(--ui-bg)] flex items-center justify-center mb-4">
                  <UIcon name="i-carbon-renew" class="w-5 h-5 text-[var(--ui-text-dimmed)] animate-spin" />
                </div>
                <p class="text-sm text-[var(--ui-text-muted)]">
                  Loading lookups...
                </p>
              </div>
            </div>

            <div v-else class="p-12">
              <div class="flex flex-col items-center">
                <div class="w-12 h-12 rounded-xl bg-[var(--ui-bg)] flex items-center justify-center mb-4">
                  <UIcon name="i-carbon-data-table" class="w-5 h-5 text-[var(--ui-text-dimmed)]" />
                </div>
                <p class="text-sm font-medium text-[var(--ui-text-highlighted)] mb-1">
                  No lookups found
                </p>
                <p class="text-xs text-[var(--ui-text-dimmed)]">
                  Tool lookup data will appear here
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
