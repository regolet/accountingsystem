'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/ui/role-guard'
import { Plus, Search, Calendar, Coins, Users, Play, Pause, X } from 'lucide-react'

interface Subscription {
  id: string
  name: string
  description?: string
  customer: {
    name: string
    email: string
  }
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED'
  billingType: 'RETAINER' | 'RECURRING_SERVICE' | 'SUBSCRIPTION' | 'MAINTENANCE'
  amount: string
  currency: string
  billingInterval: number
  intervalType: 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS'
  nextBillingDate: string
  totalBilled: string
  invoiceCount: number
  _count: {
    invoices: number
  }
}

interface Customer {
  id: string
  name: string
  email: string
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customerId: '',
    billingType: 'RETAINER' as 'RETAINER' | 'RECURRING_SERVICE' | 'SUBSCRIPTION' | 'MAINTENANCE',
    amount: '',
    currency: 'PHP',
    billingInterval: '1',
    intervalType: 'MONTHS' as 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS',
    startDate: '',
    endDate: '',
    notes: '',
  })

  useEffect(() => {
    fetchSubscriptions()
    fetchCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter])

  const fetchSubscriptions = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      
      const response = await fetch(`/api/subscriptions?${params}`)
      const data = await response.json()
      setSubscriptions(data.subscriptions)
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()
      setCustomers(data.customers)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          billingInterval: parseInt(formData.billingInterval),
        }),
      })
      
      if (response.ok) {
        alert('Subscription created successfully!')
        setShowCreateForm(false)
        setFormData({
          name: '',
          description: '',
          customerId: '',
          billingType: 'RETAINER',
          amount: '',
          currency: 'PHP',
          billingInterval: '1',
          intervalType: 'MONTHS',
          startDate: '',
          endDate: '',
          notes: '',
        })
        fetchSubscriptions()
      } else {
        const errorData = await response.json()
        alert(`Failed to create subscription: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      alert('Failed to create subscription. Please try again.')
    }
  }

  const generateInvoice = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/generate-invoice`, {
        method: 'POST',
      })
      
      if (response.ok) {
        alert('Invoice generated successfully!')
        fetchSubscriptions()
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
    }
  }

  const updateStatus = async (subscriptionId: string, status: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      
      if (response.ok) {
        fetchSubscriptions()
      }
    } catch (error) {
      console.error('Error updating subscription:', error)
    }
  }

  const formatCurrency = (amount: string, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
    }).format(parseFloat(amount))
  }

  const formatInterval = (interval: number, type: string) => {
    const unit = type.toLowerCase()
    return `${interval} ${interval === 1 ? unit.slice(0, -1) : unit}`
  }

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getBillingTypeLabel = (type: string) => {
    const labels = {
      RETAINER: 'Retainer',
      RECURRING_SERVICE: 'Recurring Service',
      SUBSCRIPTION: 'Subscription',
      MAINTENANCE: 'Maintenance',
    }
    return labels[type as keyof typeof labels] || type
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
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <RoleGuard permission="createInvoices">
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Subscription
          </Button>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold">
                  {subscriptions?.filter(s => s.status === 'ACTIVE').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Coins className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Recurring</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    (subscriptions || [])
                      .filter(s => s.status === 'ACTIVE' && s.intervalType === 'MONTHS')
                      .reduce((sum, s) => sum + parseFloat(s.amount), 0)
                      .toString(),
                    'PHP'
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Due This Week</p>
                <p className="text-2xl font-bold">
                  {(subscriptions || []).filter(s => {
                    const nextBilling = new Date(s.nextBillingDate)
                    const nextWeek = new Date()
                    nextWeek.setDate(nextWeek.getDate() + 7)
                    return nextBilling <= nextWeek && s.status === 'ACTIVE'
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Coins className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Billed</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    (subscriptions || [])
                      .reduce((sum, s) => sum + parseFloat(s.totalBilled), 0)
                      .toString(),
                    'PHP'
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium mb-1">Customer *</label>
                  <select
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Billing Type *</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.billingType}
                    onChange={(e) => setFormData({ ...formData, billingType: e.target.value as 'RETAINER' | 'RECURRING_SERVICE' | 'SUBSCRIPTION' | 'MAINTENANCE' })}
                  >
                    <option value="RETAINER">Retainer</option>
                    <option value="RECURRING_SERVICE">Recurring Service</option>
                    <option value="SUBSCRIPTION">Subscription</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                    <select
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    >
                      <option value="PHP">PHP</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Billing Interval *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      required
                      className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.billingInterval}
                      onChange={(e) => setFormData({ ...formData, billingInterval: e.target.value })}
                    />
                    <select
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.intervalType}
                      onChange={(e) => setFormData({ ...formData, intervalType: e.target.value as 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS' })}
                    >
                      <option value="DAYS">Days</option>
                      <option value="WEEKS">Weeks</option>
                      <option value="MONTHS">Months</option>
                      <option value="YEARS">Years</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Subscription</Button>
                <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {(subscriptions || []).length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No subscriptions yet. Create your first subscription to get started.</p>
            </CardContent>
          </Card>
        ) : (
          (subscriptions || []).map((subscription) => (
            <Card key={subscription.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{subscription.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                        {subscription.status}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getBillingTypeLabel(subscription.billingType)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{subscription.customer.name}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Coins className="h-4 w-4" />
                        {formatCurrency(subscription.amount, subscription.currency)} / {formatInterval(subscription.billingInterval, subscription.intervalType)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Next: {new Date(subscription.nextBillingDate).toLocaleDateString()}
                      </span>
                      <span>{subscription._count.invoices} invoices</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {subscription.status === 'ACTIVE' && (
                      <RoleGuard permission="createInvoices">
                        <Button 
                          size="sm" 
                          onClick={() => generateInvoice(subscription.id)}
                        >
                          Generate Invoice
                        </Button>
                      </RoleGuard>
                    )}
                    <RoleGuard permission="editInvoices">
                      {subscription.status === 'ACTIVE' ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => updateStatus(subscription.id, 'PAUSED')}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : subscription.status === 'PAUSED' ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => updateStatus(subscription.id, 'ACTIVE')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => updateStatus(subscription.id, 'CANCELLED')}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </RoleGuard>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}