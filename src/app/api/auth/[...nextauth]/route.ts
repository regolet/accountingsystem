import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth({
  ...authOptions,
  // Override for Netlify compatibility
  callbacks: {
    ...authOptions.callbacks,
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
})

export { handler as GET, handler as POST }