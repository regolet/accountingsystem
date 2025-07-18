'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { MainLayout } from './main-layout'

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  const isAuthPage = pathname?.startsWith('/auth')
  const isHomePage = pathname === '/'

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // For auth pages and home page, don't use the main layout
  if (isAuthPage || isHomePage) {
    return <>{children}</>
  }

  // For authenticated pages, use the main layout with sidebar
  if (session) {
    return <MainLayout>{children}</MainLayout>
  }

  // For non-authenticated users, just render children (middleware will handle redirects)
  return <>{children}</>
}