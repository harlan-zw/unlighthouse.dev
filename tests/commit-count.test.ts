/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { parseGitHubLastPage } from '../shared/github.ts'

test('reads the last page from a live GitHub Link header', () => {
  const link = '<https://api.github.com/repositories/577581539/commits?sha=main&per_page=1&page=2>; rel="next", <https://api.github.com/repositories/577581539/commits?sha=main&per_page=1&page=783>; rel="last"'

  assert.equal(parseGitHubLastPage(link), 783)
})

test('reads the last page when the query parameters are reordered', () => {
  const link = '<https://api.github.com/repositories/577581539/commits?per_page=1&page=42&sha=main>; rel="last"'

  assert.equal(parseGitHubLastPage(link), 42)
})

test('falls back to page 1 when the Link header is missing', () => {
  assert.equal(parseGitHubLastPage(null), 1)
  assert.equal(parseGitHubLastPage(undefined), 1)
  assert.equal(parseGitHubLastPage(''), 1)
})

test('falls back to page 1 when no entry carries rel last', () => {
  const link = '<https://api.github.com/repositories/577581539/commits?page=2>; rel="next"'

  assert.equal(parseGitHubLastPage(link), 1)
})

test('falls back to page 1 when the last entry has no page parameter', () => {
  const link = '<https://api.github.com/repositories/577581539/commits?sha=main>; rel="last"'

  assert.equal(parseGitHubLastPage(link), 1)
})

test('falls back to page 1 when the last entry is not a URL', () => {
  assert.equal(parseGitHubLastPage('<not a url>; rel="last"'), 1)
})
