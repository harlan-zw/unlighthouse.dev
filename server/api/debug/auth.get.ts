export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
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
      hasSessionPassword: !!config.session?.password,
      sessionPasswordLength: config.session?.password?.length || 0,
      hasOAuthClientId: !!process.env.NUXT_OAUTH_GITHUB_CLIENT_ID,
      hasOAuthClientSecret: !!process.env.NUXT_OAUTH_GITHUB_CLIENT_SECRET,
      redirectUrl: process.env.NUXT_OAUTH_GITHUB_REDIRECT_URL || 'not set',
    },
    runtimeOauth: {
      hasClientId: !!config.oauth?.github?.clientId,
      clientIdPrefix: config.oauth?.github?.clientId?.slice(0, 8) || 'not set',
      hasClientSecret: !!config.oauth?.github?.clientSecret,
      redirectUrl: config.oauth?.github?.redirectUrl || 'not set',
    },
    sessionConfig: {
      maxAge: config.session?.maxAge,
      sameSite: config.session?.cookie?.sameSite,
      secure: config.session?.cookie?.secure,
    },
    cookies: {
      hasAuthState: !!cookies['nuxt-auth-state'],
      hasSession: !!cookies['nuxt-session'],
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
