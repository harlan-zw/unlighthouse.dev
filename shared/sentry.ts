export const SENTRY_DSN = 'https://51433a56963f6765e73969dbca31337e@o4510507748163584.ingest.us.sentry.io/4511887362555904'

interface SentryClientEvent {
  exception?: {
    values?: Array<{
      type?: string
      value?: string
      stacktrace?: { frames?: unknown[] }
      mechanism?: {
        type?: string
        handled?: boolean
      }
    }>
  }
  breadcrumbs?: Array<{
    category?: string
    message?: string
    data?: Record<string, unknown>
  }>
}

export function filterKnownClientNoise<T extends SentryClientEvent>(event: T): T | null {
  const isStacklessManifestFetchFailure = event.exception?.values?.some(exception =>
    exception.type === 'TypeError'
    && exception.value === 'Failed to fetch'
    && exception.mechanism?.type === 'auto.browser.global_handlers.onunhandledrejection'
    && exception.mechanism.handled === false
    && !exception.stacktrace?.frames?.length,
  )
  const hasManifestRequest = event.breadcrumbs?.some(breadcrumb =>
    breadcrumb.category === 'fetch'
    && typeof breadcrumb.data?.url === 'string'
    && breadcrumb.data.url.startsWith('/_nuxt/builds/meta/'),
  )
  const hasManifestDiagnostic = event.breadcrumbs?.some(breadcrumb =>
    breadcrumb.category === 'console'
    && breadcrumb.message === '[NUXT_E5002]',
  )

  return isStacklessManifestFetchFailure && hasManifestRequest && hasManifestDiagnostic
    ? null
    : event
}

export function sentryRelease(): string | undefined {
  return process.env.SENTRY_RELEASE || process.env.GITHUB_SHA || undefined
}

export function createSentryDataCollection() {
  return {
    userInfo: false,
    cookies: false,
    httpHeaders: { request: false, response: false },
    httpBodies: [],
    urlQueryParams: false,
    graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    stackFrameVariables: false,
  }
}
