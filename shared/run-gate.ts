/**
 * Supersedes stale async resolutions.
 *
 * A request that is still in flight when a newer one starts must not land its
 * answer. The page-size fast pass hit this: a slow response for URL A could
 * resolve after the visitor had already submitted URL B, and B's screen would
 * show A's weight breakdown. A run records its generation when it starts and
 * checks it when the response lands.
 */
export interface RunGate {
  /** Starts a new run and returns the token that identifies it. */
  begin: () => number
  /** True when the token still belongs to the newest run. */
  isCurrent: (token: number) => boolean
}

export function createRunGate(): RunGate {
  let current = 0
  return {
    begin: () => ++current,
    isCurrent: token => token === current,
  }
}
