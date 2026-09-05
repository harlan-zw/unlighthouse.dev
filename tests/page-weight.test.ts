/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  classifyResource,
  extractResourceRefs,
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
