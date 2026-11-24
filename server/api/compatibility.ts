import { defineEventHandler } from 'h3'

export default defineEventHandler((e) => {
  return {
    ASSETS: !!e?.context?.cloudflare?.env.ASSETS,
  }
})
