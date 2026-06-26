declare module '#auth-utils' {
  interface User {
    id?: string | number
    githubId?: string | number
    login?: string
    email?: string
    avatarUrl?: string
  }
}

export {}
