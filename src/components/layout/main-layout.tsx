'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { MobileHeader } from './mobile-header'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden">
          <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        </div>
        
        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}