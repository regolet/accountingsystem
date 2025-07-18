'use client'

import { useSession } from 'next-auth/react'
import { hasGranularPermission } from '@/lib/permissions'
import { permissions } from '@/lib/permissions'

interface RoleGuardProps {
  permission: keyof typeof permissions
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ permission, children, fallback = null }: RoleGuardProps) {
  const { data: session } = useSession()
  
  if (!session?.user?.role) {
    return <>{fallback}</>
  }
  
  if (!hasGranularPermission(session.user.role, permission, session.user.customPermissions)) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}