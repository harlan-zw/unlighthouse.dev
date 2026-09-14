import { defineExternalCheck, readBoundedResponseText, unavailable } from '@harlan-zw/nuxt-checkin/external'
import { wrangler } from '../lib/commands.mjs'
import { evaluateWorkers } from '../lib/evidence.mjs'

export default defineExternalCheck({
  id: 'cloudflare.workers',
  async run(context) {
    const token = context.env.CLOUDFLARE_API_TOKEN || context.env.CF_API_TOKEN
      || (await wrangler(context, ['auth', 'token', '--json'])).token
    if (!token)
      return unavailable('Cloudflare read credential is unavailable.')
    const query = `query { viewer { accounts(filter: {accountTag: "5904138d55ca25d5670dca6adf99894e"}) { workersInvocationsAdaptive(limit: 100, filter: {scriptName: "unlighthouse-dev", datetime_geq: "${context.since.toISOString()}", datetime_leq: "${context.now.toISOString()}"}) { dimensions { scriptName status } sum { requests errors } quantiles { cpuTimeP99 } } } } }`
    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: context.signal,
      redirect: 'error',
    })
    const body = JSON.parse(await readBoundedResponseText(response, 2 * 1024 * 1024))
    if (!response.ok || body.errors?.length)
      return unavailable(`Cloudflare query failed with HTTP ${response.status}.`)
    const rows = body.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive
    if (!Array.isArray(rows))
      return unavailable('Worker outcome data is unavailable.')
    const outcomes = {}
    let errors = 0
    for (const row of rows) {
      if (row.dimensions?.scriptName !== 'unlighthouse-dev')
        return unavailable('Worker outcome data belongs to a different Worker.')
      outcomes[row.dimensions.status] = (outcomes[row.dimensions.status] ?? 0) + row.sum.requests
      errors += row.sum.errors ?? 0
    }
    const result = evaluateWorkers({
      since: context.since.toISOString(),
      until: context.now.toISOString(),
      outcomes,
      errors,
      nonOk: Object.entries(outcomes).filter(([status]) => !['success', 'clientDisconnected', 'responseStreamDisconnected'].includes(status)).map(([status, requests]) => ({ status, requests })),
    })
    return rows.length >= 100
      ? { _tag: 'Warn', reason: 'Worker outcomes may be truncated.', coverage: 'incomplete', evidence: { since: context.since.toISOString(), until: context.now.toISOString(), outcomes, errors } }
      : result
  },
})
