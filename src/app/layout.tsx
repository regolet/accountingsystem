import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthSessionProvider } from '@/components/providers/session-provider'
import { AuthWrapper } from '@/components/layout/auth-wrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Accounting System',
  description: 'Enterprise-grade accounting management system',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthSessionProvider>
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </AuthSessionProvider>
      </body>
    </html>
  )
}