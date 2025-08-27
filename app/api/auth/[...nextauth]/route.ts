import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import crypto from 'crypto'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // Hash the password with MD5
        const passwordHash = crypto.createHash('md5').update(credentials.password).digest('hex')
        
        try {
          // Call the backend login endpoint with form data
          const formData = new URLSearchParams()
          formData.append('username', credentials.username)
          formData.append('password', passwordHash)
          
          console.log('Login request:', {
            url: `${process.env.NEXT_PUBLIC_API_URL}/oauth/customer_login`,
            username: credentials.username,
            passwordHash: passwordHash.substring(0, 8) + '...',
            formData: formData.toString()
          })
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/oauth/customer_login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
          })

          console.log('Login response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          })

          const data = await response.json()
          console.log('Login data:', data)
          
          if (data.code === 20000 && data.data) {
            // Store JWT token and get user info
            const jwt = data.data.jwt

            // Get user info with the JWT token
            const userInfoResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/v1/getCustomerInfo`,
              {
                headers: {
                  'Authorization': `Bearer ${jwt}`,
                },
              }
            )

            const userInfoData = await userInfoResponse.json()

            if (userInfoData.code === 20000 && userInfoData.data) {
              const userData = userInfoData.data.data
              
              return {
                id: String(userData.id),
                name: userData.username || credentials.username,
                email: `${userData.username}@msaarcade.com`,
                jwt: jwt,
                socketPassword: userInfoData.data.socketTempPwd,
                coins: userData.gold || 0,
                integral: userData.integral || 0,
                avatar: userData.avatar,
                fullName: userData.fullName,
              }
            }
          }

          return null
        } catch (error) {
          console.error('Login error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.name || ''
        token.jwt = (user as any).jwt
        token.socketPassword = (user as any).socketPassword
        token.coins = (user as any).coins
        token.integral = (user as any).integral
        token.avatar = (user as any).avatar
        token.fullName = (user as any).fullName
      }
      return token
    },
    session: async ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          username: token.username as string,
        },
        socketPassword: token.socketPassword as string,
        jwt: token.jwt as string,
        coins: token.coins as number,
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
