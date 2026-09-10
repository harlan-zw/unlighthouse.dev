import { z } from 'zod'
import { getD1 } from '../../../../../../server/utils/db'
import { setFeedbackResolution } from '../../../../../../server/utils/feedback-resolution'
import { requireAdminAuth } from '../../../utils/admin'

const ParamsSchema = z.object({ id: z.string().min(1).max(100) })
const BodySchema = z.object({ resolved: z.boolean() })

/** Marks one feedback comment resolved or reopens it. */
export default defineEventHandler(async (event) => {
  await requireAdminAuth(event)
  const { id } = await getValidatedRouterParams(event, ParamsSchema.parse)
  const { resolved } = await readValidatedBody(event, BodySchema.parse)

  const d1 = getD1(event)
  if (!d1)
    throw createError({ statusCode: 500, message: 'Database not available' })

  const result = await setFeedbackResolution(d1, { id, resolved })
  if (result._tag === 'Err')
    throw createError({ statusCode: 404, message: 'Feedback not found' })

  return { id: result.id, resolvedAt: result.resolvedAt }
})
