'use client'

import { Menu, Building2, LogOut, UserCircle } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'

interface MobileHeaderProps {
  onMenuClick: () => void
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { data: session } = useSession()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Menu button and logo */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center ml-2 sm:ml-3 min-w-0">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 flex-shrink-0" />
            <span className="ml-1 sm:ml-2 text-base sm:text-lg font-semibold text-gray-900 truncate">AccountingPro</span>
          </div>
        </div>

        {/* Right side - User menu */}
        {session?.user && (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center p-1 sm:p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <div className="h-5 w-5 sm:h-6 sm:w-6 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {getInitials(session.user.name || 'User')}
                </span>
              </div>
            </button>

            {/* User dropdown menu */}
            {userMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                  <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{session.user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <UserCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">My Profile</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Sign out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}