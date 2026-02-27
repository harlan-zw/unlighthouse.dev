import type { ThumbsFeedbackResponse } from '~~/types/schemas'
import { eq, sql } from 'drizzle-orm'
import { getHeader } from 'h3'
import { parseURL } from 'ufo'
import { ThumbsFeedbackSchema } from '~~/types/schemas'
import { feedback } from '../database/schema'
import { useDB } from '../utils/db'

export default defineEventHandler<Promise<ThumbsFeedbackResponse>>(async (event) => {
  const { thumbs, toolId, context } = await readValidatedBody(event, ThumbsFeedbackSchema.parse)
  const referrer = parseURL(getHeader(event, 'Referer')).pathname
  const path = toolId || referrer || '/'

  if (!import.meta.dev) {
    const session = await getUserSession(event).catch(() => null)
    const db = useDB(event)

    db.insert(feedback).values({
      path,
      thumb: thumbs,
      metadata: { ...context, toolId },
      userId: (session?.user as Record<string, string> | undefined)?.id || null,
    }).catch(err => console.error('Failed to save thumbs feedback:', err))

    const rows = await db.select({
      thumb: feedback.thumb,
      count: sql<number>`count(*)`.as('count'),
    }).from(feedback).where(eq(feedback.path, path)).groupBy(feedback.thumb)

    const stats = { up: 0, down: 0 }
    for (const row of rows) {
      if (row.thumb === 'up' || row.thumb === 'down')
        stats[row.thumb] = row.count
    }

    return { thumbs, stats }
  }

  return { thumbs, stats: { up: thumbs === 'up' ? 1 : 0, down: thumbs === 'down' ? 1 : 0 } }
})
