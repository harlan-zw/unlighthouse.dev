import { z } from 'zod'

const FEEDBACK_HTML_RE = /<\/?[a-z][\s\S]*>/i
const FEEDBACK_URL_RE = /\b(?:https?:\/\/|www\.)\S+/gi

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
  path: z.string().optional(),
  toolId: z.string().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
})

export const CommentFeedbackSchema = z.object({
  comment: FeedbackCommentSchema,
  path: z.string().optional(),
  toolId: z.string().optional(),
  thumbFeedbackId: z.string().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
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
