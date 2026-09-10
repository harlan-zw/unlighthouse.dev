/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'
import { createError } from 'h3'
import { MAX_BODY_BYTES } from '../shared/page-weight.ts'
import { EXPECTED_UPSTREAM_FAILURE_MESSAGE_RE } from '../shared/sentry.ts'

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
 * The answer the handler owes a visitor when the measured site itself is the
 * condition: a purposeful status whose message `EXPECTED_UPSTREAM_FAILURE_MESSAGE_RE`
 * matches, so the target site's condition never lands in this site's Sentry
 * issue feed.
 */
function isExpectedUpstreamAnswer(statusCode: number): (error: unknown) => boolean {
  return (error) => {
    const candidate = error as { statusCode?: number, message?: string }
    return candidate.statusCode === statusCode
      && typeof candidate.message === 'string'
      && EXPECTED_UPSTREAM_FAILURE_MESSAGE_RE.test(candidate.message)
  }
}

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

test('answers 502 with an ignored message when the document fetch fails', async () => {
  const realFetch = globalThis.fetch
  globalThis.fetch = (async () => {
    throw new TypeError('fetch failed')
  }) as typeof fetch

  try {
    await assert.rejects(
      handler({ query: { url: 'https://example.com/' } } as unknown as Parameters<typeof handler>[0]),
      isExpectedUpstreamAnswer(502),
    )
  }
  finally {
    globalThis.fetch = realFetch
  }
})

test('answers 502 with an ignored message when the document body aborts mid-stream', async () => {
  const realFetch = globalThis.fetch
  globalThis.fetch = (async () => pageWhoseBodyAborts()) as typeof fetch

  try {
    await assert.rejects(
      handler({ query: { url: 'https://example.com/' } } as unknown as Parameters<typeof handler>[0]),
      isExpectedUpstreamAnswer(502),
    )
  }
  finally {
    globalThis.fetch = realFetch
  }
})

test('answers 502 with an ignored message when the reachability probe finds the site down', async () => {
  // `validateUrl` probes the site before the fetch loop runs, so a fully dead
  // site fails there, with the 400 whose text names the visitor's URL. The
  // handler must answer with the same dropped upstream message the loop owes,
  // and the loop must never run to fetch the dead address itself.
  const realValidateUrl = globals.validateUrl
  const realFetch = globalThis.fetch
  globals.validateUrl = async () => {
    throw createError({ statusCode: 400, message: 'URL not reachable: https://example.com/' })
  }
  globalThis.fetch = (async () => {
    throw new Error('the probe failed first; the fetch loop must not run')
  }) as typeof fetch

  try {
    await assert.rejects(
      handler({ query: { url: 'https://example.com/' } } as unknown as Parameters<typeof handler>[0]),
      isExpectedUpstreamAnswer(502),
    )
  }
  finally {
    globals.validateUrl = realValidateUrl
    globalThis.fetch = realFetch
  }
})

test('answers 413 with an ignored message when the page is past the byte cap', async () => {
  const realFetch = globalThis.fetch
  globalThis.fetch = (async () => {
    return new Response(new Uint8Array(MAX_BODY_BYTES + 1), { status: 200, headers: { 'content-type': 'text/html' } })
  }) as typeof fetch

  try {
    await assert.rejects(
      handler({ query: { url: 'https://example.com/' } } as unknown as Parameters<typeof handler>[0]),
      isExpectedUpstreamAnswer(413),
    )
  }
  finally {
    globalThis.fetch = realFetch
  }
})
