import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      jwt?: string
      socketPassword?: string
      coins?: number
      vipLevel?: number
      avatarIndex?: number
      avatarUrl?: string
      isVisitor?: boolean
      isManager?: boolean
    } & DefaultSession['user']
  }

  interface User {
    id: string
    username?: string
    jwt?: string
    socketPassword?: string
    coins?: number
    vipLevel?: number
    avatarIndex?: number
    avatarUrl?: string
    isManager?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    userId?: string
    userName?: string
    userAccount?: string
    socketPassword?: string
    accessToken?: string
    jwt?: string
    coins?: number
    vipLevel?: number
    avatarIndex?: number
    avatarUrl?: string
    integral?: number
    avatar?: string
    fullName?: string
    isManager?: boolean
  }
}
