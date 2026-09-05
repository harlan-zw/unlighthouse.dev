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

test('refuses an IPv6 host that embeds a blocked IPv4 address', () => {
  const blocked = [
    'http://[::ffff:127.0.0.1]/',
    'http://[::ffff:10.0.0.1]/',
    'http://[::ffff:192.168.1.1]/',
    'http://[::7f00:1]/',
    'http://[0:0:0:0:0:0:a00:1]/',
  ]

  for (const raw of blocked)
    assert.equal(parsePublicHttpUrl(raw)._tag, 'err', raw)

  // A mapped form of a public address is still public.
  assert.equal(parsePublicHttpUrl('http://[::ffff:8.8.8.8]/')._tag, 'ok')
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

test('does not mistake data-src for the src it shadows', () => {
  const refs = extractResourceRefs(
    '<html><body><img data-src="/lazy.png" src="/real.png"></body></html>',
    'https://example.com/',
  )

  assert.ok(refs.some(ref => ref.url === 'https://example.com/real.png'))
  assert.ok(!refs.some(ref => ref.url === 'https://example.com/lazy.png'))
})

test('decodes character references in an attribute value', () => {
  const refs = extractResourceRefs(
    '<img src="/px?a=1&amp;b=2">',
    'https://example.com/',
  )

  assert.equal(refs.length, 1)
  assert.equal(refs[0]?.url, 'https://example.com/px?a=1&b=2')
})

test('decodes numeric character references in an attribute value', () => {
  const refs = extractResourceRefs(
    '<img src="/px?a=1&#38;b=2">',
    'https://example.com/',
  )

  assert.equal(refs.length, 1)
  assert.equal(refs[0]?.url, 'https://example.com/px?a=1&b=2')
})

test('dedupes an encoded spelling against its decoded spelling', () => {
  const refs = extractResourceRefs(
    '<img src="/px?a=1&amp;b=2"><img src="/px?a=1&b=2">',
    'https://example.com/',
  )

  assert.equal(refs.length, 1)
  assert.equal(refs[0]?.url, 'https://example.com/px?a=1&b=2')
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

test('stops at a redirect hop that points inside a network instead of fetching it', async () => {
  let calls = 0
  const outcome = await measureWith(async () => {
    calls++
    return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/x' } })
  })

  assert.equal(calls, 1)
  assert.equal(outcome._tag, 'absent')
})

test('follows a redirect to a public host and measures there', async () => {
  const urls: string[] = []
  let headCalls = 0
  const outcome = await measureWith(async (url, init) => {
    urls.push(String(url))
    if (init?.method === 'HEAD') {
      headCalls++
      return headCalls === 1
        ? new Response(null, { status: 302, headers: { location: 'https://example.org/real' } })
        : new Response(null, { status: 200 })
    }
    return new Response(null, { status: 206, headers: { 'content-range': 'bytes 0-0/4321' } })
  })

  assert.equal(urls[1], 'https://example.org/real')
  assert.ok(outcome._tag === 'measured')
  assert.equal(outcome.size, 4321)
})

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

/**
 * The tag scan used to be `<[^>]*>`, which ends a tag at the first `>`. A `>`
 * inside a quoted attribute value is legal HTML, so real resources vanished
 * and tags written inside comments or scripts were counted as real.
 */

test('keeps a resource whose tag carries a quoted angle bracket', () => {
  const html = '<img alt="width > height" src="/hero.png"><script src="/app.js"></script>'

  const refs = extractResourceRefs(html, 'https://example.com/')

  assert.ok(refs.some(ref => ref.url === 'https://example.com/hero.png'))
  assert.ok(refs.some(ref => ref.url === 'https://example.com/app.js'))
})

test('keeps a resource whose tag carries a single-quoted angle bracket', () => {
  const html = `<img alt='a > b' src="/hero.png">`

  const refs = extractResourceRefs(html, 'https://example.com/')

  assert.deepEqual(refs.map(ref => ref.url), ['https://example.com/hero.png'])
})

test('ignores a tag written inside a comment', () => {
  const html = '<!-- <script src="/ghost.js"></script> --><script src="/real.js"></script>'

  const refs = extractResourceRefs(html, 'https://example.com/')

  assert.deepEqual(refs.map(ref => ref.url), ['https://example.com/real.js'])
})

test('ignores a tag written inside script content', () => {
  const html = `<script>const markup = '<img src="/ghost.png">'</script><img src="/real.png">`

  const refs = extractResourceRefs(html, 'https://example.com/')

  assert.deepEqual(refs.map(ref => ref.url), ['https://example.com/real.png'])
})

test('ignores a tag written inside style content', () => {
  const html = `<style>/* <img src="/ghost.png"> */</style><img src="/real.png">`

  const refs = extractResourceRefs(html, 'https://example.com/')

  assert.deepEqual(refs.map(ref => ref.url), ['https://example.com/real.png'])
})

test('still reads a script tag that has its own src before skipping its body', () => {
  const html = '<script src="/app.js">console.log("<img src=\'/ghost.png\'>")</script>'

  const refs = extractResourceRefs(html, 'https://example.com/')

  assert.deepEqual(refs.map(ref => ref.url), ['https://example.com/app.js'])
})

test('stops cleanly on an unterminated comment', () => {
  const refs = extractResourceRefs('<img src="/a.png"><!-- <img src="/b.png">', 'https://example.com/')

  assert.deepEqual(refs.map(ref => ref.url), ['https://example.com/a.png'])
})

/**
 * A response says something about the page. A rejected fetch says something
 * about the network, and the two must not be confused: counting a connection
 * reset as a definitive answer shrinks the total while still calling the run
 * complete.
 */

const measureOptions = {
  deadline: Date.now() + 10_000,
  timeoutMs: 5000,
  maxBodyBytes: 5_000_000,
  userAgent: 'test',
}

test('leaves a resource unmeasured when the connection fails', async () => {
  const outcome = await measureResource('https://example.com/a.js', {
    ...measureOptions,
    fetchLike: () => Promise.reject(Object.assign(new Error('connection reset'), { name: 'TypeError' })),
  })

  assert.equal(outcome._tag, 'unmeasured')
})

test('leaves a resource unmeasured when the request times out', async () => {
  const outcome = await measureResource('https://example.com/a.js', {
    ...measureOptions,
    fetchLike: () => Promise.reject(Object.assign(new Error('timed out'), { name: 'TimeoutError' })),
  })

  assert.equal(outcome._tag, 'unmeasured')
})

test('calls a resource absent only when the server answers definitively', async () => {
  const outcome = await measureResource('https://example.com/gone.js', {
    ...measureOptions,
    fetchLike: () => Promise.resolve(new Response('', { status: 404 })),
  })

  assert.equal(outcome._tag, 'absent')
})

test('an unmeasured resource makes the run incomplete, an absent one does not', () => {
  // Three found, three tried, two sized: the third was a connection failure.
  assert.equal(assessCompleteness(3, 3, 2, true).complete, false)
  // The same counts, but the third answered 404. That is a fact about the page.
  assert.equal(assessCompleteness(3, 3, 2, false).complete, true)
})

/**
 * A total labelled complete has to account for everything the served HTML
 * asks for, not only the tags the first pass happened to cover.
 */

test('reads the resources named by embedded content elements', () => {
  const html = `
    <iframe src="/frame.html"></iframe>
    <embed src="/plugin.swf">
    <object data="/thing.pdf"></object>
    <video src="/clip.mp4" poster="/poster.jpg"><track src="/subs.vtt"></video>
  `

  const urls = extractResourceRefs(html, 'https://example.com/').map(ref => ref.url)

  for (const path of ['/frame.html', '/plugin.swf', '/thing.pdf', '/clip.mp4', '/poster.jpg', '/subs.vtt'])
    assert.ok(urls.includes(`https://example.com${path}`), `missing ${path}`)
})

test('reads a video poster as its own image resource', () => {
  const refs = extractResourceRefs('<video src="/a.mp4" poster="/p.jpg"></video>', 'https://example.com/')

  assert.equal(refs.find(ref => ref.url.endsWith('/p.jpg'))?.type, 'image')
})

test('reads an object through data rather than src', () => {
  const refs = extractResourceRefs('<object data="/thing.pdf" src="/ignored.js"></object>', 'https://example.com/')

  assert.deepEqual(refs.map(ref => ref.url), ['https://example.com/thing.pdf'])
})

test('refuses a private host before any request is attempted', () => {
  // The endpoint parses the submitted URL through this guard before it calls
  // validateUrl, whose reachability probe would otherwise make the request.
  for (const raw of ['http://127.0.0.1/', 'http://169.254.169.254/', 'http://10.0.0.1/'])
    assert.equal(parsePublicHttpUrl(raw)._tag, 'err', raw)
})
