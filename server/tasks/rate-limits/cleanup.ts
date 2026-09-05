import type { RateLimitDatabase } from '../../utils/rate-limit'
// `#nuxtseo/nitro` is a virtual module re-exporting the Nitro runtime, the
// same import the nuxt-ai-ready tasks use. Importing `nitropack/runtime`
// directly would not resolve, since nitropack is not a direct dependency.
import { defineTask } from '#nuxtseo/nitro'
import { deleteExpiredRateLimits } from '../../utils/rate-limit'

/** The slice of the scheduled handler's context this task reads. */
interface CleanupTaskContext {
  cloudflare?: {
    env?: { DB?: RateLimitDatabase }
  }
}

/**
 * Drops expired rate limit rows on the same cron the ai-ready runtime sync
 * runs on, so the cleanup adds no second trigger.
 *
 * The counter upsert reuses one row per subject, but nothing else ever
 * removes a row, and D1 keeps them forever where KV expired entries through
 * TTL. Unique IPs would otherwise accumulate without bound across the free
 * tool and feedback keys. `deleteExpiredRateLimits` scans the `expires_at`
 * index the migration created for exactly this query.
 */
export default defineTask<{ deleted: number | null }>({
  meta: {
    name: 'rate-limits:cleanup',
    description: 'Deletes rate limit rows whose window has passed',
  },
  async run(event) {
    const { DB } = (event.context as CleanupTaskContext).cloudflare?.env ?? {}
    if (!DB) {
      console.warn('[rate-limit] No database binding; skipped the expired rate limit cleanup')
      return { result: { deleted: null } }
    }

    const deleted = await deleteExpiredRateLimits(DB)
    return { result: { deleted } }
  },
})
