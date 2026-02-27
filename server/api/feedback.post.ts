import { getHeader } from 'h3'
import { parseURL } from 'ufo'
import { CommentFeedbackSchema } from '~~/types/schemas'
import { feedback } from '../database/schema'
import { useDB } from '../utils/db'

export default defineEventHandler(async (event) => {
  const { comment, toolId, context } = await readValidatedBody(event, CommentFeedbackSchema.parse)
  const referrer = parseURL(getHeader(event, 'Referer')).pathname
  const path = toolId || referrer || '/'

  if (!import.meta.dev) {
    const session = await getUserSession(event).catch(() => null)

    useDB(event).insert(feedback).values({
      path,
      comment,
      metadata: { ...context, toolId },
      userId: (session?.user as Record<string, string> | undefined)?.id || null,
      sessionId: getSessionId(event),
    }).catch(err => console.error('Failed to save comment feedback:', err))
  }

  return 'OK'
})
