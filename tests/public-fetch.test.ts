/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.endsWith('/public-transport'))
      return next(`${specifier}.ts`, context)
    return next(specifier, context)
  },
})
const { publicFetch } = await import('../server/utils/public-fetch.ts')

for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '100.64.0.1', '::1', 'fc00::1', '::ffff:127.0.0.1']) {
  test(`refuses all contact when one DNS answer is ${address}`, async () => {
    let contacted = false
    await assert.rejects(publicFetch('https://dummy.example', {}, {
      resolveHostname: async () => ['93.184.216.34', address],
      fetchDestination: async () => {
        contacted = true
        return new Response()
      },
    }), /Blocked/)
    assert.equal(contacted, false)
  })
}

test('checks DNS again before following a redirect', async () => {
  const contacted: string[] = []
  await assert.rejects(publicFetch('https://dummy.example', {}, {
    resolveHostname: async host => host === 'dummy.example' ? ['93.184.216.34'] : ['10.0.0.1'],
    fetchDestination: async (url) => {
      contacted.push(url.hostname)
      return new Response(null, { status: 302, headers: { location: 'https://redirect.example' } })
    },
  }), /Blocked/)
  assert.deepEqual(contacted, ['dummy.example'])
})

test('keeps HEAD metadata without downloading a large public resource', async () => {
  const result = await publicFetch('https://dummy.example', { method: 'HEAD', redirect: 'manual' }, {
    resolveHostname: async () => ['93.184.216.34'],
    fetchDestination: async (_url, init, destination) => {
      assert.equal(init.method, 'HEAD')
      assert.equal(destination.address, '93.184.216.34')
      return new Response(null, { headers: { 'content-length': '9437184', 'content-type': 'image/jpeg' } })
    },
  })
  assert.equal(result.status, 200)
  assert.equal(result.headers.get('content-length'), '9437184')
})

test('DNS failure and empty answers never reach HTTP', async () => {
  for (const resolveHostname of [async () => [], async () => {
    throw new Error('DNS unavailable')
  }]) {
    let contacted = false
    await assert.rejects(publicFetch('https://dummy.example', {}, {
      resolveHostname,
      fetchDestination: async () => {
        contacted = true
        return new Response()
      },
    }))
    assert.equal(contacted, false)
  }
})
