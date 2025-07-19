'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  TrendingUp, 
  Settings,
  Plus,
  Minus, 
  Building2,
  LogOut,
  Coins,
  Clock,
  DollarSign,
  BarChart3,
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard' as const,
    icon: LayoutDashboard,
  },
  {
    name: 'Customers',
    href: '/customers' as const,
    icon: Users,
  },
  {
    name: 'Invoices',
    href: '/invoices' as const,
    icon: FileText,
  },
  {
    name: 'Services',
    href: '/subscriptions' as const,
    icon: Coins,
  },
  {
    name: 'Reports',
    href: '/reports' as const,
    icon: TrendingUp,
  },
  {
    name: 'Employees',
    href: '/hrms/employees' as const,
    icon: Users,
  },
  {
    name: 'Attendance',
    href: '/hrms/attendance' as const,
    icon: Clock,
  },
  {
    name: 'Payroll',
    href: '/hrms/payroll' as const,
    icon: DollarSign,
  },
  {
    name: 'Earnings',
    href: '/hrms/earnings' as const,
    icon: Plus,
  },
  {
    name: 'Deductions',
    href: '/hrms/deductions' as const,
    icon: Minus,
  },
  {
    name: 'HR Reports',
    href: '/hrms/reports' as const,
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/settings' as const,
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 bg-gray-800">
        <Building2 className="h-8 w-8 text-primary-400" />
        <span className="ml-3 text-lg font-semibold">AccountingPro</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
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

      {/* Footer - Temporary user info */}
      <div className="p-4 border-t border-gray-800">
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">DA</span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">Demo Admin</p>
              <p className="text-xs text-gray-400">admin@demo.com</p>
            </div>
          </div>
          <button className="w-full flex items-center px-2 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
            <LogOut className="h-4 w-4 mr-2" />
            Sign out (demo)
          </button>
        </div>
      </div>
    </div>
  )
}