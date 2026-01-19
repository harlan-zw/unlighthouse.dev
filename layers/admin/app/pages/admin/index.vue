<script setup lang="ts">
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
      </div>
    </main>
  </div>
</template>
