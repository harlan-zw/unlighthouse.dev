/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import routerOptions from '../app/router.options.ts'

test('ignores URL-state fragments that are not element ids', async () => {
  const originalDocument = globalThis.document
  const originalSetTimeout = globalThis.setTimeout
  const originalUseNuxtApp = (globalThis as any).useNuxtApp

  ;(globalThis as any).document = {
    getElementById() {
      return null
    },
    querySelector(selector: string) {
      throw new SyntaxError(`${selector} is not a valid selector`)
    },
  }
  ;(globalThis as any).useNuxtApp = () => ({ hooks: { hookOnce() {} } })
  ;(globalThis as any).setTimeout = (callback: (...args: any[]) => void, _delay: number, ...args: any[]) => {
    callback(...args)
    return 0
  }

  try {
    const position = await routerOptions.scrollBehavior?.(
      { path: '/tools/lighthouse-score-calculator', hash: '#device=mobile&FCP=3015' } as any,
      { path: '/tools/lighthouse-score-calculator' } as any,
      null,
    )

    assert.equal(position, undefined)
  }
  finally {
    globalThis.document = originalDocument
    globalThis.setTimeout = originalSetTimeout
    ;(globalThis as any).useNuxtApp = originalUseNuxtApp
  }
})

test('returns the resolved element instead of the raw hash', async () => {
  const originalDocument = globalThis.document
  const originalSetTimeout = globalThis.setTimeout
  const originalGetComputedStyle = (globalThis as any).getComputedStyle
  const originalUseNuxtApp = (globalThis as any).useNuxtApp

  const element = { id: 'device=mobile&FCP=3015' }
  ;(globalThis as any).document = {
    getElementById(id: string) {
      return id === 'device=mobile&FCP=3015' ? element : null
    },
    querySelector() {
      throw new SyntaxError('querySelector must not be called')
    },
  }
  ;(globalThis as any).getComputedStyle = () => ({ scrollMarginTop: '12px' })
  ;(globalThis as any).useNuxtApp = () => ({ hooks: { hookOnce() {} } })
  ;(globalThis as any).setTimeout = (callback: (...args: any[]) => void, _delay: number, ...args: any[]) => {
    callback(...args)
    return 0
  }

  try {
    const position = await routerOptions.scrollBehavior?.(
      { path: '/tools/lighthouse-score-calculator', hash: '#device=mobile&FCP=3015' } as any,
      { path: '/tools/lighthouse-score-calculator' } as any,
      null,
    )

    assert.deepEqual(position, { el: element, behavior: 'smooth', top: 12 })
  }
  finally {
    globalThis.document = originalDocument
    globalThis.setTimeout = originalSetTimeout
    ;(globalThis as any).getComputedStyle = originalGetComputedStyle
    ;(globalThis as any).useNuxtApp = originalUseNuxtApp
  }
})
