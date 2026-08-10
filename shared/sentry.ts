export const SENTRY_DSN = 'https://51433a56963f6765e73969dbca31337e@o4510507748163584.ingest.us.sentry.io/4511887362555904'

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
