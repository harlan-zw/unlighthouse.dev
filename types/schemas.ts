import { z } from 'zod'

const FEEDBACK_HTML_RE = /<\/?[a-z][\s\S]*>/i
const FEEDBACK_URL_RE = /\b(?:https?:\/\/|www\.)\S+/gi

const FEEDBACK_CONTEXT_MAX_KEYS = 10
const FEEDBACK_CONTEXT_MAX_KEY_LENGTH = 40
const FEEDBACK_CONTEXT_MAX_VALUE_LENGTH = 300
const FEEDBACK_CONTEXT_MAX_ARRAY_LENGTH = 20

/**
 * Tools send pasted URLs and other metadata that can legitimately exceed the
 * stored length cap, so over-long values are truncated instead of rejected.
 */
function truncateContextValue(value: string): string {
  return value.length > FEEDBACK_CONTEXT_MAX_VALUE_LENGTH
    ? value.slice(0, FEEDBACK_CONTEXT_MAX_VALUE_LENGTH)
    : value
}

const FeedbackContextValueSchema = z.union([
  z.string().transform(truncateContextValue),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.union([
    z.string().transform(truncateContextValue),
    z.number(),
    z.boolean(),
    z.null(),
  ])).max(FEEDBACK_CONTEXT_MAX_ARRAY_LENGTH),
])

const FeedbackContextSchema = z.record(z.string().max(FEEDBACK_CONTEXT_MAX_KEY_LENGTH), FeedbackContextValueSchema)
  .refine(
    context => Object.keys(context).length <= FEEDBACK_CONTEXT_MAX_KEYS,
    `Must contain at most ${FEEDBACK_CONTEXT_MAX_KEYS} fields`,
  )

const FeedbackCommentSchema = z.string()
  .trim()
  .min(3, 'Must be at least 3 characters')
  .max(1000, 'Must be 1000 characters or fewer')
  .refine(comment => !FEEDBACK_HTML_RE.test(comment), 'HTML is not allowed')
  .refine(comment => (comment.match(FEEDBACK_URL_RE)?.length ?? 0) <= 1, 'Please include at most one link')

export interface ThumbsFeedbackResponse {
  feedbackId?: string
  thumbs: 'up' | 'down'
  stats: {
    up: number
    down: number
  }
}

export interface CommentFeedbackResponse {
  feedbackId?: string
  linkedFeedbackId?: string
}

export const ThumbsFeedbackSchema = z.object({
  thumbs: z.enum(['up', 'down']),
  path: z.string().max(500).optional(),
  toolId: z.string().max(100).optional(),
  context: FeedbackContextSchema.optional(),
})

export const CommentFeedbackSchema = z.object({
  comment: FeedbackCommentSchema,
  path: z.string().max(500).optional(),
  toolId: z.string().max(100).optional(),
  thumbFeedbackId: z.string().max(100).optional(),
  context: FeedbackContextSchema.optional(),
})

export type CommentFeedbackSchemaOutput = z.output<typeof CommentFeedbackSchema>

export const ProEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export type ProEmailSchemaOutput = z.output<typeof ProEmailSchema>

export const ProWaitlistFeedbackSchema = z.object({
  comment: z.string().min(3, 'Must be at least 3 characters'),
})

export type ProWaitlistFeedbackSchemaOutput = z.output<typeof ProWaitlistFeedbackSchema>
