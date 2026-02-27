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
  session_id: string | null
  tool: 'pagespeed-insights' | 'lcp' | 'cls' | 'inp'
  query: string
  strategy: 'mobile' | 'desktop' | null
  created_at: number | string | Date
}

interface LookupResponse {
  lookups: ToolLookup[]
  stats: Record<string, number>
  total: number
  topDomains: { query: string, count: number }[]
  engagement: { repeat: number, single: number }
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
    accessorKey: 'session_id',
    header: 'Session',
    cell: ({ row }) => {
      const sessionId = row.original.session_id
      const userId = row.original.user_id
      if (!sessionId && !userId)
        return h('span', { class: 'text-[var(--ui-text-dimmed)]' }, '—')
      return h('span', { class: 'inline-flex items-center gap-1.5 text-xs' }, [
        h('span', { class: `w-1.5 h-1.5 rounded-full ${userId ? 'bg-emerald-500' : 'bg-gray-400'}` }),
        h('code', { class: 'font-mono text-[var(--ui-text-muted)]' }, sessionId || userId!.slice(0, 8)),
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
  sessionId: string | null
  createdAt: number | string | Date
}

interface FeedbackResponse {
  entries: FeedbackEntry[]
  stats: { up: number, down: number }
  byPath: Record<string, number>
  commentCount: number
  total: number
  thumbsByTool: { path: string, up: number, down: number, total: number }[]
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
    accessorKey: 'sessionId',
    header: 'Session',
    cell: ({ row }) => {
      const sessionId = row.original.sessionId
      const userId = row.original.userId
      if (!sessionId && !userId)
        return h('span', { class: 'text-[var(--ui-text-dimmed)]' }, '—')
      return h('span', { class: 'inline-flex items-center gap-1.5 text-xs' }, [
        h('span', { class: `w-1.5 h-1.5 rounded-full ${userId ? 'bg-emerald-500' : 'bg-gray-400'}` }),
        h('code', { class: 'font-mono text-[var(--ui-text-muted)]' }, sessionId || userId!.slice(0, 8)),
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

// Insights (journeys + daily trends)
interface InsightsResponse {
  journeys: {
    sessionId: string
    lookups: { sessionId: string | null, tool: string, query: string, createdAt: number | string | Date }[]
    feedback: { sessionId: string | null, path: string, thumb: string | null, createdAt: number | string | Date }[]
    toolCount: number
  }[]
  dailyTrends: { day: string, count: number }[]
}

const { data: insightsData, status: insightsStatus } = useFetch<InsightsResponse>('/api/admin/insights')

// Feedback rate per tool — combines lookupData.stats with feedbackData.thumbsByTool
const feedbackRateByTool = computed(() => {
  if (!lookupData.value?.stats || !feedbackData.value?.thumbsByTool)
    return []
  const lookupStats = lookupData.value.stats
  return feedbackData.value.thumbsByTool.map((t) => {
    const lookups = lookupStats[t.path] ?? 0
    const rate = lookups > 0 ? ((t.total / lookups) * 100) : 0
    return { ...t, lookups, rate: Math.round(rate * 10) / 10, meta: getToolMeta(t.path) }
  }).sort((a, b) => b.total - a.total)
})

// Engagement computed
const engagementTotal = computed(() => {
  if (!lookupData.value?.engagement)
    return 0
  return lookupData.value.engagement.repeat + lookupData.value.engagement.single
})

// Daily trends
const maxDailyCount = computed(() => {
  if (!insightsData.value?.dailyTrends?.length)
    return 1
  return Math.max(...insightsData.value.dailyTrends.map(d => d.count))
})

// Top domains
const topDomains = computed(() => lookupData.value?.topDomains?.slice(0, 15) ?? [])
const maxDomainCount = computed(() => topDomains.value[0]?.count ?? 1)

// Session journeys
const expandedJourneys = ref(new Set<string>())
function toggleJourney(id: string) {
  if (expandedJourneys.value.has(id))
    expandedJourneys.value.delete(id)
  else
    expandedJourneys.value.add(id)
}
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

        <!-- Section: Tool Insights -->
        <section>
          <div class="mb-6">
            <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Tool Insights
            </h2>
            <p class="text-sm text-[var(--ui-text-dimmed)]">
              Feedback sentiment and session engagement
            </p>
          </div>

          <div class="grid lg:grid-cols-2 gap-6">
            <!-- Feedback Sentiment Per Tool -->
            <div class="p-6 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
              <h3 class="text-sm font-medium text-[var(--ui-text-muted)] uppercase tracking-wider mb-5">
                Feedback Sentiment Per Tool
              </h3>
              <div v-if="feedbackRateByTool.length" class="space-y-5">
                <div v-for="tool in feedbackRateByTool" :key="tool.path">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="w-7 h-7 rounded-md flex items-center justify-center"
                        :class="`bg-${tool.meta.color}-500/10`"
                      >
                        <UIcon
                          :name="tool.meta.icon"
                          class="w-3.5 h-3.5"
                          :class="`text-${tool.meta.color}-500`"
                        />
                      </div>
                      <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">{{ tool.meta.name }}</span>
                    </div>
                    <div class="flex items-center gap-3 text-xs font-mono tabular-nums text-[var(--ui-text-muted)]">
                      <span>{{ tool.lookups }} lookups</span>
                      <span>{{ tool.total }} feedback</span>
                      <span class="text-[var(--ui-text-highlighted)]">{{ tool.rate }}%</span>
                    </div>
                  </div>
                  <!-- Stacked bar -->
                  <div class="h-2 rounded-full bg-[var(--ui-bg)] overflow-hidden flex">
                    <div
                      v-if="tool.total > 0"
                      class="h-full bg-emerald-500 transition-all duration-500"
                      :style="{ width: `${(tool.up / tool.total) * 100}%` }"
                    />
                    <div
                      v-if="tool.total > 0"
                      class="h-full bg-red-500 transition-all duration-500"
                      :style="{ width: `${(tool.down / tool.total) * 100}%` }"
                    />
                  </div>
                  <div class="flex justify-between mt-1 text-xs text-[var(--ui-text-dimmed)]">
                    <span class="text-emerald-500">{{ tool.up }} up</span>
                    <span class="text-red-500">{{ tool.down }} down</span>
                  </div>
                </div>
              </div>
              <p v-else class="text-sm text-[var(--ui-text-dimmed)] text-center py-8">
                No feedback data yet
              </p>
            </div>

            <!-- Engagement -->
            <div class="p-6 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
              <h3 class="text-sm font-medium text-[var(--ui-text-muted)] uppercase tracking-wider mb-5">
                Session Engagement
              </h3>
              <div v-if="lookupData?.engagement && engagementTotal > 0">
                <div class="grid grid-cols-2 gap-4 mb-6">
                  <div class="p-4 rounded-lg bg-[var(--ui-bg)]">
                    <p class="text-sm text-[var(--ui-text-muted)] mb-1">
                      Repeat Sessions
                    </p>
                    <p class="text-2xl font-bold font-mono tabular-nums text-emerald-500">
                      {{ lookupData.engagement.repeat }}
                    </p>
                    <p class="text-xs text-[var(--ui-text-dimmed)] mt-1">
                      {{ ((lookupData.engagement.repeat / engagementTotal) * 100).toFixed(1) }}% of sessions
                    </p>
                  </div>
                  <div class="p-4 rounded-lg bg-[var(--ui-bg)]">
                    <p class="text-sm text-[var(--ui-text-muted)] mb-1">
                      One-and-Done
                    </p>
                    <p class="text-2xl font-bold font-mono tabular-nums text-[var(--ui-text-highlighted)]">
                      {{ lookupData.engagement.single }}
                    </p>
                    <p class="text-xs text-[var(--ui-text-dimmed)] mt-1">
                      {{ ((lookupData.engagement.single / engagementTotal) * 100).toFixed(1) }}% of sessions
                    </p>
                  </div>
                </div>
                <!-- Visual bar -->
                <div class="h-3 rounded-full bg-[var(--ui-bg)] overflow-hidden flex">
                  <div
                    class="h-full bg-emerald-500 transition-all duration-500"
                    :style="{ width: `${(lookupData.engagement.repeat / engagementTotal) * 100}%` }"
                  />
                  <div
                    class="h-full bg-gray-400 transition-all duration-500"
                    :style="{ width: `${(lookupData.engagement.single / engagementTotal) * 100}%` }"
                  />
                </div>
                <div class="flex justify-between mt-2 text-xs text-[var(--ui-text-dimmed)]">
                  <span class="text-emerald-500">Repeat (2+ lookups)</span>
                  <span>Single lookup</span>
                </div>
              </div>
              <p v-else class="text-sm text-[var(--ui-text-dimmed)] text-center py-8">
                No session data yet
              </p>
            </div>
          </div>
        </section>

        <!-- Section: Daily Trends -->
        <section>
          <div class="mb-6">
            <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Daily Trends
            </h2>
            <p class="text-sm text-[var(--ui-text-dimmed)]">
              Lookups per day over the last 30 days
            </p>
          </div>

          <div class="p-6 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
            <div v-if="insightsData?.dailyTrends?.length" class="flex items-end gap-1" style="height: 160px;">
              <div
                v-for="day in insightsData.dailyTrends"
                :key="day.day"
                class="group relative flex-1 flex flex-col items-center justify-end h-full"
              >
                <div
                  class="w-full rounded-t bg-[var(--ui-primary)] transition-all duration-300 hover:opacity-80 min-h-[2px]"
                  :style="{ height: `${Math.max((day.count / maxDailyCount) * 100, 1)}%` }"
                />
                <!-- Tooltip -->
                <div class="absolute bottom-full mb-2 hidden group-hover:block z-10">
                  <div class="bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-lg px-3 py-2 shadow-xl text-center whitespace-nowrap">
                    <p class="text-xs font-mono text-[var(--ui-text-highlighted)]">
                      {{ day.count }}
                    </p>
                    <p class="text-xs text-[var(--ui-text-dimmed)]">
                      {{ day.day }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="insightsStatus === 'pending'" class="flex items-end gap-1" style="height: 160px;">
              <div v-for="i in 30" :key="i" class="flex-1 bg-[var(--ui-bg)] rounded-t animate-pulse" :style="{ height: `${20 + Math.random() * 60}%` }" />
            </div>
            <p v-else class="text-sm text-[var(--ui-text-dimmed)] text-center py-8">
              No trend data yet
            </p>
            <!-- X-axis labels -->
            <div v-if="insightsData?.dailyTrends?.length" class="flex justify-between mt-2 text-xs text-[var(--ui-text-dimmed)] font-mono">
              <span>{{ insightsData.dailyTrends[0]?.day }}</span>
              <span>{{ insightsData.dailyTrends[insightsData.dailyTrends.length - 1]?.day }}</span>
            </div>
          </div>
        </section>

        <!-- Section: Top Domains -->
        <section>
          <div class="mb-6">
            <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Top Domains
            </h2>
            <p class="text-sm text-[var(--ui-text-dimmed)]">
              Most queried domains across all tools
            </p>
          </div>

          <div class="p-6 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
            <div v-if="topDomains.length" class="space-y-3">
              <div v-for="(domain, i) in topDomains" :key="domain.query" class="flex items-center gap-4">
                <span class="w-6 text-right text-xs font-mono tabular-nums text-[var(--ui-text-dimmed)]">{{ i + 1 }}</span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <code class="text-sm font-mono text-[var(--ui-text-highlighted)] truncate">{{ domain.query }}</code>
                    <span class="text-xs font-mono tabular-nums text-[var(--ui-text-muted)] ml-3 shrink-0">{{ domain.count }}</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-[var(--ui-bg)] overflow-hidden">
                    <div
                      class="h-full rounded-full bg-[var(--ui-primary)] transition-all duration-500"
                      :style="{ width: `${(domain.count / maxDomainCount) * 100}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-[var(--ui-text-dimmed)] text-center py-8">
              No domain data yet
            </p>
          </div>
        </section>

        <!-- Section: Session Journeys -->
        <section>
          <div class="mb-6">
            <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
              Session Journeys
            </h2>
            <p class="text-sm text-[var(--ui-text-dimmed)]">
              Tool usage patterns per session
            </p>
          </div>

          <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] overflow-hidden">
            <div v-if="insightsData?.journeys?.length" class="divide-y divide-[var(--ui-border)]">
              <div v-for="journey in insightsData.journeys" :key="journey.sessionId">
                <button
                  class="w-full px-5 py-4 flex items-center gap-4 hover:bg-[var(--ui-bg)] transition-colors text-left"
                  @click="toggleJourney(journey.sessionId)"
                >
                  <UIcon
                    name="i-carbon-chevron-right"
                    class="w-4 h-4 text-[var(--ui-text-dimmed)] transition-transform shrink-0"
                    :class="{ 'rotate-90': expandedJourneys.has(journey.sessionId) }"
                  />
                  <code class="text-xs font-mono text-[var(--ui-text-muted)]">{{ journey.sessionId.slice(0, 12) }}</code>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono bg-[var(--ui-primary)]/10 text-[var(--ui-primary)]">
                    {{ journey.toolCount }} tools
                  </span>
                  <div class="flex items-center gap-1.5 flex-1 min-w-0">
                    <div
                      v-for="(lookup, li) in journey.lookups.slice(0, 8)"
                      :key="li"
                      class="w-6 h-6 rounded flex items-center justify-center shrink-0"
                      :class="`bg-${getToolMeta(lookup.tool).color}-500/10`"
                      :title="getToolMeta(lookup.tool).name"
                    >
                      <UIcon :name="getToolMeta(lookup.tool).icon" class="w-3 h-3" :class="`text-${getToolMeta(lookup.tool).color}-500`" />
                    </div>
                    <span v-if="journey.lookups.length > 8" class="text-xs text-[var(--ui-text-dimmed)]">+{{ journey.lookups.length - 8 }}</span>
                  </div>
                  <div v-if="journey.feedback.length" class="flex items-center gap-1 shrink-0">
                    <UIcon name="i-carbon-chat" class="w-3.5 h-3.5 text-[var(--ui-text-dimmed)]" />
                    <span class="text-xs text-[var(--ui-text-dimmed)]">{{ journey.feedback.length }}</span>
                  </div>
                </button>
                <!-- Expanded detail -->
                <div v-if="expandedJourneys.has(journey.sessionId)" class="px-5 pb-4 pl-13 space-y-2">
                  <div
                    v-for="(lookup, li) in journey.lookups"
                    :key="li"
                    class="flex items-center gap-3 text-sm"
                  >
                    <div
                      class="w-6 h-6 rounded flex items-center justify-center shrink-0"
                      :class="`bg-${getToolMeta(lookup.tool).color}-500/10`"
                    >
                      <UIcon :name="getToolMeta(lookup.tool).icon" class="w-3 h-3" :class="`text-${getToolMeta(lookup.tool).color}-500`" />
                    </div>
                    <span class="text-[var(--ui-text-highlighted)]">{{ getToolMeta(lookup.tool).name }}</span>
                    <code class="text-xs text-[var(--ui-text-muted)]">{{ lookup.query }}</code>
                    <span class="text-xs text-[var(--ui-text-dimmed)] ml-auto">{{ formatRelativeTime(new Date(typeof lookup.createdAt === 'number' ? lookup.createdAt * 1000 : lookup.createdAt)) }}</span>
                  </div>
                  <div
                    v-for="(fb, fi) in journey.feedback"
                    :key="`fb-${fi}`"
                    class="flex items-center gap-3 text-sm"
                  >
                    <div class="w-6 h-6 rounded flex items-center justify-center shrink-0 bg-gray-500/10">
                      <UIcon :name="fb.thumb === 'up' ? 'i-carbon-thumbs-up-filled' : fb.thumb === 'down' ? 'i-carbon-thumbs-down-filled' : 'i-carbon-chat'" class="w-3 h-3" :class="fb.thumb === 'up' ? 'text-emerald-500' : fb.thumb === 'down' ? 'text-red-500' : 'text-[var(--ui-text-dimmed)]'" />
                    </div>
                    <span class="text-[var(--ui-text-muted)]">Feedback on {{ getToolMeta(fb.path).name }}</span>
                    <span class="text-xs text-[var(--ui-text-dimmed)] ml-auto">{{ formatRelativeTime(new Date(typeof fb.createdAt === 'number' ? fb.createdAt * 1000 : fb.createdAt)) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="insightsStatus === 'pending'" class="p-12">
              <div class="flex flex-col items-center">
                <div class="w-12 h-12 rounded-xl bg-[var(--ui-bg)] flex items-center justify-center mb-4">
                  <UIcon name="i-carbon-renew" class="w-5 h-5 text-[var(--ui-text-dimmed)] animate-spin" />
                </div>
                <p class="text-sm text-[var(--ui-text-muted)]">
                  Loading journeys...
                </p>
              </div>
            </div>
            <div v-else class="p-12">
              <div class="flex flex-col items-center">
                <div class="w-12 h-12 rounded-xl bg-[var(--ui-bg)] flex items-center justify-center mb-4">
                  <UIcon name="i-carbon-flow" class="w-5 h-5 text-[var(--ui-text-dimmed)]" />
                </div>
                <p class="text-sm font-medium text-[var(--ui-text-highlighted)] mb-1">
                  No session journeys
                </p>
                <p class="text-xs text-[var(--ui-text-dimmed)]">
                  Session data will appear here
                </p>
              </div>
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
