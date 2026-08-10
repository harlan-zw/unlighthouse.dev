import type { ToolId } from '~~/shared/tool-catalog'
import { toolCatalog } from '~~/shared/tool-catalog'

const validTools = new Set<string>(toolCatalog.map(tool => tool.id))
const validActions = new Set(['view', 'use', 'share', 'export', 'copy'] as const)
type ToolAction = 'view' | 'use' | 'share' | 'export' | 'copy'

function parseToolId(value: unknown): ToolId {
  if (typeof value !== 'string' || !validTools.has(value))
    throw createError({ statusCode: 400, message: 'Invalid tool' })
  return value as ToolId
}

function parseToolAction(value: unknown): ToolAction {
  if (value === undefined)
    return 'use'
  if (typeof value !== 'string' || !validActions.has(value as ToolAction))
    throw createError({ statusCode: 400, message: 'Invalid action' })
  return value as ToolAction
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    tool?: unknown
    action?: unknown
  }>(event)

  const tool = parseToolId(body?.tool)
  const action = parseToolAction(body?.action)

  await trackToolUsage(event, tool, action)

  return { ok: true }
})
