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

const SECRET_QUERY_PARAM_RE = /\b(key|api_?key|access_token|auth_?token|token|password|secret|signature)=[^&"'\s]+/gi

/** Replace credential query parameter values with a placeholder. */
export function redactSecretsInText(text: string): string {
  return text.replace(SECRET_QUERY_PARAM_RE, (_match, parameter: string) => `${parameter}=[REDACTED]`)
}

interface SentryRedactableEvent {
  message?: string
  exception?: {
    values?: Array<{ value?: string }>
  }
  breadcrumbs?: Array<{
    message?: string
    data?: Record<string, unknown>
  }>
  request?: {
    url?: string
  }
}

function redactUnknown(value: unknown): unknown {
  return typeof value === 'string' ? redactSecretsInText(value) : value
}

/**
 * Strip credentials from every field of a Sentry event that carries free text.
 *
 * Defence in depth. Call sites should keep secrets out of error messages in the first place, but a
 * leak here becomes a permanent issue title that cannot be edited.
 */
export function redactSentrySecrets<T extends SentryRedactableEvent>(event: T | null): T | null {
  if (!event)
    return event

  if (typeof event.message === 'string')
    event.message = redactSecretsInText(event.message)

  for (const exception of event.exception?.values ?? []) {
    if (typeof exception.value === 'string')
      exception.value = redactSecretsInText(exception.value)
  }

  for (const breadcrumb of event.breadcrumbs ?? []) {
    if (typeof breadcrumb.message === 'string')
      breadcrumb.message = redactSecretsInText(breadcrumb.message)
    if (breadcrumb.data) {
      for (const [key, value] of Object.entries(breadcrumb.data))
        breadcrumb.data[key] = redactUnknown(value)
    }
  }

  if (typeof event.request?.url === 'string')
    event.request.url = redactSecretsInText(event.request.url)

  return event
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
