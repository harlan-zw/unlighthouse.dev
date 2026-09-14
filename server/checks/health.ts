import type { H3Event } from 'h3'
import { defineCheck, unavailable } from '@harlan-zw/nuxt-checkin/server'
import { getD1 } from '../utils/db'
import { evaluateHealthCheck } from '../utils/health-check'
import readHealthReport from '../utils/health-report'

export default defineCheck<H3Event>({
  id: 'site.health',
  async run(context) {
    const db = getD1(context.event)
    if (!db)
      return unavailable('Database health evidence is unavailable.')
    const value = await context.collect(db, 'site.health', async () => ({
      value: await readHealthReport(context.event, context.now),
      metrics: { requests: 1 },
    }))
    return evaluateHealthCheck(value)
  },
})
