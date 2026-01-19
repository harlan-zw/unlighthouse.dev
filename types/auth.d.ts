declare module '#auth-utils' {
  interface User {
    id: string
    githubId: number
    login: string
    email?: string
    avatarUrl?: string
  }
}

export {}
