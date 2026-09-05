import type { ToolId } from '../../shared/tool-catalog'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  githubId: integer('github_id').unique(),
  githubLogin: text('github_login'),
  githubEmail: text('github_email'),
  githubAvatarUrl: text('github_avatar_url'),
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const toolLookups = sqliteTable('tool_lookups', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  sessionId: text('session_id'),
  tool: text('tool').notNull().$type<ToolId>(),
  query: text('query').notNull(),
  strategy: text('strategy', { enum: ['mobile', 'desktop'] }),
  params: text('params', { mode: 'json' }).$type<Record<string, unknown>>(),
  status: text('status', { enum: ['success', 'error'] }),
  durationMs: integer('duration_ms'),
  errorCode: text('error_code'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => [
  index('tool_lookups_tool_idx').on(t.tool),
  index('tool_lookups_created_at_idx').on(t.createdAt),
  index('tool_lookups_session_id_idx').on(t.sessionId),
])

export const feedback = sqliteTable('feedback', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  path: text('path').notNull(),
  thumb: text('thumb', { enum: ['up', 'down'] }),
  comment: text('comment'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  sessionId: text('session_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, t => [
  index('feedback_session_id_idx').on(t.sessionId),
])

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type ToolLookup = typeof toolLookups.$inferSelect
export type NewToolLookup = typeof toolLookups.$inferInsert
export type Feedback = typeof feedback.$inferSelect
export type NewFeedback = typeof feedback.$inferInsert

/**
 * The counter behind the feedback throttle.
 *
 * This lives in D1 rather than KV because the limit needs an atomic increment.
 * KV reads are eventually consistent, and a read-modify-write across Worker
 * isolates lets concurrent submissions share a stale snapshot.
 *
 * `expiresAt` owns the window, so one row per subject is reused each day.
 */
export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, t => [
  index('rate_limits_expires_at_idx').on(t.expiresAt),
])
