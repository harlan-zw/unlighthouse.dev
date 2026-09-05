/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assessCompleteness,
  classifyResource,
  extractResourceRefs,
  MAX_BODY_BYTES,
  measureResource,
  parsePublicHttpUrl,
  summarizeWeight,
} from '../shared/page-weight.ts'

test('refuses a URL that points back inside a network', () => {
  const blocked = [
    'http://localhost/admin',
    'http://127.0.0.1/',
    'http://10.1.2.3/',
    'http://192.168.0.1/',
    'http://172.16.0.1/',
    'http://169.254.169.254/latest/meta-data/',
    'http://[::1]/',
  ]

  for (const raw of blocked)
    assert.equal(parsePublicHttpUrl(raw)._tag, 'err', raw)
})

test('refuses a scheme that is not http', () => {
  for (const raw of ['file:///etc/passwd', 'data:text/html,hi', 'javascript:alert(1)'])
    assert.equal(parsePublicHttpUrl(raw)._tag, 'err', raw)
})

test('accepts a public http URL', () => {
  const parsed = parsePublicHttpUrl('https://example.com/a?b=1')

  assert.equal(parsed._tag, 'ok')
  assert.ok(parsed._tag === 'ok')
  assert.equal(parsed.url.toString(), 'https://example.com/a?b=1')
})

test('resolves a relative URL against the page it came from', () => {
  const parsed = parsePublicHttpUrl('/_nuxt/entry.js', 'https://example.com/blog/post')

  assert.ok(parsed._tag === 'ok')
  assert.equal(parsed.url.toString(), 'https://example.com/_nuxt/entry.js')
})

test('prefers the served content type over the URL extension', () => {
  // A script served from a path with no extension, which an extension guess misses.
  assert.equal(classifyResource('https://example.com/api/bundle', 'application/javascript'), 'script')
  // A content type wins even when the extension says otherwise.
  assert.equal(classifyResource('https://example.com/a.css', 'image/png'), 'image')
  assert.equal(classifyResource('https://example.com/a.woff2'), 'font')
  assert.equal(classifyResource('https://example.com/whatever'), 'other')
})

const PAGE = `
<!doctype html>
<html><head>
  <link rel="stylesheet" href="/style.css">
  <link rel="preload" as="font" href="/f.woff2">
  <link rel="canonical" href="https://example.com/canonical">
  <script src="/app.js"></script>
  <script>console.log('inline')</script>
</head><body>
  <img src="/hero.png">
  <img srcset="/wide.avif 2x, /narrow.avif 1x" src="/fallback.png">
  <video src="/clip.mp4"></video>
  <img src="http://127.0.0.1/private.png">
  <script src="/app.js"></script>
</body></html>
`

test('reads every subresource the served HTML asks for', () => {
  const refs = extractResourceRefs(PAGE, 'https://example.com/')
  const byUrl = new Map(refs.map(ref => [ref.url, ref.type]))

  assert.equal(byUrl.get('https://example.com/style.css'), 'stylesheet')
  assert.equal(byUrl.get('https://example.com/f.woff2'), 'font')
  assert.equal(byUrl.get('https://example.com/app.js'), 'script')
  assert.equal(byUrl.get('https://example.com/hero.png'), 'image')
  assert.equal(byUrl.get('https://example.com/clip.mp4'), 'media')
})

test('takes the first srcset candidate, the way a plain reader would', () => {
  const refs = extractResourceRefs(PAGE, 'https://example.com/')

  assert.ok(refs.some(ref => ref.url === 'https://example.com/wide.avif'))
  assert.ok(!refs.some(ref => ref.url === 'https://example.com/fallback.png'))
})

test('skips a link rel that fetches nothing for this page', () => {
  const refs = extractResourceRefs(PAGE, 'https://example.com/')

  assert.ok(!refs.some(ref => ref.url === 'https://example.com/canonical'))
})

test('drops a subresource pointing back inside a network', () => {
  const refs = extractResourceRefs(PAGE, 'https://example.com/')

  assert.ok(!refs.some(ref => ref.url.includes('127.0.0.1')))
})

test('counts a repeated URL once, the way a browser fetches it once', () => {
  const refs = extractResourceRefs(PAGE, 'https://example.com/')

  assert.equal(refs.filter(ref => ref.url === 'https://example.com/app.js').length, 1)
})

test('groups measured resources by type, largest group first', () => {
  const summary = summarizeWeight([
    { url: 'https://e.com/', type: 'document', size: 1000 },
    { url: 'https://e.com/a.js', type: 'script', size: 5000 },
    { url: 'https://e.com/b.js', type: 'script', size: 3000 },
    { url: 'https://e.com/c.png', type: 'image', size: 2000 },
  ])

  assert.equal(summary.totalSize, 11_000)
  assert.equal(summary.totalRequests, 4)
  assert.deepEqual(summary.groups.map(group => group.type), ['script', 'image', 'document'])
  assert.deepEqual(
    summary.groups.find(group => group.type === 'script'),
    { type: 'script', count: 2, size: 8000 },
  )
})

test('ranks the largest resources and caps the list at ten', () => {
  const entries = Array.from({ length: 15 }, (_, i) => ({
    url: `https://e.com/${i}`,
    type: 'script' as const,
    size: i * 100,
  }))

  const summary = summarizeWeight(entries)

  assert.equal(summary.largestResources.length, 10)
  assert.equal(summary.largestResources[0]?.size, 1400)
  assert.equal(summary.largestResources.at(-1)?.size, 500)
})

test('a terminally absent subresource does not make the measurement incomplete', () => {
  // Five resources discovered and attempted, one answered 404. The four that
  // answered are the whole truth, so the total is shown.
  const assessment = assessCompleteness(5, 5, 4, false)

  assert.equal(assessment.complete, true)
})

test('budget exhaustion that leaves resources unmeasured makes it incomplete', () => {
  const assessment = assessCompleteness(5, 5, 3, true)

  assert.equal(assessment.complete, false)
})

test('resources past the limit keep the measurement incomplete', () => {
  const assessment = assessCompleteness(130, 120, 120, false)

  assert.equal(assessment.complete, false)
  assert.equal(assessment.skipped, 10)
})

function measureWith(fetchLike: typeof fetch) {
  return measureResource('https://example.com/resource', {
    deadline: Date.now() + 10_000,
    timeoutMs: 10_000,
    maxBodyBytes: MAX_BODY_BYTES,
    userAgent: 'test',
    fetchLike,
  })
}

test('counts a resource that answers 404 to every probe as absent', async () => {
  const outcome = await measureWith(async () => new Response(null, { status: 404 }))

  assert.equal(outcome._tag, 'absent')
})

test('counts a resource the deadline cut short as unmeasured', async () => {
  const outcome = await measureResource('https://example.com/slow', {
    deadline: Date.now() - 1,
    timeoutMs: 10_000,
    maxBodyBytes: MAX_BODY_BYTES,
    userAgent: 'test',
    fetchLike: async () => {
      throw new Error('must not fetch once the deadline has passed')
    },
  })

  assert.equal(outcome._tag, 'unmeasured')
})

test('reads a size from the range probe without downloading the body', async () => {
  const outcome = await measureWith(async (_url, init) => init?.method === 'HEAD'
    ? new Response(null, { status: 200 })
    : new Response(null, { status: 206, headers: { 'content-range': 'bytes 0-0/12345' } }))

  assert.ok(outcome._tag === 'measured')
  assert.equal(outcome.size, 12345)
})

test('stops reading once a body passes the byte cap and reports it unmeasured', async () => {
  const chunk = new Uint8Array(1024 * 1024).fill(0x61)
  let chunksSent = 0
  let cancelled = false
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (chunksSent >= 20) {
        controller.close()
        return
      }
      chunksSent++
      controller.enqueue(chunk)
    },
    cancel() {
      cancelled = true
    },
  })

  const outcome = await measureWith(async () => new Response(stream, { headers: { 'content-type': 'application/octet-stream' } }))

  assert.equal(outcome._tag, 'unmeasured')
  // Six one-megabyte chunks pass the five-megabyte cap, and the stream holds
  // twenty. Stopping well before the end is what keeps memory bounded.
  assert.ok(chunksSent < 20, `read ${chunksSent} of 20 chunks`)
  assert.ok(cancelled, 'expected the stream to be cancelled, not drained')
})

test('measures a body that stays under the byte cap', async () => {
  const half = new Uint8Array(512 * 1024).fill(0x62)
  let chunksSent = 0
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (chunksSent >= 6) {
        controller.close()
        return
      }
      chunksSent++
      controller.enqueue(half)
    },
  })

  const outcome = await measureWith(async () => new Response(stream, { headers: { 'content-type': 'text/plain' } }))

  assert.ok(outcome._tag === 'measured')
  assert.equal(outcome.size, 3 * 1024 * 1024)
  assert.equal(outcome.contentType, 'text/plain')
})
