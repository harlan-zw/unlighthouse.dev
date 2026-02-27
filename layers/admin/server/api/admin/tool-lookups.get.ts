import { desc, sql } from 'drizzle-orm'
import { toolLookups } from '../../../../../server/database/schema'
import { useDB } from '../../../../../server/utils/db'
import { requireAdminAuth } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdminAuth(event)
  const db = useDB(event)

  const [lookups, stats, topDomains, sessionCounts] = await Promise.all([
    db.select().from(toolLookups).orderBy(desc(toolLookups.createdAt)).limit(100),
    db.select({
      tool: toolLookups.tool,
      count: sql<number>`count(*)`.as('count'),
    }).from(toolLookups).groupBy(toolLookups.tool),
    db.select({
      query: toolLookups.query,
      count: sql<number>`count(*)`.as('count'),
    }).from(toolLookups).groupBy(toolLookups.query).orderBy(sql`count(*) DESC`).limit(20),
    db.all<{ cnt: number }>(sql`
      SELECT count(*) as cnt FROM (
        SELECT ${toolLookups.sessionId}, count(*) as lookup_count
        FROM ${toolLookups}
        WHERE ${toolLookups.sessionId} IS NOT NULL
        GROUP BY ${toolLookups.sessionId}
        HAVING lookup_count >= 2
      )
    `),
  ])

  const statsByTool = Object.fromEntries(
    stats.map(s => [s.tool, s.count]),
  ) as Record<string, number>

  const totalSessions = await db.all<{ cnt: number }>(sql`
    SELECT count(DISTINCT ${toolLookups.sessionId}) as cnt
    FROM ${toolLookups}
    WHERE ${toolLookups.sessionId} IS NOT NULL
  `)

  const total = totalSessions[0]?.cnt ?? 0
  const repeat = sessionCounts[0]?.cnt ?? 0

  return {
    lookups,
    stats: statsByTool,
    total: lookups.length,
    topDomains,
    engagement: { repeat, single: total - repeat },
  }
})
