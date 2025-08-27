import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
    } & DefaultSession['user']
    socketPassword?: string
    accessToken?: string
    jwt?: string
    coins?: number
  }

  interface User {
    id: string
    username?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    socketPassword?: string
    accessToken?: string
    jwt?: string
    coins?: number
  }
}
