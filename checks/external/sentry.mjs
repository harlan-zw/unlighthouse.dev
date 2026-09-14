import { defineSentryCheck } from '@harlan-zw/nuxt-sentry/checks'

export default defineSentryCheck({
  id: 'sentry.site',
  org: 'harlan-zw',
  project: 'unlighthouse',
  region: 'us',
})
