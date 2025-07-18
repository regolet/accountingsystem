import NextAuth from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'ADMIN' | 'ACCOUNTANT' | 'VIEWER'
      customPermissions?: Record<string, boolean>
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: 'ADMIN' | 'ACCOUNTANT' | 'VIEWER'
    customPermissions?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'ADMIN' | 'ACCOUNTANT' | 'VIEWER'
    customPermissions?: Record<string, boolean>
  }
}