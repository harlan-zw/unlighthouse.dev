/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { CommentFeedbackSchema, ThumbsFeedbackSchema } from '../types/schemas.ts'

test('comment feedback schema truncates long metadata values instead of rejecting', () => {
  const url = `https://example.test/?q=${'a'.repeat(301)}`
  const parsed = CommentFeedbackSchema.safeParse({ comment: 'Great tool, thanks', context: { url } })

  assert.equal(parsed.success, true)
  assert.ok(parsed.success)
  assert.equal(parsed.data.context?.url, url.slice(0, 300))
})

test('comment feedback schema bounds the context record', () => {
  const comment = 'Great tool, thanks'

  assert.equal(
    CommentFeedbackSchema.safeParse({ comment, context: { url: 'https://example.test', strategy: 'mobile' } }).success,
    true,
  )
  assert.equal(
    CommentFeedbackSchema.safeParse({ comment, context: { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11 } }).success,
    false,
  )
  const truncatedSpam = CommentFeedbackSchema.safeParse({ comment, context: { spam: 'x'.repeat(301) } })
  assert.equal(truncatedSpam.success, true)
  assert.ok(truncatedSpam.success)
  assert.equal(truncatedSpam.data.context?.spam, 'x'.repeat(300))
  assert.equal(
    CommentFeedbackSchema.safeParse({ comment, context: { spam: { deep: 'object' } } }).success,
    false,
  )
  assert.equal(
    CommentFeedbackSchema.safeParse({ comment, context: { ['k'.repeat(41)]: 'ok' } }).success,
    false,
  )
})

test('comment feedback schema bounds stored metadata fields', () => {
  const comment = 'Great tool, thanks'

  assert.equal(CommentFeedbackSchema.safeParse({ comment, path: '/'.repeat(501) }).success, false)
  assert.equal(CommentFeedbackSchema.safeParse({ comment, toolId: 't'.repeat(101) }).success, false)
  assert.equal(CommentFeedbackSchema.safeParse({ comment, thumbFeedbackId: 'i'.repeat(101) }).success, false)
})

test('thumbs feedback schema bounds the context record', () => {
  assert.equal(
    ThumbsFeedbackSchema.safeParse({ thumbs: 'up', context: { url: 'https://example.test', urls: ['https://a.test', 'https://b.test'] } }).success,
    true,
  )
  assert.equal(
    ThumbsFeedbackSchema.safeParse({ thumbs: 'up', context: { urls: Array.from({ length: 21 }, (_, i) => `https://${i}.test`) } }).success,
    false,
  )
  const truncatedThumbs = ThumbsFeedbackSchema.safeParse({ thumbs: 'up', context: { spam: 'y'.repeat(301) } })
  assert.equal(truncatedThumbs.success, true)
  assert.ok(truncatedThumbs.success)
  assert.equal(truncatedThumbs.data.context?.spam, 'y'.repeat(300))
  const truncatedArrayValue = ThumbsFeedbackSchema.safeParse({ thumbs: 'up', context: { urls: ['z'.repeat(301)] } })
  assert.equal(truncatedArrayValue.success, true)
  assert.ok(truncatedArrayValue.success)
  assert.deepEqual(truncatedArrayValue.data.context?.urls, ['z'.repeat(300)])
  assert.equal(
    ThumbsFeedbackSchema.safeParse({ thumbs: 'up', context: { urls: ['https://a.test', { deep: 'object' }] } }).success,
    false,
  )
})
