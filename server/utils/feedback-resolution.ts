/** The slice of D1 this store uses, so a test can supply a database of its own. */
export interface FeedbackResolutionDatabase {
  prepare: (sql: string) => {
    bind: (...values: unknown[]) => {
      run: () => Promise<{ meta: { changes: number } }>
    }
  }
}

export interface FeedbackResolutionInput {
  id: string
  resolved: boolean
}

export type FeedbackResolutionResult
  = | { _tag: 'Ok', id: string, resolvedAt: number | null }
    | { _tag: 'Err', reason: 'not-found' }

const SET_RESOLUTION_SQL = 'UPDATE feedback SET resolved_at = ?1 WHERE id = ?2'

/**
 * Records the admin's close decision on one feedback row.
 *
 * `resolved: true` stamps the row with the clock, `false` reopens it. The row
 * count from the UPDATE is the existence check, so a stale id from the admin
 * view is an error value instead of a silent no-op.
 */
export async function setFeedbackResolution(
  db: FeedbackResolutionDatabase,
  { id, resolved }: FeedbackResolutionInput,
  now: () => number = () => Math.floor(Date.now() / 1000),
): Promise<FeedbackResolutionResult> {
  const resolvedAt = resolved ? now() : null
  const { meta } = await db.prepare(SET_RESOLUTION_SQL).bind(resolvedAt, id).run()
  if (meta.changes === 0)
    return { _tag: 'Err', reason: 'not-found' }
  return { _tag: 'Ok', id, resolvedAt }
}
