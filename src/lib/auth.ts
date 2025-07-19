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
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Skip database operations during build
        if (!process.env.DATABASE_URL) {
          return null
        }

        try {
          
          const user = await prisma.user.findUnique({
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

          if (!user) {
            return null
          }

          if (!user.password) {
            return null
          }
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name || '',
            role: user.role,
            customPermissions: user.customPermissions || undefined,
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