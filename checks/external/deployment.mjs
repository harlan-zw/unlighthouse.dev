import { defineExternalCheck, pass, unavailable } from '@harlan-zw/nuxt-checkin/external'
import { deployment } from '../lib/commands.mjs'

export default defineExternalCheck({
  id: 'site.deployment',
  async run(context) {
    const latest = await deployment(context)
    return latest.versionId ? pass({ latest }) : unavailable('A single deployed Worker version is unavailable.')
  },
})
