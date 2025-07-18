'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, CreditCard, Bell, Shield } from 'lucide-react'
import { RoleGuard } from '@/components/ui/role-guard'

interface Settings {
  companyInfo: {
    companyName: string
    taxId: string
    email: string
    phone: string
    address: string
  }
  invoiceSettings: {
    defaultPaymentTerms: string
    defaultCurrency: string
    taxRate: number
    invoicePrefix: string
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (type: string, data: Record<string, string | number>) => {
    setSaving(type)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data }),
      })
      
      if (response.ok) {
        alert('Settings updated successfully!')
        fetchSettings()
      } else {
        alert('Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      alert('Failed to update settings')
    } finally {
      setSaving(null)
    }
  }

  const handleCompanyInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return
    updateSettings('companyInfo', settings.companyInfo)
  }

  const handleInvoiceSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return
    updateSettings('invoiceSettings', settings.invoiceSettings)
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Failed to load settings</div>
      </div>
    )
  }
  return (
    <RoleGuard permission="viewSettings" fallback={
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to view settings.</p>
        </div>
      </div>
    }>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="grid gap-6">

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCompanyInfoSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Your Company Name"
                    value={settings.companyInfo.companyName}
                    onChange={(e) => setSettings({
                      ...settings,
                      companyInfo: { ...settings.companyInfo, companyName: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tax ID</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Tax Identification Number"
                    value={settings.companyInfo.taxId}
                    onChange={(e) => setSettings({
                      ...settings,
                      companyInfo: { ...settings.companyInfo, taxId: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="company@example.com"
                    value={settings.companyInfo.email}
                    onChange={(e) => setSettings({
                      ...settings,
                      companyInfo: { ...settings.companyInfo, email: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="+63 (xxx) xxx-xxxx"
                    value={settings.companyInfo.phone}
                    onChange={(e) => setSettings({
                      ...settings,
                      companyInfo: { ...settings.companyInfo, phone: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Company address"
                  value={settings.companyInfo.address}
                  onChange={(e) => setSettings({
                    ...settings,
                    companyInfo: { ...settings.companyInfo, address: e.target.value }
                  })}
                />
              </div>
              <Button type="submit" disabled={saving === 'companyInfo'}>
                {saving === 'companyInfo' ? 'Saving...' : 'Save Company Information'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Invoice Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvoiceSettingsSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Default Payment Terms</label>
                  <select 
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={settings.invoiceSettings.defaultPaymentTerms}
                    onChange={(e) => setSettings({
                      ...settings,
                      invoiceSettings: { ...settings.invoiceSettings, defaultPaymentTerms: e.target.value }
                    })}
                  >
                    <option value="Net 30">Net 30</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Default Currency</label>
                  <select 
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={settings.invoiceSettings.defaultCurrency}
                    onChange={(e) => setSettings({
                      ...settings,
                      invoiceSettings: { ...settings.invoiceSettings, defaultCurrency: e.target.value }
                    })}
                  >
                    <option value="PHP">PHP - Philippine Peso</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="12.00"
                    value={settings.invoiceSettings.taxRate}
                    onChange={(e) => setSettings({
                      ...settings,
                      invoiceSettings: { ...settings.invoiceSettings, taxRate: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="INV-"
                    value={settings.invoiceSettings.invoicePrefix}
                    onChange={(e) => setSettings({
                      ...settings,
                      invoiceSettings: { ...settings.invoiceSettings, invoicePrefix: e.target.value }
                    })}
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving === 'invoiceSettings'}>
                {saving === 'invoiceSettings' ? 'Saving...' : 'Save Invoice Settings'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email notifications for new invoices</span>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Overdue invoice reminders</span>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Payment received notifications</span>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Weekly financial summary</span>
                <input type="checkbox" className="rounded" />
              </div>
              <Button>Save Notification Settings</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <Button>Update Password</Button>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </RoleGuard>
  )
}