/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'
import { createError } from 'h3'

const root = new URL('../', import.meta.url)

// The handler names its imports with Nuxt's `~~` root alias, which plain Node
// does not resolve, so tests map that alias onto the repository root here.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('~~/'))
      return nextResolve(`${new URL(specifier.slice(3), root).href}.ts`, context)
    return nextResolve(specifier, context)
  },
})

// The handler is written against Nitro's auto-imports. Tests provide the ones
// it uses, keeping the fetch stub the only thing under test.
const globals = globalThis as unknown as Record<string, unknown>
globals.defineCachedEventHandler = (handler: unknown) => handler
globals.checkFreeToolRateLimit = async () => {}
globals.getQuery = (event: { query?: Record<string, unknown> }) => event.query ?? {}
globals.normalizeUrl = (url: string) => url
globals.validateUrl = async (url: string) => url
globals.trackToolRequest = (_event: unknown, _meta: unknown, work: () => unknown) => work()
globals.createError = createError

const { default: handler } = await import('../layers/tools/server/api/tools/page-weight.get.ts')

/**
 * A response whose body stream dies after the first chunk: the page loaded,
 * then the connection reset while the body was still streaming. The document
 * timeout governs body streaming too, so this is the shape a slow or reset
 * page takes at the document read.
 */
function pageWhoseBodyAborts(): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('<html><body>'))
    },
    pull(controller) {
      controller.error(Object.assign(new Error('connection reset mid-body'), { name: 'TypeError' }))
    },
  })
  return new Response(stream, { status: 200, headers: { 'content-type': 'text/html' } })
}

test('answers 502 when the document body aborts mid-stream', async () => {
  const realFetch = globalThis.fetch
  globalThis.fetch = (async () => pageWhoseBodyAborts()) as typeof fetch

  try {
    await assert.rejects(
      handler({ query: { url: 'https://example.com/' } } as unknown as Parameters<typeof handler>[0]),
      (error: unknown) =>
        (error as { statusCode?: number }).statusCode === 502
        && (error as { message?: string }).message === 'Could not load the page',
    )
  }
  finally {
    globalThis.fetch = realFetch
  }
})
