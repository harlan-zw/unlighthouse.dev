/* eslint-disable test/no-import-node-test */
import type { Node } from '@harlan-zw/comark-content'
import assert from 'node:assert/strict'
import test from 'node:test'
import { modifyRelativeDocLinksWithFramework } from '../utils/content.ts'

test('keeps beta links in the selected documentation version', () => {
  const nodes: Node[] = [
    ['a', { href: '/guide/guides/config#site' }, 'Config'],
    ['a', { href: '/architecture' }, 'Architecture'],
    ['a', { href: '/learn-lighthouse' }, 'Learn'],
  ]
  const links = modifyRelativeDocLinksWithFramework(nodes, true)
  assert.deepEqual(links.map(link => link[1].href), ['/v1/guide/guides/config#site', '/v1/architecture', '/learn-lighthouse'])
})

test('preserves stable links and secures external links', () => {
  const links = modifyRelativeDocLinksWithFramework([
    ['a', { href: '/api-doc' }, 'API'],
    ['a', { href: 'https://example.com' }, 'External'],
  ])
  assert.equal(links[0]?.[1].href, '/api-doc')
  assert.equal(links[1]?.[1].rel, 'noopener noreferrer')
})

test('keeps shared Lighthouse articles outside the beta docs prefix', () => {
  const links = modifyRelativeDocLinksWithFramework([['a', { href: '/v1/glossary/lcp' }, 'LCP']], true)
  assert.equal(links[0]?.[1].href, '/glossary/lcp')
})
