export const state = { delay: 0, psiCalls: 0 }
export const logger = { warn: () => {} }
const runtimeConfig = () => ({ googleApiToken: 'fixture-only' })
export { runtimeConfig as useRuntimeConfig }
export async function $fetch() {
  state.psiCalls++
  if (state.delay)
    await new Promise(resolve => setTimeout(resolve, state.delay))
  return { lighthouseResult: { audits: {}, categories: { performance: { score: 1 } } } }
}
export async function publicFetch() {
  return new Response('<html></html>', { headers: { 'content-type': 'text/html' } })
}
export async function trackToolRequest(_event: unknown, _metadata: unknown, work: () => Promise<unknown>) {
  return work()
}
export function initOctokitRequestHandler() {
  return {
    owner: 'fixture',
    repo: 'fixture',
    octokit: {
      request: async (route: string, options: { path: string, sha: string }) => {
        if (route.endsWith('/releases'))
          return { data: [{ tag_name: 'v2', published_at: null, body: 'second' }, { tag_name: 'v1', published_at: null, body: 'first' }] }
        return { data: [{ commit: { author: { name: 'Fixture', date: '2026-01-01' }, message: `${options.path}:${options.sha}` }, committer: { login: 'fixture' }, html_url: 'https://example.com/commit' }] }
      },
    },
  }
}
