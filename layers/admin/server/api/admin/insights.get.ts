import { desc, sql } from 'drizzle-orm'
import { feedback, toolLookups } from '../../../../../server/database/schema'
import { useDB } from '../../../../../server/utils/db'
import { requireAdminAuth } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdminAuth(event)
  const db = useDB(event)

  const [recentLookups, recentFeedback, dailyTrendsRaw] = await Promise.all([
    db.select({
      sessionId: toolLookups.sessionId,
      tool: toolLookups.tool,
      query: toolLookups.query,
      createdAt: toolLookups.createdAt,
    }).from(toolLookups).where(sql`${toolLookups.sessionId} IS NOT NULL`).orderBy(desc(toolLookups.createdAt)).limit(500),
    db.select({
      sessionId: feedback.sessionId,
      path: feedback.path,
      thumb: feedback.thumb,
      createdAt: feedback.createdAt,
    }).from(feedback).where(sql`${feedback.sessionId} IS NOT NULL`).orderBy(desc(feedback.createdAt)).limit(200),
    db.all<{ day: string, count: number }>(sql`
      SELECT date(${toolLookups.createdAt}, 'unixepoch') as day, count(*) as count
      FROM ${toolLookups}
      WHERE ${toolLookups.createdAt} >= unixepoch('now', '-30 days')
      GROUP BY day
      ORDER BY day ASC
    `),
  ])

  // Group by sessionId in JS
  const sessionMap = new Map<string, { lookups: typeof recentLookups, feedback: typeof recentFeedback }>()
  for (const lookup of recentLookups) {
    if (!lookup.sessionId)
      continue
    if (!sessionMap.has(lookup.sessionId))
      sessionMap.set(lookup.sessionId, { lookups: [], feedback: [] })
    sessionMap.get(lookup.sessionId)!.lookups.push(lookup)
  }
  for (const fb of recentFeedback) {
    if (!fb.sessionId)
      continue
    if (!sessionMap.has(fb.sessionId))
      sessionMap.set(fb.sessionId, { lookups: [], feedback: [] })
    sessionMap.get(fb.sessionId)!.feedback.push(fb)
  }

  const journeys = [...sessionMap.entries()]
    .slice(0, 50)
    .map(([sessionId, data]) => ({
      sessionId,
      lookups: data.lookups,
      feedback: data.feedback,
      toolCount: new Set(data.lookups.map(l => l.tool)).size,
    }))

  return {
    journeys,
    dailyTrends: dailyTrendsRaw,
  }
})
