import { desc, sql } from 'drizzle-orm'
import { feedback } from '../../../../../server/database/schema'
import { useDB } from '../../../../../server/utils/db'
import { requireAdminAuth } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdminAuth(event)
  const db = useDB(event)

  const [entries, thumbStats, pathStats, thumbsByToolRaw] = await Promise.all([
    db.select().from(feedback).orderBy(desc(feedback.createdAt)).limit(100),
    db.select({
      thumb: feedback.thumb,
      count: sql<number>`count(*)`.as('count'),
    }).from(feedback).where(sql`${feedback.thumb} IS NOT NULL`).groupBy(feedback.thumb),
    db.select({
      path: feedback.path,
      count: sql<number>`count(*)`.as('count'),
    }).from(feedback).groupBy(feedback.path),
    db.select({
      path: feedback.path,
      thumb: feedback.thumb,
      count: sql<number>`count(*)`.as('count'),
    }).from(feedback).where(sql`${feedback.thumb} IS NOT NULL`).groupBy(feedback.path, feedback.thumb),
  ])

  const stats = { up: 0, down: 0 }
  for (const row of thumbStats) {
    if (row.thumb === 'up' || row.thumb === 'down')
      stats[row.thumb] = row.count
  }

  const commentCount = entries.filter(e => e.comment).length
  const byPath = Object.fromEntries(pathStats.map(s => [s.path, s.count])) as Record<string, number>

  // Aggregate thumbs by tool into { path, up, down, total }[]
  const thumbsMap = new Map<string, { up: number, down: number }>()
  for (const row of thumbsByToolRaw) {
    if (!thumbsMap.has(row.path))
      thumbsMap.set(row.path, { up: 0, down: 0 })
    const entry = thumbsMap.get(row.path)!
    if (row.thumb === 'up')
      entry.up = row.count
    else if (row.thumb === 'down')
      entry.down = row.count
  }
  const thumbsByTool = [...thumbsMap.entries()].map(([path, counts]) => ({
    path,
    up: counts.up,
    down: counts.down,
    total: counts.up + counts.down,
  }))

  return {
    entries,
    stats,
    byPath,
    commentCount,
    total: stats.up + stats.down + commentCount,
    thumbsByTool,
  }
})
