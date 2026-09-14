import { defineHttpCheck } from '@harlan-zw/nuxt-checkin/external'

export default defineHttpCheck({
  attempts: 2,
  id: 'site.home',
  url: 'https://unlighthouse.dev/',
})
