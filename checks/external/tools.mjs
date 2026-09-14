import { defineHttpCheck } from '@harlan-zw/nuxt-checkin/external'

export default defineHttpCheck({
  attempts: 2,
  id: 'site.tools',
  url: 'https://unlighthouse.dev/tools',
})
