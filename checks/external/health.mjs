import { checkReport, defineExternalCheck, readBoundedResponseText, unavailable } from '@harlan-zw/nuxt-checkin/external'
import { requiredChecks } from '../../shared/checkin.ts'
import { deployment } from '../lib/commands.mjs'

export default defineExternalCheck({
  id: 'site.report',
  async run(context) {
    const deployed = await deployment(context)
    if (!deployed.versionId)
      return unavailable('Deployed Worker identity is unavailable.')
    const response = await fetch('https://unlighthouse.dev/api/health', { signal: context.signal, redirect: 'error' })
    if (!response.ok) {
      await response.body?.cancel()
      return unavailable(`Health report returned HTTP ${response.status}.`)
    }
    const report = JSON.parse(await readBoundedResponseText(response, 2 * 1024 * 1024))
    const result = checkReport(report, {
      identity: { site: 'unlighthouse.dev', environment: 'production', deployment: deployed.versionId },
      required: requiredChecks,
      maxAgeMs: 60_000,
      now: context.clock(),
    })
    return 'evidence' in result ? { ...result, evidence: { ...result.evidence, report } } : result
  },
})
