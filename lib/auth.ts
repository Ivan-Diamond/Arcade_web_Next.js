import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import crypto from 'crypto'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        isJwtAuth: { label: "Is JWT Auth", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // Check if this is JWT-based re-authentication (after username change)
        if (credentials.isJwtAuth === 'true') {
          // Use the JWT token directly for re-authentication
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://msaarcade.com/game/uaa'
          
          try {
            // Verify the JWT by getting user info
            const response = await fetch(`${API_BASE_URL}/customer/info`, {
              headers: {
                'Authorization': `Bearer ${credentials.password}` // JWT is passed as password
              }
            })
            
            if (response.ok) {
              const data = await response.json()
              if (data.success && data.data) {
                return {
                  id: data.data.id || credentials.username,
                  name: credentials.username,
                  jwt: credentials.password,
                  coins: data.data.coins || 0,
                  integral: data.data.integral || 0,
                  socketPassword: data.data.socketPassword || '',
                  avatar: data.data.avatar || '',
                  fullName: data.data.fullName || ''
                }
              }
            }
            return null
          } catch (error) {
            console.error('JWT re-auth error:', error)
            return null
          }
        }

        // Check if this is a visitor account (don't hash visitor passwords)
        const isVisitor = credentials.username.toLowerCase().startsWith('visitor') || 
                         credentials.username.toLowerCase().startsWith('guest')
        
        // Hash the password with MD5 only for non-visitor accounts
        const password = isVisitor ? credentials.password : crypto.createHash('md5').update(credentials.password).digest('hex')
        
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://msaarcade.com/game/uaa'
          
          // Send as URL-encoded form data (application/x-www-form-urlencoded)
          const params = new URLSearchParams()
          params.append('username', credentials.username)
          params.append('password', password)
          
          const url = `${API_BASE_URL}/oauth/customer_login`
          
          console.log('Login request:', {
            url: url,
            username: credentials.username,
            password: password.substring(0, 8) + '...',
            isVisitor: isVisitor,
            body: params.toString()
          })
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
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
              `${API_BASE_URL}/v1/getCustomerInfo`,
              {
                headers: {
                  'Authorization': `Bearer ${jwt}`,
                },
              }
            )
            
            console.log('User info response:', {
              status: userInfoResponse.status,
              statusText: userInfoResponse.statusText,
            })

            const userInfoData = await userInfoResponse.json()
            console.log('User info data:', userInfoData)

            if (userInfoData.code === 20000 && userInfoData.data) {
              const userData = userInfoData.data.data
              console.log('User data:', userData)
              
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
    async jwt({ token, user, trigger, session }) {
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
      
      // Handle session updates (when update() is called)
      if (trigger === 'update' && session) {
        console.log('Updating JWT token with session data:', session)
        if (session.username) {
          token.username = session.username
        }
        if (session.jwt) {
          token.jwt = session.jwt
        }
        // Also update other user properties if they're provided
        if (session.coins !== undefined) {
          token.coins = session.coins
        }
      }
      
      return token
    },
    session: async ({ session, token }) => {
      // Add user data to session from JWT token
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.username as string;
        session.user.username = token.username as string; // Ensure both name and username are set
        session.user.jwt = token.jwt as string;
        session.user.socketPassword = token.socketPassword as string;
        session.user.coins = token.coins as number;
        (session.user as any).integral = token.integral as number;
        (session.user as any).avatar = token.avatar as string;
        (session.user as any).fullName = token.fullName as string;
        
        // Check if this is a visitor account - use the actual account name from token
        const username = (token.username as string || '');
        session.user.isVisitor = username.toLowerCase().startsWith('visitor') || 
                                username.toLowerCase().startsWith('guest');
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}
