/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { describe, it } from 'node:test'
import { pathToFileURL } from 'node:url'

/**
 * Guards `patches/hookable@*.patch`.
 *
 * Cloudflare workerd DEFINES `console.createTask` and throws
 * ERR_METHOD_NOT_IMPLEMENTED the moment it is called. Stock hookable
 * feature-detects the method by existence (`if (console.createTask)`) and
 * adopts it, so every `callHook` throws. On a Nuxt worker that is every
 * dynamic route, served as a 500, which is what 574645e first stopped with a
 * rollup banner.
 *
 * It only bites once something drags `node:console` into the bundle. `undici`
 * does, via `node-fetch-native`.
 *
 * The banner in `nuxt.config.ts` still runs first in the built Worker and
 * clears the broken method globally, so it covers any library with the same
 * bad probe. This patch fixes the probe itself, so the behaviour is correct
 * even where the banner does not run, such as here under `node --test`.
 *
 * If a future install drops the patch, this fails rather than the site.
 */
/**
 * `hookable` is not hoisted under pnpm's strict layout, so it is resolved
 * through `nuxt`, which depends on it. Importing it by bare specifier would
 * need a top-level dependency, and pinning one here could resolve a different
 * copy than the app actually runs.
 */
function resolveHookable(): string {
  const require = createRequire(import.meta.url)
  const nuxtEntry = require.resolve('nuxt/package.json')
  const fromNuxt = createRequire(nuxtEntry)
  return pathToFileURL(fromNuxt.resolve('hookable')).href
}

describe('hookable against a console.createTask that throws', () => {
  it('still runs hooks', async () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'console')
    let probeCalls = 0
    Object.defineProperty(globalThis, 'console', {
      configurable: true,
      value: Object.assign(Object.create(globalThis.console), {
        createTask() {
          probeCalls += 1
          throw new Error('The Console.createTask method is not implemented')
        },
      }),
    })

    try {
      // hookable captures the method at module evaluation, so the stub has to
      // be in place before the import.
      const { createHooks } = await import(resolveHookable()) as typeof import('hookable')
      const hooks = createHooks<{ probe: (value: string) => void }>()
      const seen: string[] = []
      hooks.hook('probe', (value) => {
        seen.push(value)
      })

      await hooks.callHook('probe', 'ran')

      assert.deepEqual(seen, ['ran'])
      // Calling it once to discover it does not work is fine. Adopting it for
      // every later hook is the bug.
      assert.ok(probeCalls <= 1, `createTask called ${probeCalls} times`)
    }
    finally {
      if (original)
        Object.defineProperty(globalThis, 'console', original)
    }
  })
})
