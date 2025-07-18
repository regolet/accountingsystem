'use client'

import { MainLayout } from './main-layout'

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  // For now, always use the main layout since NextAuth isn't installed yet
  return <MainLayout>{children}</MainLayout>
}