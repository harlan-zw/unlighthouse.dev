import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'pathe'

export interface CloudflareRoutes {
  version: number
  include: string[]
  exclude: string[]
}

/** Prerendered page trees. Nitro lists every prerendered page as an excluded asset; the wildcard covers them all. */
const prerenderedPrefixes = ['/guide', '/api-doc', '/integrations']

/**
 * Routes Cloudflare serves as static assets without invoking the Worker.
 *
 * `/_og/d/*` is registered by nuxt-og-image even with `zeroRuntime`, and its
 * handler throws "Not supported in zeroRuntime mode." outside dev and
 * prerender. Excluding it turns stale crawler requests into 404s at the edge.
 */
const workerExcludedRoutes = ['/guide/*', '/api-doc/*', '/integrations/*', '/_og/d/*']

/**
 * Rewrites `_routes.json` in a built public dir: prerendered page entries
 * collapse into one wildcard per tree, and worker-only routes get excluded.
 *
 * Returns the exclude list size before and after, or null when the file does
 * not exist (no Cloudflare preset ran).
 */
export async function optimizeCloudflareRoutes(publicDir: string): Promise<{ before: number, after: number } | null> {
  const routesPath = join(publicDir, '_routes.json')
  if (!existsSync(routesPath)) {
    return null
  }
  const routes: CloudflareRoutes = JSON.parse(await readFile(routesPath, 'utf8'))
  const before = routes.exclude.length
  routes.exclude = routes.exclude.filter((path) => {
    return !prerenderedPrefixes.some(prefix => path.startsWith(prefix))
  })
  for (const route of workerExcludedRoutes) {
    if (!routes.exclude.includes(route)) {
      routes.exclude.push(route)
    }
  }
  await writeFile(routesPath, JSON.stringify(routes, void 0, 2))
  return { before, after: routes.exclude.length }
}
