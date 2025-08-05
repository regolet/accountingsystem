import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

// Generate a fallback secret for build time only
const buildTimeSecret = process.env.NODE_ENV === 'production' 
  ? undefined 
  : 'dev-secret-only-for-local-development'

if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  console.warn('⚠️  NEXTAUTH_SECRET is not set in production environment')
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || buildTimeSecret,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('Authorization attempt for:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        // Skip database operations during build
        if (!process.env.DATABASE_URL) {
          console.log('No DATABASE_URL, skipping auth')
          return null
        }

        try {
          // Add connection retry logic for database queries
          let retries = 3
          let user = null
          
          while (retries > 0 && !user) {
            try {
              user = await prisma.user.findUnique({
                where: {
                  email: credentials.email
                },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  password: true,
                  role: true,
                  customPermissions: true
                }
              })
              break
            } catch (dbError: unknown) {
              const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error'
              if (errorMessage.includes('prepared statement') || errorMessage.includes('42P05')) {
                retries--
                if (retries > 0) {
                  console.log(`Database query failed, retrying... (${retries} attempts left)`)
                  await new Promise(resolve => setTimeout(resolve, 500))
                  continue
                }
              }
              throw dbError
            }
          }

          if (!user) {
            console.log('User not found:', credentials.email)
            return null
          }

          if (!user.password) {
            console.log('User has no password set:', credentials.email)
            return null
          }
          
          console.log('Comparing password for user:', credentials.email)
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log('Password validation failed for:', credentials.email)
            return null
          }
          console.log('User authentication successful:', { 
            id: user.id, 
            email: user.email, 
            role: user.role 
          })
          
          return {
            id: user.id,
            email: user.email,
            name: user.name || '',
            role: user.role,
            customPermissions: user.customPermissions || '',
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Parse custom permissions from JSON string
        let customPermissions: Record<string, boolean> = {}
        if (user.customPermissions) {
          try {
            customPermissions = JSON.parse(user.customPermissions)
          } catch (error) {
            console.error('Error parsing custom permissions:', error)
          }
        }
        
        return {
          ...token,
          role: user.role,
          customPermissions,
        }
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          role: token.role,
          customPermissions: token.customPermissions,
        }
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}