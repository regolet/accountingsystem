'use client'

import { useState } from 'react'
import { FileText, Receipt } from 'lucide-react'
import { RoleGuard } from '@/components/ui/role-guard'
import InvoicesSection from './invoices-section'
import ReimbursementsSection from './reimbursements-section'

interface SidebarItem {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  permission?: string
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'invoices',
    name: 'Invoices',
    icon: FileText,
    permission: 'viewInvoices',
  },
  {
    id: 'reimbursements',
    name: 'Reimbursements',
    icon: Receipt,
    permission: 'viewReimbursements',
  },
]

export default function InvoicesPage() {
  const [activeSection, setActiveSection] = useState('invoices')

  const renderContent = () => {
    switch (activeSection) {
      case 'invoices':
        return <InvoicesSection />
      case 'reimbursements':
        return <ReimbursementsSection />
      default:
        return <InvoicesSection />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Invoices & Billing</h1>
          <p className="text-gray-600 text-sm mt-1">Manage invoices and reimbursements</p>
        </div>
        
        <nav className="p-4">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            
            if (item.permission) {
              return (
                <RoleGuard key={item.id} permission={item.permission as 'viewInvoices' | 'viewReimbursements'}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center px-3 py-2 mb-1 text-left rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </button>
                </RoleGuard>
              )
            }
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-3 py-2 mb-1 text-left rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="text-sm font-medium">{item.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  )
}