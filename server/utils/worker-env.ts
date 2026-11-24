import type { RequestEvent } from 'nuxt/server'

export type CloudflareRequest = Pick<RequestEvent, 'context'> & { req?: object }

export function getWorkerEnv<Bindings extends object>(event: CloudflareRequest): Partial<Bindings> | undefined {
  interface Cloudflare { env?: Partial<Bindings> }
  const request = event.req as { runtime?: { cloudflare?: Cloudflare } } | undefined
  const legacy = event.context.cloudflare as Cloudflare | undefined
  return request?.runtime?.cloudflare?.env ?? legacy?.env
}
