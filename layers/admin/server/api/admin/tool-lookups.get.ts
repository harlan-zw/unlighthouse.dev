import { desc, sql } from 'drizzle-orm'
import { toolLookups } from '../../../../../server/database/schema'
import { useDB } from '../../../../../server/utils/db'
import { requireAdminAuth } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdminAuth(event)
  const db = useDB(event)

  const [lookups, stats] = await Promise.all([
    db.select().from(toolLookups).orderBy(desc(toolLookups.createdAt)).limit(100),
    db.select({
      tool: toolLookups.tool,
      count: sql<number>`count(*)`.as('count'),
    }).from(toolLookups).groupBy(toolLookups.tool),
  ])

  const statsByTool = Object.fromEntries(
    stats.map(s => [s.tool, s.count]),
  ) as Record<string, number>

  return {
    lookups,
    stats: statsByTool,
    total: lookups.length,
  }
})
