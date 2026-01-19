import { eq } from 'drizzle-orm'
import { users } from '../../database/schema'
import { useDB } from '../../utils/db'

const ADMIN_EMAILS = ['harlan@harlanzw.com']

export default defineOAuthGitHubEventHandler({
  config: {
    scope: ['read:user', 'user:email'],
  },
  async onSuccess(event, { user, tokens }) {
    // Fetch user emails from GitHub
    const emails = await $fetch<{ email: string, primary: boolean, verified: boolean }[]>(
      'https://api.github.com/user/emails',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: 'application/vnd.github+json',
        },
      },
    ).catch(() => [])

    const verifiedEmails = emails
      .filter(e => e.verified)
      .sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0))
      .map(e => e.email)

    const primaryEmail = verifiedEmails[0] || user.email

    // Upsert user in database
    const db = useDB(event)
    const existingUser = await db.select().from(users).where(eq(users.githubId, user.id)).get()

    let dbUser
    if (existingUser) {
      await db.update(users).set({
        githubLogin: user.login,
        githubEmail: primaryEmail,
        githubAvatarUrl: user.avatar_url,
        isAdmin: ADMIN_EMAILS.includes(primaryEmail),
        updatedAt: new Date(),
      }).where(eq(users.id, existingUser.id))
      dbUser = existingUser
    }
    else {
      dbUser = await db.insert(users).values({
        githubId: user.id,
        githubLogin: user.login,
        githubEmail: primaryEmail,
        githubAvatarUrl: user.avatar_url,
        isAdmin: ADMIN_EMAILS.includes(primaryEmail),
      }).returning().get()
    }

    await setUserSession(event, {
      user: {
        id: dbUser?.id,
        githubId: user.id,
        login: user.login,
        email: primaryEmail,
        avatarUrl: user.avatar_url,
      },
    })

    return sendRedirect(event, '/admin')
  },
  onError(event, error) {
    console.error('[github auth] OAuth error:', error)
    return sendRedirect(event, `/admin?error=${encodeURIComponent(error.message || 'auth_failed')}`)
  },
})
