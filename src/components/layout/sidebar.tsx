'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  TrendingUp, 
  Settings, 
  Coins,
  Building2,
  LogOut,
  UserCircle,
  Calculator,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  BarChart3,
  TrendingDown,
  Receipt,
  LucideIcon
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
    name: 'Accounting',
    icon: Calculator,
    type: 'group' as const,
    children: [
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
        name: 'Services',
        href: '/subscriptions' as const,
        icon: Coins,
        permission: 'viewSubscriptions' as const,
      },
      {
        name: 'Expenses',
        href: '/expenses' as const,
        icon: Receipt,
        permission: 'viewExpenses' as const,
      },
      {
        name: 'Reports',
        href: '/reports' as const,
        icon: TrendingUp,
        permission: 'viewReports' as const,
      },
    ]
  },
  {
    name: 'HRMS',
    icon: Briefcase,
    type: 'group' as const,
    children: [
      {
        name: 'Employees',
        href: '/hrms/employees' as const,
        icon: Users,
        permission: 'viewEmployees' as const,
      },
      {
        name: 'Attendance',
        href: '/hrms/attendance' as const,
        icon: Clock,
        permission: 'viewAttendance' as const,
      },
      {
        name: 'Payroll',
        href: '/hrms/payroll' as const,
        icon: DollarSign,
        permission: 'viewPayroll' as const,
      },
      {
        name: 'Payslips',
        href: '/hrms/payslips' as const,
        icon: FileText,
        permission: 'viewPayroll' as const,
      },
      {
        name: 'Earnings',
        href: '/hrms/earnings' as const,
        icon: TrendingUp,
        permission: 'viewEarnings' as const,
      },
      {
        name: 'Deductions',
        href: '/hrms/deductions' as const,
        icon: TrendingDown,
        permission: 'viewDeductions' as const,
      },
      {
        name: 'HR Reports',
        href: '/hrms/reports' as const,
        icon: BarChart3,
        permission: 'viewHRReports' as const,
      },
    ]
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
      <div className="flex items-center min-w-0">
        <div className="h-6 w-6 sm:h-8 sm:w-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xs sm:text-sm font-medium text-white">
            {getInitials(session.user.name || 'User')}
          </span>
        </div>
        <div className="ml-2 sm:ml-3 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium truncate">{session.user.name}</p>
          <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
        </div>
      </div>
      <div className="space-y-1">
        <Link
          href="/profile"
          className="w-full flex items-center px-2 py-1 sm:py-2 text-xs sm:text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          <UserCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
          <span className="truncate">My Profile</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center px-2 py-1 sm:py-2 text-xs sm:text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
          <span className="truncate">Sign out</span>
        </button>
      </div>
    </div>
  )
}

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps = {}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Accounting'])

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    )
  }

  // Filter navigation items based on permissions
  const filteredNavigation = navigation.map(item => {
    if (item.type === 'group') {
      const filteredChildren = item.children?.filter(child => 
        hasGranularPermission(session?.user?.role || 'VIEWER', child.permission, session?.user?.customPermissions)
      )
      return { ...item, children: filteredChildren }
    }
    return hasGranularPermission(session?.user?.role || 'VIEWER', item.permission, session?.user?.customPermissions) ? item : null
  }).filter((item): item is typeof navigation[0] => item !== null)
  
  // Add Users tab for admins
  const navigationItems = isAdmin 
    ? [...filteredNavigation, { name: 'Users', href: '/users' as const, icon: Users, permission: 'viewUsers' as const }]
    : filteredNavigation

  const renderNavItem = (item: typeof navigation[0] | { name: string; href: string; icon: LucideIcon; permission: string }) => {
    if ('type' in item && item.type === 'group') {
      const isExpanded = expandedGroups.includes(item.name)
      const hasActiveChild = 'type' in item && item.type === 'group' && item.children?.some((child) => pathname === child.href)
      
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleGroup(item.name)}
            className={`w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium rounded-lg transition-colors ${
              hasActiveChild
                ? 'bg-primary-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <div className="flex items-center min-w-0">
              <item.icon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-2 sm:ml-4 mt-1 space-y-1">
              {'type' in item && item.type === 'group' && item.children?.map((child) => {
                const isActive = pathname === child.href
                return (
                  <Link
                    key={child.name}
                    href={child.href}
                    onClick={onClose}
                    className={`flex items-center px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <child.icon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="truncate">{child.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    const isActive = pathname === item.href
    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={onClose}
        className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium rounded-lg transition-colors ${
          isActive
            ? 'bg-primary-600 text-white'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        }`}
      >
        <item.icon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
        <span className="truncate">{item.name}</span>
      </Link>
    )
  }

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white h-full overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 bg-gray-800">
        <div className="flex items-center min-w-0">
          <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary-400 flex-shrink-0" />
          <span className="ml-2 sm:ml-3 text-base sm:text-lg font-semibold truncate">AccountingPro</span>
        </div>
        {/* Close button for mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-2">
        {navigationItems.map(renderNavItem)}
      </nav>

      {/* Footer */}
      <div className="p-3 sm:p-4 border-t border-gray-800">
        <UserProfile />
      </div>
    </div>
  )
}