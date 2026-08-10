/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { preparePublicSponsors } from '../server/utils/sponsors.ts'

test('retries sponsors in the browser when prerendering stored an error', async () => {
  const source = await readFile(new URL('../app/pages/index.vue', import.meta.url), 'utf8')

  assert.match(source, /error: sponsorsError/)
  assert.match(source, /import\.meta\.client && sponsorsError\.value/)
  assert.match(source, /await refreshSponsors\(\)/)
})

test('groups only public sponsors and includes the exact $50 tier', () => {
  const privateSponsor = {
    sponsor: {
      login: 'private-sponsor',
      name: 'Private Sponsor',
      avatarUrl: 'https://example.com/private.png',
      linkUrl: 'https://example.com/private',
    },
    monthlyDollars: 10,
    privacyLevel: 'PRIVATE' as const,
  }
  const publicSponsor = {
    sponsor: {
      login: 'public-sponsor',
      name: 'Public Sponsor',
      avatarUrl: 'https://example.com/public.png',
      linkUrl: 'https://example.com/public',
    },
    monthlyDollars: 50,
    privacyLevel: 'PUBLIC' as const,
  }

  assert.deepEqual(preparePublicSponsors([privateSponsor, publicSponsor]), {
    others: [],
    $25: [],
    $50: [publicSponsor],
  })
})
