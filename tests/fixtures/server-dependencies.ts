import { createError } from 'h3'

export { createError }

type Boundary = (...args: unknown[]) => unknown
const fixtures = globalThis as unknown as Record<string, Boundary>

export const defineCachedHandler = <Handler>(handler: Handler): Handler => handler
export const defineEventHandler = defineCachedHandler
export const getQuery: Boundary = (...args) => fixtures.getQuery!(...args)
export const readBody: Boundary = (...args) => fixtures.readBody!(...args)
export const checkFreeToolRateLimit: Boundary = (...args) => fixtures.checkFreeToolRateLimit!(...args)
export const fetchPSI: Boundary = (...args) => fixtures.fetchPSI!(...args)
export const trackToolRequest: Boundary = (...args) => fixtures.trackToolRequest!(...args)
export const normalizeUrl: Boundary = (...args) => fixtures.normalizeUrl!(...args)
export const validateUrl: Boundary = (...args) => fixtures.validateUrl!(...args)
export const isValidUrl: Boundary = (...args) => fixtures.isValidUrl!(...args)
export const useRuntimeConfig: Boundary = (...args) => fixtures.useRuntimeConfig!(...args)
export const $fetch: Boundary = (...args) => fixtures.$fetch!(...args)
