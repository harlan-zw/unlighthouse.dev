import type { NitroAppPlugin } from 'nitro/types'
import { setCloudflareBindings } from '@harlan-zw/nuxt-cloudflare/bindings'
import { getPlatformProxy } from 'wrangler'

export default (async (nitroApp) => {
  const platform = await getPlatformProxy({ configPath: 'wrangler.local.toml', remoteBindings: false })
  setCloudflareBindings(platform.env)

  nitroApp.hooks.hook('request', (event) => {
    event.context.cloudflare = {
      env: platform.env,
      context: platform.ctx,
      request: event.req,
    }
  })

  nitroApp.hooks.hook('close', () => platform.dispose())
}) satisfies NitroAppPlugin
