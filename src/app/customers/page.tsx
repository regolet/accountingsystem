'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/ui/role-guard'
import { Plus, Search, Mail, Phone, Edit, Trash2, Eye, MapPin, FileText, Coins } from 'lucide-react'

interface Address {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  taxId?: string
  address?: Address
  _count: {
    invoices: number
  }
  createdAt: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  issueDate: string
  dueDate: string
  subtotal: string
  tax: string
  total: string
  currency: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  category: string
  amount: string
  currency: string
  description: string
  date: string
  invoiceId?: string
  invoice?: {
    invoiceNumber: string
  }
  createdAt: string
  updatedAt: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    taxId: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    }
  })
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([])
  const [customerTransactions, setCustomerTransactions] = useState<Transaction[]>([])
  const [sendingBatchEmail, setSendingBatchEmail] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'billing' | 'payments'>('details')

  useEffect(() => {
    fetchCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const formatAddress = (address: Address) => {
    if (!address) return ''
    const parts = []
    if (address.street) parts.push(address.street)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.postalCode) parts.push(address.postalCode)
    if (address.country) parts.push(address.country)
    return parts.join(', ')
  }

  const formatCurrency = (amount: string, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
    }).format(parseFloat(amount))
  }

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-500',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/customers?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        setShowAddForm(false)
        setFormData({ name: '', email: '', phone: '', taxId: '', address: { street: '', city: '', state: '', postalCode: '', country: '' } })
        fetchCustomers()
      }
    } catch (error) {
      console.error('Error creating customer:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        fetchCustomers()
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      taxId: customer.taxId || '',
      address: customer.address || {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      }
    })
    setShowEditForm(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCustomer) return

    try {
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        setShowEditForm(false)
        setEditingCustomer(null)
        setFormData({ name: '', email: '', phone: '', taxId: '', address: { street: '', city: '', state: '', postalCode: '', country: '' } })
        fetchCustomers()
      }
    } catch (error) {
      console.error('Error updating customer:', error)
    }
  }

  const fetchCustomerHistory = async (customerId: string) => {
    setLoadingHistory(true)
    try {
      // Fetch invoices for this customer
      const invoicesResponse = await fetch(`/api/invoices?customerId=${customerId}`)
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json()
        setCustomerInvoices(invoicesData.invoices || [])
      }

      // Fetch transactions for this customer (will implement transaction API later)
      // For now, we'll use mock data or try to fetch from a transaction endpoint
      try {
        const transactionsResponse = await fetch(`/api/transactions?customerId=${customerId}`)
        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json()
          setCustomerTransactions(transactionsData.transactions || [])
        }
      } catch (transactionError) {
        // Transaction endpoint might not exist yet, so we'll show empty transactions
        setCustomerTransactions([])
      }
    } catch (error) {
      console.error('Error fetching customer history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleView = (customer: Customer) => {
    setViewingCustomer(customer)
    setShowViewModal(true)
  }

  const cancelEdit = () => {
    setShowEditForm(false)
    setEditingCustomer(null)
    setFormData({ name: '', email: '', phone: '', taxId: '', address: { street: '', city: '', state: '', postalCode: '', country: '' } })
  }

  const closeViewModal = () => {
    setShowViewModal(false)
    setViewingCustomer(null)
    setCustomerInvoices([])
    setCustomerTransactions([])
    setLoadingHistory(false)
    setActiveTab('details')
  }

  const sendBalanceReminders = async () => {
    setSendingBatchEmail(true)
    try {
      const response = await fetch('/api/customers/batch-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailType: 'balance_reminder',
          includeOverdueOnly: false,
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Balance reminders sent: ${result.sent} successful, ${result.failed} failed`)
      } else {
        const errorData = await response.json()
        alert(`Failed to send reminders: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Batch email error:', error)
      alert('Failed to send balance reminders. Please try again.')
    } finally {
      setSendingBatchEmail(false)
    }
  }

  const sendOverdueNotices = async () => {
    setSendingBatchEmail(true)
    try {
      const response = await fetch('/api/customers/batch-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailType: 'overdue_notice',
          includeOverdueOnly: true,
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Overdue notices sent: ${result.sent} successful, ${result.failed} failed`)
      } else {
        const errorData = await response.json()
        alert(`Failed to send notices: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Batch email error:', error)
      alert('Failed to send overdue notices. Please try again.')
    } finally {
      setSendingBatchEmail(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Customers</h1>
        <div className="flex gap-2">
          <RoleGuard permission="sendInvoices">
            <Button 
              variant="secondary" 
              onClick={sendBalanceReminders}
              disabled={sendingBatchEmail}
            >
              <Mail className="h-4 w-4 mr-2" />
              {sendingBatchEmail ? 'Sending...' : 'Send Balance Reminders'}
            </Button>
          </RoleGuard>
          
          <RoleGuard permission="sendInvoices">
            <Button 
              variant="secondary" 
              onClick={sendOverdueNotices}
              disabled={sendingBatchEmail}
            >
              <Mail className="h-4 w-4 mr-2" />
              {sendingBatchEmail ? 'Sending...' : 'Send Overdue Notices'}
            </Button>
          </RoleGuard>
          
          <RoleGuard permission="createCustomers">
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </RoleGuard>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search customers..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                />
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-3">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Street Address</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.address.street}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.address.city}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State/Province</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.address.state}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Postal Code</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.address.postalCode}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, postalCode: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Country</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.address.country}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Customer</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showEditForm && editingCustomer && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Edit Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tax ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                />
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-3">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Street Address</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.address.street}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.address.city}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State/Province</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.address.state}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Postal Code</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.address.postalCode}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, postalCode: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Country</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.address.country}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Update Customer</Button>
                <Button type="button" variant="secondary" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {!customers || customers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No customers found. Add your first customer to get started.</p>
            </CardContent>
          </Card>
        ) : (
          customers.map((customer) => (
            <Card key={customer.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <h3 className="text-lg font-semibold">{customer.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {customer.email}
                    </span>
                    {customer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {customer.phone}
                      </span>
                    )}
                  </div>
                  {customer.address && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{formatAddress(customer.address)}</span>
                    </div>
                  )}
                  {customer.taxId && (
                    <p className="text-sm text-gray-500 mt-1">Tax ID: {customer.taxId}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {customer._count.invoices} invoices
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleView(customer)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <RoleGuard permission="editCustomers">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </RoleGuard>
                  <RoleGuard permission="deleteCustomers">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(customer.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </RoleGuard>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Customer Modal */}
      {showViewModal && viewingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Customer Details</h2>
                <Button variant="ghost" size="sm" onClick={closeViewModal}>
                  ×
                </Button>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'details'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('billing')
                      if (customerInvoices.length === 0 && !loadingHistory) {
                        fetchCustomerHistory(viewingCustomer.id)
                      }
                    }}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'billing'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Billing History
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('payments')
                      if (customerTransactions.length === 0 && !loadingHistory) {
                        fetchCustomerHistory(viewingCustomer.id)
                      }
                    }}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'payments'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Payment History
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="space-y-4">
                {/* Details Tab */}
                {activeTab === 'details' && (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingCustomer.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingCustomer.email}</p>
                        </div>
                        {viewingCustomer.phone && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <p className="mt-1 text-sm text-gray-900">{viewingCustomer.phone}</p>
                          </div>
                        )}
                        {viewingCustomer.taxId && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Tax ID</label>
                            <p className="mt-1 text-sm text-gray-900">{viewingCustomer.taxId}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {viewingCustomer.address && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {viewingCustomer.address.street && (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700">Street Address</label>
                              <p className="mt-1 text-sm text-gray-900">{viewingCustomer.address.street}</p>
                            </div>
                          )}
                          {viewingCustomer.address.city && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">City</label>
                              <p className="mt-1 text-sm text-gray-900">{viewingCustomer.address.city}</p>
                            </div>
                          )}
                          {viewingCustomer.address.state && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">State/Province</label>
                              <p className="mt-1 text-sm text-gray-900">{viewingCustomer.address.state}</p>
                            </div>
                          )}
                          {viewingCustomer.address.postalCode && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                              <p className="mt-1 text-sm text-gray-900">{viewingCustomer.address.postalCode}</p>
                            </div>
                          )}
                          {viewingCustomer.address.country && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Country</label>
                              <p className="mt-1 text-sm text-gray-900">{viewingCustomer.address.country}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Statistics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Total Invoices</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingCustomer._count.invoices}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Customer Since</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date(viewingCustomer.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Billing History Tab */}
                {activeTab === 'billing' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Invoice History
                    </h3>
                    {loadingHistory ? (
                      <div className="text-center py-4">
                        <div className="text-sm text-gray-500">Loading invoices...</div>
                      </div>
                    ) : customerInvoices.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Invoice #
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Due Date
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Amount
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {customerInvoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {invoice.invoiceNumber}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(invoice.issueDate).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                                      {invoice.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                                    {formatCurrency(invoice.total, invoice.currency)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500">
                        No invoices found for this customer.
                      </div>
                    )}
                  </div>
                )}

                {/* Payment History Tab */}
                {activeTab === 'payments' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <Coins className="h-5 w-5 mr-2" />
                      Payment History
                    </h3>
                    {loadingHistory ? (
                      <div className="text-center py-4">
                        <div className="text-sm text-gray-500">Loading payments...</div>
                      </div>
                    ) : customerTransactions.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Description
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Type
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Invoice #
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Amount
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {customerTransactions.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(transaction.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900">
                                    {transaction.description}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      transaction.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                      {transaction.type.toLowerCase()}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {transaction.invoice?.invoiceNumber || '-'}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                                    {formatCurrency(transaction.amount, transaction.currency)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500">
                        No payment history found for this customer.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                <RoleGuard permission="editCustomers">
                  <Button 
                    onClick={() => {
                      closeViewModal()
                      handleEdit(viewingCustomer)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Customer
                  </Button>
                </RoleGuard>
                <Button variant="secondary" onClick={closeViewModal}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}