/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { formatToolElapsed } from '../layers/tools/app/utils/tool-loading.ts'

test('formats short and long tool waits without fake precision', () => {
  assert.equal(formatToolElapsed(0), '0s')
  assert.equal(formatToolElapsed(9_900), '9s')
  assert.equal(formatToolElapsed(61_000), '1m 1s')
})

test('shared loading surfaces expose elapsed and accessible status', async () => {
  const [pill, floating, background] = await Promise.all([
    readFile(new URL('../layers/tools/app/components/ToolLoadingPill.vue', import.meta.url), 'utf8'),
    readFile(new URL('../layers/tools/app/components/ToolFloatingLoader.vue', import.meta.url), 'utf8'),
    readFile(new URL('../layers/tools/app/components/ToolBackgroundIndicator.vue', import.meta.url), 'utf8'),
  ])

  assert.match(pill, /role="status"/)
  assert.match(pill, /aria-live="polite"/)
  assert.match(pill, /aria-busy="true"/)
  assert.match(pill, /elapsedLabel/)
  assert.match(pill, /You can keep browsing; we'll notify you when the report is ready/)
  assert.match(floating, /elapsedLabel/)
  assert.match(background, /elapsedLabel/)
})

test('remote tool pages use truthful background loading without fake percentages', async () => {
  const pages = [
    'cls-debugger.vue',
    'cwv-checker.vue',
    'cwv-compare.vue',
    'cwv-history.vue',
    'inp-analyzer.vue',
    'lcp-finder.vue',
    'page-size.vue',
    'pagespeed-insights-performance.vue',
    'ttfb-checker.vue',
  ]

  for (const page of pages) {
    const source = await readFile(new URL(`../layers/tools/app/pages/tools/${page}`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /loadingProgress/, page)
    assert.doesNotMatch(source, /useLoadingMessages/, page)
    assert.match(source, /<ToolLoadingPill[\s\S]*?background/, page)
    assert.match(source, /:started-at="startedAt"/, page)
  }
})

test('URL sync lets Vue Router own query encoding', async () => {
  const [source, comparePage] = await Promise.all([
    readFile(new URL('../layers/tools/app/composables/useToolUrlSync.ts', import.meta.url), 'utf8'),
    readFile(new URL('../layers/tools/app/pages/tools/cwv-compare.vue', import.meta.url), 'utf8'),
  ])

  assert.doesNotMatch(source, /encodeURIComponent|decodeURIComponent/)
  assert.doesNotMatch(comparePage, /encodeURIComponent|decodeURIComponent/)
})

test('persistent background UI owns completion notifications after page unmount', async () => {
  const [requestSource, indicatorSource] = await Promise.all([
    readFile(new URL('../layers/tools/app/composables/useToolBackgroundRequest.ts', import.meta.url), 'utf8'),
    readFile(new URL('../layers/tools/app/components/ToolBackgroundIndicator.vue', import.meta.url), 'utf8'),
  ])

  assert.doesNotMatch(requestSource, /useToast|toast\.add/)
  assert.match(indicatorSource, /requestStatuses/)
  assert.match(indicatorSource, /toast\.add/)
})

test('bulk PageSpeed reports real completion progress', async () => {
  const source = await readFile(new URL('../layers/tools/app/pages/tools/bulk-pagespeed.vue', import.meta.url), 'utf8')

  assert.match(source, /progressStats\.value\.completed \/ progressStats\.value\.total/)
  assert.match(source, /role="progressbar"/)
  assert.match(source, /:aria-valuenow="Math\.round\(progressPercent\)"/)
})
