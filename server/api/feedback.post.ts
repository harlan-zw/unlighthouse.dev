import type { CommentFeedbackResponse } from '~~/types/schemas'
import { getHeader } from 'h3'
import { parseURL } from 'ufo'
import { CommentFeedbackSchema } from '~~/types/schemas'
import { feedback } from '../database/schema'
import { getDB } from '../utils/db'

export default defineEventHandler<Promise<CommentFeedbackResponse>>(async (event) => {
  const { comment, path: explicitPath, toolId, thumbFeedbackId, context } = await readValidatedBody(event, CommentFeedbackSchema.parse)
  const referrer = parseURL(getHeader(event, 'Referer')).pathname
  const path = toolId || explicitPath || referrer || '/'
  const feedbackId = crypto.randomUUID()

  if (!import.meta.dev) {
    const session = await getUserSession(event).catch((error) => {
      console.warn('[feedback] Failed to read the user session; recording anonymous feedback', error)
      return null
    })

    const db = getDB(event)
    await db.insert(feedback).values({
      id: feedbackId,
      path,
      comment,
      metadata: { ...context, toolId, thumbFeedbackId },
      userId: (session?.user as Record<string, string> | undefined)?.id || null,
      sessionId: getSessionId(event),
    }).catch((err) => {
      console.error('Failed to save comment feedback:', err)
      throw createError({ statusCode: 500, message: 'Failed to save feedback' })
    })
  }

  return { feedbackId, linkedFeedbackId: thumbFeedbackId }
})
