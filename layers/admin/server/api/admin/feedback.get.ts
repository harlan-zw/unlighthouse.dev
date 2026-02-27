import { desc, sql } from 'drizzle-orm'
import { feedback } from '../../../../../server/database/schema'
import { useDB } from '../../../../../server/utils/db'
import { requireAdminAuth } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdminAuth(event)
  const db = useDB(event)

  const [entries, thumbStats, pathStats] = await Promise.all([
    db.select().from(feedback).orderBy(desc(feedback.createdAt)).limit(100),
    db.select({
      thumb: feedback.thumb,
      count: sql<number>`count(*)`.as('count'),
    }).from(feedback).where(sql`${feedback.thumb} IS NOT NULL`).groupBy(feedback.thumb),
    db.select({
      path: feedback.path,
      count: sql<number>`count(*)`.as('count'),
    }).from(feedback).groupBy(feedback.path),
  ])

  const stats = { up: 0, down: 0 }
  for (const row of thumbStats) {
    if (row.thumb === 'up' || row.thumb === 'down')
      stats[row.thumb] = row.count
  }

  const commentCount = entries.filter(e => e.comment).length
  const byPath = Object.fromEntries(pathStats.map(s => [s.path, s.count])) as Record<string, number>

  return {
    entries,
    stats,
    byPath,
    commentCount,
    total: stats.up + stats.down + commentCount,
  }
})
