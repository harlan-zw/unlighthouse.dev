export interface ToolRequestOutcome {
  status: 'success' | 'error'
  durationMs: number
  errorCode: string | null
}

type ToolResult<T>
  = | { _tag: 'Ok', value: T }
    | { _tag: 'Err', error: unknown }

function getErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object')
    return null

  const candidate = error as { statusCode?: unknown, status?: unknown, code?: unknown }
  const code = candidate.statusCode ?? candidate.status ?? candidate.code
  return typeof code === 'string' || typeof code === 'number' ? String(code) : null
}

export async function runWithToolOutcome<T>(
  run: () => Promise<T>,
  record: (outcome: ToolRequestOutcome) => Promise<void>,
  now: () => number = Date.now,
): Promise<T> {
  const startedAt = now()
  const result: ToolResult<T> = await run()
    .then(value => ({ _tag: 'Ok' as const, value }))
    .catch(error => ({ _tag: 'Err' as const, error }))

  await record({
    status: result._tag === 'Ok' ? 'success' : 'error',
    durationMs: Math.max(0, now() - startedAt),
    errorCode: result._tag === 'Err' ? getErrorCode(result.error) : null,
  })

  if (result._tag === 'Err')
    throw result.error

  return result.value
}
