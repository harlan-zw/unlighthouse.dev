import { requireAdminAuth } from '~~/layers/admin/server/utils/admin'
import { getTimeRangeFilter } from '~~/server/utils/analytics'

interface ToolAnalyticsSummary {
  totalEvents: number
  uniqueSessions: number
  topTools: { tool: string, count: number }[]
  topActions: { action: string, count: number }[]
  errorRate: number
}

export default defineEventHandler(async (event): Promise<ToolAnalyticsSummary> => {
  await requireAdminAuth(event)

  const query = getQuery(event)
  const range = (query.range as string) || '7d'
  const { value, unit } = getTimeRangeFilter(range)

  const config = useRuntimeConfig(event)
  const accountId = config.cloudflareAccountId
  const apiToken = config.cloudflareAnalyticsApiToken

  if (!accountId || !apiToken) {
    throw createError({
      statusCode: 500,
      message: `Missing cloudflare config: ${!accountId ? 'accountId' : ''} ${!apiToken ? 'apiToken' : ''}`.trim(),
    })
  }

  const sql = `
    SELECT
      blob2 as tool,
      blob3 as action,
      blob4 as session_id,
      blob5 as status,
      COUNT() as count
    FROM unlighthouse_tool_usage
    WHERE timestamp > NOW() - INTERVAL '${value}' ${unit}
      AND blob1 = 'tool'
    GROUP BY tool, action, session_id, status
  `

  const response = await $fetch<{ data: { tool: string, action: string, session_id: string, status: string, count: number }[], errors?: { code: number, message: string }[] }>(`https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'text/plain',
    },
    body: sql,
  }).catch((err) => {
    throw createError({
      statusCode: err.statusCode || 500,
      message: `Cloudflare API error: ${err.data?.errors?.[0]?.message || err.message}`,
    })
  })

  const rows = response.data || []

  const toolCounts = new Map<string, number>()
  const actionCounts = new Map<string, number>()
  const sessions = new Set<string>()
  let totalEvents = 0
  let errorCount = 0

  for (const row of rows) {
    const count = Number(row.count)
    totalEvents += count
    sessions.add(row.session_id)
    toolCounts.set(row.tool, (toolCounts.get(row.tool) || 0) + count)
    actionCounts.set(row.action, (actionCounts.get(row.action) || 0) + count)
    if (row.status === 'error')
      errorCount += count
  }

  return {
    totalEvents,
    uniqueSessions: sessions.size,
    topTools: Array.from(toolCounts.entries())
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count),
    topActions: Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count),
    errorRate: totalEvents > 0 ? (errorCount / totalEvents) * 100 : 0,
  }
})
