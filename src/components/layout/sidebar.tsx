'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  TrendingUp, 
  Settings, 
  Coins,
  Building2,
  LogOut,
  UserCircle
} from 'lucide-react'
import { hasGranularPermission } from '@/lib/permissions'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard' as const,
    icon: LayoutDashboard,
    permission: 'viewDashboard' as const,
  },
  {
    name: 'Customers',
    href: '/customers' as const,
    icon: Users,
    permission: 'viewCustomers' as const,
  },
  {
    name: 'Invoices',
    href: '/invoices' as const,
    icon: FileText,
    permission: 'viewInvoices' as const,
  },
  {
    name: 'Subscriptions',
    href: '/subscriptions' as const,
    icon: Coins,
    permission: 'viewSubscriptions' as const,
  },
  {
    name: 'Reports',
    href: '/reports' as const,
    icon: TrendingUp,
    permission: 'viewReports' as const,
  },
  {
    name: 'Settings',
    href: '/settings' as const,
    icon: Settings,
    permission: 'viewSettings' as const,
  },
]

function UserProfile() {
  const { data: session } = useSession()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  if (!session?.user) return null

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-white">
            {getInitials(session.user.name || 'User')}
          </span>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{session.user.name}</p>
          <p className="text-xs text-gray-400">{session.user.email}</p>
        </div>
      </div>
      <div className="space-y-1">
        <Link
          href="/profile"
          className="w-full flex items-center px-2 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          <UserCircle className="h-4 w-4 mr-2" />
          My Profile
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center px-2 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  // Filter navigation items based on permissions
  const filteredNavigation = navigation.filter(item => 
    hasGranularPermission(session?.user?.role || 'VIEWER', item.permission, session?.user?.customPermissions)
  )
  
  // Add Users tab for admins
  const navigationItems = isAdmin 
    ? [...filteredNavigation, { name: 'Users', href: '/users' as const, icon: Users, permission: 'viewUsers' as const }]
    : filteredNavigation

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 bg-gray-800">
        <Building2 className="h-8 w-8 text-primary-400" />
        <span className="ml-3 text-lg font-semibold">AccountingPro</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <UserProfile />
      </div>
    </div>
  )
}