import { defineExternalCheck, pass, warn } from '@harlan-zw/nuxt-checkin/external'
import { d1Query } from '../lib/commands.mjs'

export default defineExternalCheck({
  id: 'site.activity',
  async run(context) {
    const nowSec = Math.floor(context.now.getTime() / 1000)
    const sinceSec = Math.floor(context.since.getTime() / 1000)
    const tables = new Set((await d1Query(context, `SELECT name FROM sqlite_master WHERE type = 'table'`)).map(row => row.name))
    const has = table => tables.has(table)
    if (!has('feedback') || !has('tool_lookups'))
      throw new Error(`Expected tables are missing: ${['feedback', 'tool_lookups'].filter(table => !has(table)).join(', ')}`)

    const day = nowSec - 24 * 60 * 60
    const week = nowSec - 7 * 24 * 60 * 60
    const month = nowSec - 30 * 24 * 60 * 60

    const evidence = {
      since: context.since.toISOString(),
      until: context.now.toISOString(),
      tables: [...tables],
      // Every feedback row since the last run, in full. This is the work list the
      // check-in exists to produce, so it is never summarised away.
      feedbackSinceLastRun: (await d1Query(context, `SELECT id, path, thumb, comment, created_at, user_id IS NOT NULL AS has_user, substr(COALESCE(metadata, ''), 1, 400) metadata FROM feedback WHERE created_at >= ${sinceSec} ORDER BY created_at DESC LIMIT 50`)),
      // Resolved in the admin view means an action was taken, so only NULL rows
      // are still an unanswered user.
      feedbackOpenComments: (await d1Query(context, `SELECT id, path, comment, created_at FROM feedback WHERE comment IS NOT NULL AND comment != '' AND resolved_at IS NULL ORDER BY created_at DESC LIMIT 20`)),
      feedbackTotals: (await d1Query(context, `SELECT
        COUNT(*) total,
        COALESCE(SUM(created_at >= ${day}), 0) total_24h,
        COALESCE(SUM(created_at >= ${day} AND thumb = 'up'), 0) up_24h,
        COALESCE(SUM(created_at >= ${day} AND thumb = 'down'), 0) down_24h,
        COALESCE(SUM(created_at >= ${day} AND comment IS NOT NULL AND comment != ''), 0) comments_24h,
        COALESCE(SUM(created_at >= ${week} AND thumb = 'up'), 0) up_7d,
        COALESCE(SUM(created_at >= ${week} AND thumb = 'down'), 0) down_7d,
        MAX(created_at) last_at
        FROM feedback`))[0],
      feedbackByPath: (await d1Query(context, `SELECT path, COUNT(*) n, COALESCE(SUM(thumb = 'down'), 0) down, COALESCE(SUM(comment IS NOT NULL AND comment != ''), 0) comments FROM feedback WHERE created_at >= ${month} GROUP BY path ORDER BY down DESC, n DESC LIMIT 15`)),
      // `status` is null for rows written by a page load, so every rate is taken
      // over rows that recorded an outcome.
      tools24h: (await d1Query(context, `SELECT COUNT(*) lookups, COALESCE(SUM(status IS NOT NULL), 0) statused, COALESCE(SUM(status = 'error'), 0) errors, AVG(duration_ms) avg_ms, MAX(duration_ms) max_ms, COALESCE(SUM(duration_ms > 10000), 0) slow FROM tool_lookups WHERE created_at >= ${day}`))[0],
      toolsPrior6d: (await d1Query(context, `SELECT COUNT(*) lookups, COALESCE(SUM(status IS NOT NULL), 0) statused, COALESCE(SUM(status = 'error'), 0) errors FROM tool_lookups WHERE created_at >= ${week} AND created_at < ${day}`))[0],
      toolsByTool24h: (await d1Query(context, `SELECT tool, COUNT(*) lookups, COALESCE(SUM(status IS NOT NULL), 0) statused, COALESCE(SUM(status = 'error'), 0) errors FROM tool_lookups WHERE created_at >= ${day} GROUP BY tool ORDER BY lookups DESC`)),
      toolErrorFingerprints: (await d1Query(context, `SELECT tool, COALESCE(error_code, 'none') error_code, COUNT(*) count, MIN(created_at) first_at, MAX(created_at) last_at FROM tool_lookups WHERE status = 'error' AND created_at >= ${week} GROUP BY tool, error_code ORDER BY count DESC LIMIT 15`)),
      // A query repeated by many sessions is a product signal, not an error, and
      // is the cheapest read on what people came here to do.
      topQueries24h: (await d1Query(context, `SELECT tool, query, COUNT(*) n, COUNT(DISTINCT session_id) sessions FROM tool_lookups WHERE created_at >= ${day} AND query != '' GROUP BY tool, query ORDER BY n DESC LIMIT 10`)),
      sessions24h: (await d1Query(context, `SELECT COUNT(DISTINCT session_id) sessions FROM tool_lookups WHERE created_at >= ${day} AND session_id IS NOT NULL`))[0],
      users: has('users') ? (await d1Query(context, `SELECT COUNT(*) total, COALESCE(SUM(created_at >= ${day}), 0) new_24h FROM users`))[0] : null,
    }
    return evidence.feedbackOpenComments.length || Number(evidence.feedbackTotals?.down_24h) > 0
      ? warn('Feedback needs attention.', evidence)
      : pass(evidence)
  },
})
