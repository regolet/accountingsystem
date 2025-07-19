'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, CreditCard, Bell, Shield, Mail, Send, Eye, EyeOff, Upload, X } from 'lucide-react'
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null)
  const [emailLoading, setEmailLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
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
          
          // Handle specific error codes with helpful messages
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

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB')
      return
    }

    // Check file type
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
    );
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
              {/* Logo Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Company Logo</label>
                <div className="flex items-center space-x-4">
                  {settings.companyInfo.logo ? (
                    <div className="relative">
                      <img 
                        src={settings.companyInfo.logo} 
                        alt="Company Logo" 
                        className="h-24 w-24 object-contain border rounded"
                      />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 w-24 border-2 border-dashed rounded flex items-center justify-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {settings.companyInfo.logo ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">Max size: 2MB. PNG, JPG, GIF</p>
                  </div>
                </div>
              </div>

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

        {/* Email Templates Card */}
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
                <label className="block text-sm font-medium mb-1">Invoice Email Subject</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Invoice {invoiceNumber} - {amount}"
                  value={settings.emailTemplates.invoiceEmailSubject}
                  onChange={(e) => setSettings({
                    ...settings,
                    emailTemplates: { ...settings.emailTemplates, invoiceEmailSubject: e.target.value }
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available variables: {'{invoiceNumber}'}, {'{amount}'}, {'{customerName}'}, {'{companyName}'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Email Message</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={8}
                  placeholder="Dear {customerName},&#10;&#10;Please find attached your invoice {invoiceNumber} for {amount}.&#10;&#10;Due date: {dueDate}&#10;&#10;Thank you for your business!&#10;&#10;Best regards,&#10;{companyName}"
                  value={settings.emailTemplates.invoiceEmailMessage}
                  onChange={(e) => setSettings({
                    ...settings,
                    emailTemplates: { ...settings.emailTemplates, invoiceEmailMessage: e.target.value }
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available variables: {'{invoiceNumber}'}, {'{amount}'}, {'{customerName}'}, {'{dueDate}'}, {'{companyName}'}
                </p>
              </div>
              
              <Button type="submit" disabled={saving === 'emailTemplates'}>
                {saving === 'emailTemplates' ? 'Saving...' : 'Save Email Templates'}
              </Button>
            </form>

            {/* Email Preview */}
            <EmailPreview 
              subject={settings.emailTemplates.invoiceEmailSubject}
              message={settings.emailTemplates.invoiceEmailMessage}
              sampleData={{
                invoiceNumber: 'INV-001',
                amount: '₱1,250.00',
                customerName: 'John Doe',
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                companyName: settings.companyInfo.companyName || 'Your Company Name'
              }}
            />
          </CardContent>
        </Card>

        {/* Gmail SMTP Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Gmail SMTP Settings
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
                    id="smtpEnabled"
                    checked={emailSettings?.smtpEnabled || false}
                    onChange={(e) => setEmailSettings(prev => prev ? {...prev, smtpEnabled: e.target.checked} : null)}
                    className="rounded"
                  />
                  <label htmlFor="smtpEnabled" className="text-sm font-medium">
                    Enable email sending for this account
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">SMTP Host</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="smtp.gmail.com"
                      value={emailSettings?.smtpHost || ''}
                      onChange={(e) => setEmailSettings(prev => prev ? {...prev, smtpHost: e.target.value} : null)}
                      disabled={!emailSettings?.smtpEnabled}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">SMTP Port</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="587"
                      value={emailSettings?.smtpPort || 587}
                      onChange={(e) => setEmailSettings(prev => prev ? {...prev, smtpPort: parseInt(e.target.value)} : null)}
                      disabled={!emailSettings?.smtpEnabled}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Gmail Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="your-email@gmail.com"
                      value={emailSettings?.smtpUser || ''}
                      onChange={(e) => setEmailSettings(prev => prev ? {...prev, smtpUser: e.target.value} : null)}
                      disabled={!emailSettings?.smtpEnabled}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">From Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="AccountingPro"
                      value={emailSettings?.smtpFromName || ''}
                      onChange={(e) => setEmailSettings(prev => prev ? {...prev, smtpFromName: e.target.value} : null)}
                      disabled={!emailSettings?.smtpEnabled}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Gmail App Password 
                    {emailSettings?.hasPassword && (
                      <span className="text-green-600 text-xs ml-2">(Password is set)</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder={emailSettings?.hasPassword ? "Leave blank to keep current password" : "Enter Gmail app password"}
                      value={emailSettings?.smtpPass || ''}
                      onChange={(e) => setEmailSettings(prev => prev ? {...prev, smtpPass: e.target.value} : null)}
                      disabled={!emailSettings?.smtpEnabled}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={!emailSettings?.smtpEnabled}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Generate an app password in your Google Account settings → Security → App passwords
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={saving === 'emailSettings' || !emailSettings?.smtpEnabled}
                  >
                    {saving === 'emailSettings' ? 'Saving...' : 'Save Email Settings'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={testEmailSettings}
                    disabled={testingEmail || !emailSettings?.smtpEnabled || !emailSettings?.smtpUser}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {testingEmail ? 'Sending...' : 'Send Test Email'}
                  </Button>
                </div>
              </form>
            )}
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