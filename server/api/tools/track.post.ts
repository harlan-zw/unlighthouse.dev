import type { ToolName } from '../../database/schema'
import { trackToolUsage } from '../../utils/analytics'

const validTools: ToolName[] = [
  'lighthouse-report-viewer',
  'lighthouse-score-calculator',
]

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    tool: string
    action?: 'view' | 'use' | 'share' | 'export' | 'copy'
  }>(event)

  if (!body?.tool || !validTools.includes(body.tool as ToolName)) {
    throw createError({ statusCode: 400, message: 'Invalid tool' })
  }

  await trackToolUsage(event, body.tool, body.action || 'use')

  return { ok: true }
})
