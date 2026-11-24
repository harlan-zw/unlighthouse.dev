import { defineEventHandler, getHeader, parseCookies } from 'h3'
import { useRuntimeConfig } from 'nuxt/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const cookies = parseCookies(event)

  let session = null
  let sessionError = null
  try {
    session = await getUserSession(event)
  }
  catch (e: any) {
    sessionError = e.message
  }

  return {
    env: {
      hasApplicationSecret: !!config.appSecret,
      hasOAuthClientId: !!process.env.NUXT_OAUTH_GITHUB_CLIENT_ID,
      hasOAuthClientSecret: !!process.env.NUXT_OAUTH_GITHUB_CLIENT_SECRET,
      redirectUrl: process.env.NUXT_OAUTH_GITHUB_REDIRECT_URL || 'not set',
    },
    runtimeOauth: {
      hasClientId: !!config.oauth?.github?.clientId,
      clientIdPrefix: config.oauth?.github?.clientId?.slice(0, 8) || 'not set',
      hasClientSecret: !!config.oauth?.github?.clientSecret,
      redirectUrl: config.oauth?.github?.redirectURL || 'not set',
    },
    sessionConfig: {
      maxAge: config.session?.maxAge,
      sameSite: config.session?.cookie && typeof config.session.cookie === 'object' ? config.session.cookie.sameSite : undefined,
      secure: config.session?.cookie && typeof config.session.cookie === 'object' ? config.session.cookie.secure : undefined,
    },
    cookies: {
      hasAuthState: !!cookies['nuxt-auth-state'],
      hasSession: !!cookies['nuxt-auth-session'],
      allCookieNames: Object.keys(cookies),
    },
    session: session || null,
    sessionError,
    headers: {
      host: getHeader(event, 'host'),
      origin: getHeader(event, 'origin'),
      referer: getHeader(event, 'referer'),
    },
  }
})
