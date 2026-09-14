import { defineHttpCheck } from '@harlan-zw/nuxt-checkin/external'

export default defineHttpCheck({
  attempts: 2,
  id: 'site.glossary',
  url: 'https://unlighthouse.dev/glossary/lcp',
})
