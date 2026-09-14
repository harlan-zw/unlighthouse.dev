import { defineHttpCheck } from '@harlan-zw/nuxt-checkin/external'

export default defineHttpCheck({
  attempts: 2,
  id: 'site.docs',
  url: 'https://unlighthouse.dev/integrations/cli',
})
