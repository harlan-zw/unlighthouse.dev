import type { H3Event } from 'h3'

const ADMIN_EMAILS = ['harlan@harlanzw.com']

export function isAdminEmail(email: string) {
  return ADMIN_EMAILS.includes(email)
}

export async function requireAdminAuth(event: H3Event) {
  const session = await getUserSession(event)

  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  return session
}
