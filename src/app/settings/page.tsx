'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, CreditCard, Bell, Shield, Mail, Send, Eye, EyeOff, Upload, X, Users, FileText, Settings } from 'lucide-react'
import { RoleGuard } from '@/components/ui/role-guard'
import { EmailPreview } from '@/components/ui/email-preview'

interface Settings {
  companyInfo: {
    companyName: string
    taxId: string
    email: string
    phone: string
    address: string
    logo: string | null
  }
  invoiceSettings: {
    defaultPaymentTerms: string
    defaultCurrency: string
    taxRate: number
    invoicePrefix: string
  }
  employeeSettings: {
    employeePrefix: string
    employeeIdLength: number
    employeeStartNumber: number
  }
  emailTemplates: {
    invoiceEmailSubject: string
    invoiceEmailMessage: string
  }
}

interface EmailSettings {
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPass: string
  smtpFromName: string
  smtpEnabled: boolean
  hasPassword: boolean
}

interface SidebarItem {
  id: string
  name: string
  icon: React.ElementType
  permission?: string
}

const sidebarItems: SidebarItem[] = [
  { id: 'company', name: 'Company Info', icon: Building2 },
  { id: 'invoice', name: 'Invoice Settings', icon: FileText },
  { id: 'employee', name: 'Employee Settings', icon: Users },
  { id: 'email-templates', name: 'Email Templates', icon: Mail },
  { id: 'email-settings', name: 'Email Configuration', icon: Settings },
  { id: 'security', name: 'Security', icon: Shield, permission: 'editSettings' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null)
  const [emailLoading, setEmailLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [activeSection, setActiveSection] = useState('company')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSettings()
    fetchEmailSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setSettings({
        ...data,
        companyInfo: {
          ...data.companyInfo,
          logo: data.companyInfo.logo || null
        }
      })
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

  const handleEmailTemplatesSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return
    updateSettings('emailTemplates', settings.emailTemplates)
  }

  const handleEmployeeSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return
    updateSettings('employeeSettings', settings.employeeSettings)
  }

  const fetchEmailSettings = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const session = await response.json()
      
      if (session?.user?.id) {
        const emailResponse = await fetch(`/api/users/${session.user.id}/email-settings`)
        if (emailResponse.ok) {
          const data = await emailResponse.json()
          setEmailSettings({
            smtpHost: data.emailSettings.smtpHost || 'smtp.gmail.com',
            smtpPort: data.emailSettings.smtpPort || 587,
            smtpUser: data.emailSettings.smtpUser || '',
            smtpPass: '',
            smtpFromName: data.emailSettings.smtpFromName || 'AccountingPro',
            smtpEnabled: data.emailSettings.smtpEnabled || false,
            hasPassword: data.emailSettings.hasPassword || false,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching email settings:', error)
    } finally {
      setEmailLoading(false)
    }
  }

  const updateEmailSettings = async () => {
    if (!emailSettings) return
    
    setSaving('emailSettings')
    try {
      const response = await fetch('/api/auth/session')
      const session = await response.json()
      
      if (session?.user?.id) {
        const updateResponse = await fetch(`/api/users/${session.user.id}/email-settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailSettings),
        })
        
        if (updateResponse.ok) {
          alert('Email settings updated successfully!')
          fetchEmailSettings()
        } else {
          const errorData = await updateResponse.json()
          alert(`Failed to update email settings: ${errorData.error}`)
        }
      }
    } catch (error) {
      console.error('Error updating email settings:', error)
      alert('Failed to update email settings')
    } finally {
      setSaving(null)
    }
  }

  const testEmailSettings = async () => {
    setTestingEmail(true)
    try {
      const response = await fetch('/api/auth/session')
      const session = await response.json()
      
      if (session?.user?.id) {
        const testResponse = await fetch(`/api/users/${session.user.id}/email-settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        
        if (testResponse.ok) {
          const result = await testResponse.json()
          alert(`✅ Test email sent successfully to ${result.recipient}`)
        } else {
          const errorData = await testResponse.json()
          
          if (errorData.code === 'EMAIL_NOT_ENABLED') {
            alert('❌ Email sending is not enabled.\n\nPlease enable email sending by checking the checkbox above.')
          } else if (errorData.code === 'EMAIL_NOT_CONFIGURED') {
            alert('⚙️ Email settings are incomplete.\n\nPlease configure your Gmail email and app password.')
          } else if (errorData.code === 'EMAIL_SEND_FAILED' || errorData.code === 'EMAIL_TEST_ERROR') {
            alert('📧 Test email failed.\n\nCommon issues:\n• Incorrect Gmail app password\n• Invalid SMTP settings\n• Gmail security blocking\n\nPlease verify your Gmail app password is correct.')
          } else {
            alert(`Failed to send test email: ${errorData.error}`)
          }
        }
      }
    } catch (error) {
      console.error('Error testing email settings:', error)
      alert('❌ Failed to send test email due to network error. Please try again.')
    } finally {
      setTestingEmail(false)
    }
  }

  const handleEmailSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateEmailSettings()
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setSettings(prev => prev ? {
        ...prev,
        companyInfo: { ...prev.companyInfo, logo: base64String }
      } : null)
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setSettings(prev => prev ? {
      ...prev,
      companyInfo: { ...prev.companyInfo, logo: null }
    } : null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const renderCompanyInfo = () => (
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={settings?.companyInfo.companyName || ''}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  companyInfo: { ...prev.companyInfo, companyName: e.target.value }
                } : null)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax ID
              </label>
              <input
                type="text"
                value={settings?.companyInfo.taxId || ''}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  companyInfo: { ...prev.companyInfo, taxId: e.target.value }
                } : null)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={settings?.companyInfo.email || ''}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  companyInfo: { ...prev.companyInfo, email: e.target.value }
                } : null)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={settings?.companyInfo.phone || ''}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  companyInfo: { ...prev.companyInfo, phone: e.target.value }
                } : null)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              rows={3}
              value={settings?.companyInfo.address || ''}
              onChange={(e) => setSettings(prev => prev ? {
                ...prev,
                companyInfo: { ...prev.companyInfo, address: e.target.value }
              } : null)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Logo
            </label>
            {settings?.companyInfo.logo ? (
              <div className="flex items-center space-x-4">
                <img 
                  src={settings.companyInfo.logo} 
                  alt="Company Logo" 
                  className="h-16 w-16 object-contain border border-gray-200 rounded"
                />
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={removeLogo}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <p className="text-sm text-gray-500 mt-1">
              Recommended: PNG or JPG format, max 2MB
            </p>
          </div>

          <RoleGuard permission="editSettings">
            <Button type="submit" disabled={saving === 'companyInfo'}>
              {saving === 'companyInfo' ? 'Saving...' : 'Save Company Information'}
            </Button>
          </RoleGuard>
        </form>
      </CardContent>
    </Card>
  )

  const renderInvoiceSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Invoice Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleInvoiceSettingsSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Payment Terms (days)
              </label>
              <input
                type="number"
                value={settings?.invoiceSettings.defaultPaymentTerms || ''}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  invoiceSettings: { ...prev.invoiceSettings, defaultPaymentTerms: e.target.value }
                } : null)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Currency
              </label>
              <select
                value={settings?.invoiceSettings.defaultCurrency || ''}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  invoiceSettings: { ...prev.invoiceSettings, defaultCurrency: e.target.value }
                } : null)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Currency</option>
                <option value="PHP">PHP - Philippine Peso</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings?.invoiceSettings.taxRate || ''}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  invoiceSettings: { ...prev.invoiceSettings, taxRate: parseFloat(e.target.value) || 0 }
                } : null)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={settings?.invoiceSettings.invoicePrefix || ''}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  invoiceSettings: { ...prev.invoiceSettings, invoicePrefix: e.target.value }
                } : null)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="INV-"
              />
              <p className="text-sm text-gray-500 mt-1">
                This prefix will be added to all invoice numbers (e.g., INV-001)
              </p>
            </div>
          </div>

          <RoleGuard permission="editSettings">
            <Button type="submit" disabled={saving === 'invoiceSettings'}>
              {saving === 'invoiceSettings' ? 'Saving...' : 'Save Invoice Settings'}
            </Button>
          </RoleGuard>
        </form>
      </CardContent>
    </Card>
  )

  const renderEmployeeSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Employee Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmployeeSettingsSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID Prefix
              </label>
              <input
                type="text"
                value={settings?.employeeSettings.employeePrefix || ''}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  employeeSettings: { ...prev.employeeSettings, employeePrefix: e.target.value }
                } : null)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="EMP-"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Number Length
              </label>
              <input
                type="number"
                value={settings?.employeeSettings.employeeIdLength || ''}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  employeeSettings: { ...prev.employeeSettings, employeeIdLength: parseInt(e.target.value) || 3 }
                } : null)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starting Number
              </label>
              <input
                type="number"
                value={settings?.employeeSettings.employeeStartNumber || ''}
                onChange={(e) => setSettings(prev => prev ? {
                  ...prev,
                  employeeSettings: { ...prev.employeeSettings, employeeStartNumber: parseInt(e.target.value) || 1 }
                } : null)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-700">
              <strong>Preview:</strong> {settings?.employeeSettings.employeePrefix || 'EMP-'}
              {String(settings?.employeeSettings.employeeStartNumber || 1).padStart(settings?.employeeSettings.employeeIdLength || 3, '0')}
            </p>
          </div>

          <RoleGuard permission="editSettings">
            <Button type="submit" disabled={saving === 'employeeSettings'}>
              {saving === 'employeeSettings' ? 'Saving...' : 'Save Employee Settings'}
            </Button>
          </RoleGuard>
        </form>
      </CardContent>
    </Card>
  )

  const renderEmailTemplates = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="h-5 w-5 mr-2" />
          Email Templates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailTemplatesSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Email Subject
            </label>
            <input
              type="text"
              value={settings?.emailTemplates.invoiceEmailSubject || ''}
              onChange={(e) => setSettings(prev => prev ? {
                ...prev,
                emailTemplates: { ...prev.emailTemplates, invoiceEmailSubject: e.target.value }
              } : null)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Invoice #{invoiceNumber} from {companyName}"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Email Message
            </label>
            <textarea
              rows={6}
              value={settings?.emailTemplates.invoiceEmailMessage || ''}
              onChange={(e) => setSettings(prev => prev ? {
                ...prev,
                emailTemplates: { ...prev.emailTemplates, invoiceEmailMessage: e.target.value }
              } : null)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Dear {customerName},...&#10;&#10;Please find attached your invoice...&#10;&#10;Best regards,&#10;{companyName}"
            />
            <p className="text-sm text-gray-500 mt-1">
              Available variables: {'{customerName}'}, {'{companyName}'}, {'{invoiceNumber}'}, {'{amount}'}, {'{dueDate}'}
            </p>
          </div>

          <EmailPreview 
            subject={settings?.emailTemplates.invoiceEmailSubject || ''}
            message={settings?.emailTemplates.invoiceEmailMessage || ''}
            companyName={settings?.companyInfo.companyName || 'Your Company'}
          />

          <RoleGuard permission="editSettings">
            <Button type="submit" disabled={saving === 'emailTemplates'}>
              {saving === 'emailTemplates' ? 'Saving...' : 'Save Email Templates'}
            </Button>
          </RoleGuard>
        </form>
      </CardContent>
    </Card>
  )

  const renderEmailSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Email Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        {emailLoading ? (
          <div className="text-center py-4">Loading email settings...</div>
        ) : (
          <form onSubmit={handleEmailSettingsSubmit} className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="emailEnabled"
                checked={emailSettings?.smtpEnabled || false}
                onChange={(e) => setEmailSettings(prev => prev ? {
                  ...prev,
                  smtpEnabled: e.target.checked
                } : null)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="emailEnabled" className="text-sm font-medium text-gray-700">
                Enable email sending
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={emailSettings?.smtpHost || ''}
                  onChange={(e) => setEmailSettings(prev => prev ? {
                    ...prev,
                    smtpHost: e.target.value
                  } : null)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={emailSettings?.smtpPort || ''}
                  onChange={(e) => setEmailSettings(prev => prev ? {
                    ...prev,
                    smtpPort: parseInt(e.target.value) || 587
                  } : null)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="587"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gmail Email
                </label>
                <input
                  type="email"
                  value={emailSettings?.smtpUser || ''}
                  onChange={(e) => setEmailSettings(prev => prev ? {
                    ...prev,
                    smtpUser: e.target.value
                  } : null)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Name
                </label>
                <input
                  type="text"
                  value={emailSettings?.smtpFromName || ''}
                  onChange={(e) => setEmailSettings(prev => prev ? {
                    ...prev,
                    smtpFromName: e.target.value
                  } : null)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="AccountingPro"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gmail App Password
                {emailSettings?.hasPassword && (
                  <span className="text-green-600 text-xs ml-2">✓ Password saved</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={emailSettings?.smtpPass || ''}
                  onChange={(e) => setEmailSettings(prev => prev ? {
                    ...prev,
                    smtpPass: e.target.value
                  } : null)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  placeholder={emailSettings?.hasPassword ? "Leave blank to keep current password" : "Enter your Gmail app password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Generate an app password in your Google Account settings for enhanced security.
              </p>
            </div>

            <div className="flex space-x-2">
              <RoleGuard permission="editSettings">
                <Button type="submit" disabled={saving === 'emailSettings'}>
                  {saving === 'emailSettings' ? 'Saving...' : 'Save Email Settings'}
                </Button>
              </RoleGuard>
              <Button
                type="button"
                variant="outline"
                onClick={testEmailSettings}
                disabled={testingEmail || !emailSettings?.smtpEnabled}
              >
                <Send className="h-4 w-4 mr-2" />
                {testingEmail ? 'Sending...' : 'Send Test Email'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )

  const renderSecurity = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Security Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Security Features</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Password encryption and secure storage</li>
              <li>• Role-based access control</li>
              <li>• Session management</li>
              <li>• API rate limiting</li>
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-green-800 mb-2">Best Practices</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Use strong passwords for all accounts</li>
              <li>• Enable Gmail app passwords for email</li>
              <li>• Regularly review user permissions</li>
              <li>• Keep software updated</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'company':
        return renderCompanyInfo()
      case 'invoice':
        return renderInvoiceSettings()
      case 'employee':
        return renderEmployeeSettings()
      case 'email-templates':
        return renderEmailTemplates()
      case 'email-settings':
        return renderEmailSettings()
      case 'security':
        return renderSecurity()
      default:
        return renderCompanyInfo()
    }
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
          <p className="text-gray-600">You don't have permission to view settings.</p>
        </div>
      </div>
    }>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          </div>
          <nav className="p-4">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              
              return (
                <RoleGuard key={item.id} permission={item.permission || 'viewSettings'}>
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
            })}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}