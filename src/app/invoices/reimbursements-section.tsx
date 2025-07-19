'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/ui/role-guard'
import { Plus, Receipt, Calendar, Search, Check, X, Eye, Edit, Trash2, Filter } from 'lucide-react'

interface Reimbursement {
  id: string
  reimbursementNumber: string
  title: string
  description?: string
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'PAID' | 'REJECTED' | 'CANCELLED'
  customer: {
    id: string
    name: string
    email: string
  }
  subtotal: number
  tax: number
  total: number
  issueDate: string
  dueDate?: string
  items: ReimbursementItem[]
  creator?: {
    name: string
    email: string
  }
}

interface ReimbursementItem {
  id: string
  expenseId?: string
  description: string
  amount: number
  date: string
  category: string
  receipt?: string
  notes?: string
  expense?: {
    id: string
    title: string
    category: string
  }
}

interface Customer {
  id: string
  name: string
  email: string
}

interface Expense {
  id: string
  title: string
  description?: string
  amount: number
  category: string
  date: string
  vendor?: string
  receipt?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
}

const REIMBURSEMENT_STATUSES = [
  { value: 'DRAFT', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'SENT', label: 'Sent', color: 'bg-blue-100 text-blue-800' },
  { value: 'APPROVED', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'PAID', label: 'Paid', color: 'bg-purple-100 text-purple-800' },
  { value: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-gray-100 text-gray-500' },
]

export default function ReimbursementsSection() {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expenseFilters, setExpenseFilters] = useState({
    dateFrom: '',
    dateTo: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([])
  const [customItems, setCustomItems] = useState<any[]>([])
  const [viewingReimbursement, setViewingReimbursement] = useState<Reimbursement | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingReimbursement, setEditingReimbursement] = useState<Reimbursement | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
  }

  const [formData, setFormData] = useState({
    customerId: '',
    title: '',
    description: '',
    dueDate: '',
    tax: 0,
  })

  useEffect(() => {
    fetchReimbursements()
    fetchCustomers()
    fetchExpenses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter])

  const fetchReimbursements = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      
      const response = await fetch(`/api/reimbursements?${params}`)
      const data = await response.json()
      setReimbursements(data.reimbursements || [])
    } catch (error) {
      console.error('Error fetching reimbursements:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchExpenses = async (dateFrom?: string, dateTo?: string) => {
    try {
      const params = new URLSearchParams({ status: 'APPROVED', limit: '100' })
      if (dateFrom) params.append('startDate', dateFrom)
      if (dateTo) params.append('endDate', dateTo)
      
      const response = await fetch(`/api/expenses?${params}`)
      const data = await response.json()
      setExpenses(data.expenses || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const statusObj = REIMBURSEMENT_STATUSES.find(s => s.value === status)
    return statusObj?.color || 'bg-gray-100 text-gray-800'
  }

  const handleExpenseToggle = (expenseId: string) => {
    setSelectedExpenses(prev => 
      prev.includes(expenseId) 
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    )
  }

  const handleSelectAll = () => {
    if (selectedExpenses.length === expenses.length) {
      setSelectedExpenses([])
    } else {
      setSelectedExpenses(expenses.map(expense => expense.id))
    }
  }

  const openExpenseModal = () => {
    setShowExpenseModal(true)
    if (!expenseFilters.dateFrom && !expenseFilters.dateTo) {
      fetchExpenses()
    } else {
      fetchExpenses(expenseFilters.dateFrom, expenseFilters.dateTo)
    }
  }

  const applyExpenseFilters = () => {
    fetchExpenses(expenseFilters.dateFrom, expenseFilters.dateTo)
  }

  const clearExpenseFilters = () => {
    setExpenseFilters({ dateFrom: '', dateTo: '' })
    fetchExpenses()
  }

  const addCustomItem = () => {
    setCustomItems([...customItems, {
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      category: '',
      receipt: '',
      notes: ''
    }])
  }

  const removeCustomItem = (index: number) => {
    setCustomItems(customItems.filter((_, i) => i !== index))
  }

  const updateCustomItem = (index: number, field: string, value: any) => {
    const updated = [...customItems]
    updated[index] = { ...updated[index], [field]: value }
    setCustomItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const selectedExpenseItems = expenses
      .filter(expense => selectedExpenses.includes(expense.id))
      .map(expense => ({
        expenseId: expense.id,
        description: expense.description || expense.title,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
        receipt: expense.receipt || '',
        notes: expense.title
      }))

    const allItems = [...selectedExpenseItems, ...customItems.filter(item => item.description)]

    if (allItems.length === 0) {
      showNotification('error', 'Please select expenses or add custom items')
      return
    }

    setIsSubmitting(true)

    try {
      const submitData = {
        ...formData,
        items: allItems
      }

      const url = editingReimbursement ? `/api/reimbursements/${editingReimbursement.id}` : '/api/reimbursements'
      const method = editingReimbursement ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
      
      if (response.ok) {
        const action = editingReimbursement ? 'updated' : 'created'
        showNotification('success', `Reimbursement ${action} successfully!`)
        setShowCreateForm(false)
        setShowEditModal(false)
        setEditingReimbursement(null)
        resetForm()
        fetchReimbursements()
      } else {
        const errorData = await response.json()
        showNotification('error', `Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error saving reimbursement:', error)
      showNotification('error', 'Failed to save reimbursement. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      customerId: '',
      title: '',
      description: '',
      dueDate: '',
      tax: 0,
    })
    setSelectedExpenses([])
    setCustomItems([])
  }

  const handleEdit = (reimbursement: Reimbursement) => {
    setEditingReimbursement(reimbursement)
    setFormData({
      customerId: reimbursement.customer.id,
      title: reimbursement.title,
      description: reimbursement.description || '',
      dueDate: reimbursement.dueDate ? reimbursement.dueDate.split('T')[0] : '',
      tax: reimbursement.tax,
    })
    
    // Set selected expenses and custom items
    const expenseItems = reimbursement.items.filter(item => item.expenseId)
    const customItemsData = reimbursement.items.filter(item => !item.expenseId)
    
    setSelectedExpenses(expenseItems.map(item => item.expenseId!))
    setCustomItems(customItemsData.map(item => ({
      description: item.description,
      amount: item.amount,
      date: item.date.split('T')[0],
      category: item.category,
      receipt: item.receipt || '',
      notes: item.notes || ''
    })))
    
    setShowEditModal(true)
  }

  const handleView = (reimbursement: Reimbursement) => {
    setViewingReimbursement(reimbursement)
    setShowViewModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reimbursement?')) return
    
    try {
      const response = await fetch(`/api/reimbursements/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        fetchReimbursements()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting reimbursement:', error)
      alert('Failed to delete reimbursement. Please try again.')
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingStatus(id)
    
    try {
      // If status is being changed to SENT, send email first
      if (newStatus === 'SENT') {
        const emailResponse = await fetch(`/api/reimbursements/${id}/send-email`, {
          method: 'POST',
        })
        
        if (!emailResponse.ok) {
          const emailError = await emailResponse.json()
          showNotification('error', `Failed to send email: ${emailError.error}`)
          return
        }
        
        // Email sent successfully, status will be updated by the email API
        fetchReimbursements()
        showNotification('success', 'Reimbursement sent successfully to customer!')
      } else {
        // For other status changes, just update the status
        const response = await fetch(`/api/reimbursements/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
        
        if (response.ok) {
          fetchReimbursements()
          showNotification('success', `Reimbursement status updated to ${newStatus}`)
        } else {
          const errorData = await response.json()
          showNotification('error', `Error: ${errorData.error}`)
        }
      }
    } catch (error) {
      console.error('Error updating status:', error)
      showNotification('error', 'Failed to update status. Please try again.')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const cancelEdit = () => {
    setShowCreateForm(false)
    setShowEditModal(false)
    setEditingReimbursement(null)
    resetForm()
  }

  const filteredReimbursements = reimbursements.filter(reimbursement => {
    const matchesSearch = searchTerm === '' ||
      reimbursement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reimbursement.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reimbursement.reimbursementNumber.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 z-[70] p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        } max-w-md`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <Check className="h-5 w-5 mr-2" />
              ) : (
                <X className="h-5 w-5 mr-2" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Reimbursements</h1>
          <p className="text-gray-600">Bill customers for approved expenses</p>
        </div>
        <RoleGuard permission="createReimbursements">
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Reimbursement
          </Button>
        </RoleGuard>
      </div>

      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingReimbursement ? 'Edit Reimbursement' : 'Create New Reimbursement'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        {customer.name} ({customer.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Business Travel Expenses"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Additional details about this reimbursement"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tax Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.tax}
                    onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Expense Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium">Select Approved Expenses</label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={openExpenseModal}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Select Expenses ({selectedExpenses.length} selected)
                  </Button>
                </div>
                
                {selectedExpenses.length > 0 && (
                  <div className="border rounded-md p-3 bg-gray-50">
                    <div className="text-sm text-gray-600 mb-2">
                      Selected {selectedExpenses.length} expense{selectedExpenses.length !== 1 ? 's' : ''}
                    </div>
                    <div className="space-y-1">
                      {expenses
                        .filter(expense => selectedExpenses.includes(expense.id))
                        .map((expense) => (
                          <div key={expense.id} className="flex justify-between text-sm">
                            <span>{expense.title}</span>
                            <span className="font-medium">{formatCurrency(expense.amount)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium">Additional Items</label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addCustomItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Item
                  </Button>
                </div>
                
                {customItems.map((item, index) => (
                  <div key={index} className="border rounded-md p-4 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Description"
                        className="px-3 py-2 border rounded-md"
                        value={item.description}
                        onChange={(e) => updateCustomItem(index, 'description', e.target.value)}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        className="px-3 py-2 border rounded-md"
                        value={item.amount}
                        onChange={(e) => updateCustomItem(index, 'amount', parseFloat(e.target.value) || 0)}
                      />
                      <input
                        type="date"
                        className="px-3 py-2 border rounded-md"
                        value={item.date}
                        onChange={(e) => updateCustomItem(index, 'date', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Category"
                        className="px-3 py-2 border rounded-md"
                        value={item.category}
                        onChange={(e) => updateCustomItem(index, 'category', e.target.value)}
                      />
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Receipt/Reference"
                        className="flex-1 px-3 py-2 border rounded-md"
                        value={item.receipt}
                        onChange={(e) => updateCustomItem(index, 'receipt', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => removeCustomItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingReimbursement ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    editingReimbursement ? 'Update Reimbursement' : 'Create Reimbursement'
                  )}
                </Button>
                <Button type="button" variant="secondary" onClick={cancelEdit} disabled={isSubmitting}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search reimbursements..."
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
          {REIMBURSEMENT_STATUSES.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>

      {/* Reimbursements Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reimbursement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReimbursements.map((reimbursement) => (
                  <tr key={reimbursement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{reimbursement.reimbursementNumber}</div>
                        <div className="text-sm text-gray-500">{reimbursement.title}</div>
                        <div className="text-sm text-gray-400">{reimbursement.items.length} items</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{reimbursement.customer.name}</div>
                      <div className="text-sm text-gray-500">{reimbursement.customer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(reimbursement.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(reimbursement.issueDate).toLocaleDateString()}
                      {reimbursement.dueDate && (
                        <div className="text-xs text-gray-400">
                          Due: {new Date(reimbursement.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(reimbursement.status)}`}>
                          {reimbursement.status}
                        </span>
                        {reimbursement.status === 'DRAFT' && (
                          <RoleGuard permission="editReimbursements">
                            {updatingStatus === reimbursement.id ? (
                              <div className="flex items-center text-xs text-gray-500">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                                Updating...
                              </div>
                            ) : (
                              <select
                                className="text-xs border rounded px-2 py-1"
                                value={reimbursement.status}
                                onChange={(e) => handleStatusUpdate(reimbursement.id, e.target.value)}
                                disabled={updatingStatus === reimbursement.id}
                              >
                                <option value="DRAFT">Draft</option>
                                <option value="SENT">Send</option>
                                <option value="CANCELLED">Cancel</option>
                              </select>
                            )}
                          </RoleGuard>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleView(reimbursement)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <RoleGuard permission="editReimbursements">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(reimbursement)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </RoleGuard>
                        <RoleGuard permission="deleteReimbursements">
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(reimbursement.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </RoleGuard>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredReimbursements.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No reimbursements found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Selection Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Select Approved Expenses</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowExpenseModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Date Filters */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date From
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={expenseFilters.dateFrom}
                      onChange={(e) => setExpenseFilters({ ...expenseFilters, dateFrom: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date To
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={expenseFilters.dateTo}
                      onChange={(e) => setExpenseFilters({ ...expenseFilters, dateTo: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={applyExpenseFilters}
                    >
                      Apply Filter
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={clearExpenseFilters}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              {/* Select All Checkbox */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="selectAllExpenses"
                    checked={expenses.length > 0 && selectedExpenses.length === expenses.length}
                    onChange={handleSelectAll}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="selectAllExpenses" className="text-sm font-medium text-gray-700">
                    Select All ({expenses.length} expenses)
                  </label>
                </div>
                <div className="text-sm text-gray-500">
                  {selectedExpenses.length} selected
                </div>
              </div>

              {/* Expenses List */}
              <div className="border rounded-md overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  {expenses.length > 0 ? (
                    <div className="space-y-0">
                      {expenses.map((expense) => (
                        <div key={expense.id} className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50">
                          <div className="flex items-center flex-1">
                            <input
                              type="checkbox"
                              checked={selectedExpenses.includes(expense.id)}
                              onChange={() => handleExpenseToggle(expense.id)}
                              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{expense.title}</div>
                              <div className="text-sm text-gray-500">
                                {expense.category} • {new Date(expense.date).toLocaleDateString()}
                                {expense.vendor && ` • ${expense.vendor}`}
                              </div>
                              {expense.description && (
                                <div className="text-sm text-gray-400 mt-1">{expense.description}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-medium text-gray-900">{formatCurrency(expense.amount)}</div>
                            {expense.receipt && (
                              <div className="text-xs text-gray-500">Receipt: {expense.receipt}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No approved expenses found for the selected date range</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              {selectedExpenses.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-900">
                      Selected {selectedExpenses.length} expense{selectedExpenses.length !== 1 ? 's' : ''}
                    </span>
                    <span className="font-semibold text-blue-900">
                      Total: {formatCurrency(
                        expenses
                          .filter(expense => selectedExpenses.includes(expense.id))
                          .reduce((sum, expense) => sum + expense.amount, 0)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowExpenseModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowExpenseModal(false)}
                  disabled={selectedExpenses.length === 0}
                >
                  Add Selected Expenses
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingReimbursement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Reimbursement Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowViewModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Header Information - Compact */}
              <div className="border rounded-lg p-6 bg-gray-50 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{viewingReimbursement.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{viewingReimbursement.reimbursementNumber}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {formatCurrency(viewingReimbursement.total)}
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(viewingReimbursement.status)}`}>
                      {viewingReimbursement.status}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Customer:</span>
                    <p className="text-gray-900">{viewingReimbursement.customer.name}</p>
                    <p className="text-gray-500">{viewingReimbursement.customer.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Issue Date:</span>
                    <p className="text-gray-900">{new Date(viewingReimbursement.issueDate).toLocaleDateString()}</p>
                    {viewingReimbursement.dueDate && (
                      <>
                        <span className="font-medium text-gray-700">Payment Due:</span>
                        <p className="text-gray-900">{new Date(viewingReimbursement.dueDate).toLocaleDateString()}</p>
                      </>
                    )}
                  </div>
                  <div>
                    {viewingReimbursement.description && (
                      <>
                        <span className="font-medium text-gray-700">Description:</span>
                        <p className="text-gray-900">{viewingReimbursement.description}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Reimbursement Items</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewingReimbursement.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(item.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="font-medium">{item.category}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {item.receipt || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.expense && (
                              <div className="text-xs text-blue-600">
                                {item.expense.title}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            1
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(viewingReimbursement.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>{formatCurrency(viewingReimbursement.tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(viewingReimbursement.total)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <RoleGuard permission="editReimbursements">
                  <Button 
                    onClick={() => {
                      setShowViewModal(false)
                      handleEdit(viewingReimbursement)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Reimbursement
                  </Button>
                </RoleGuard>
                <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingReimbursement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Edit Reimbursement</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowEditModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          {customer.name} ({customer.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Business Travel Expenses"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Additional details about this reimbursement"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tax Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.tax}
                      onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* Expense Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium">Select Approved Expenses</label>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={openExpenseModal}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Select Expenses ({selectedExpenses.length} selected)
                    </Button>
                  </div>
                  
                  {selectedExpenses.length > 0 && (
                    <div className="border rounded-md p-3 bg-gray-50">
                      <div className="text-sm text-gray-600 mb-2">
                        Selected {selectedExpenses.length} expense{selectedExpenses.length !== 1 ? 's' : ''}
                      </div>
                      <div className="space-y-1">
                        {expenses
                          .filter(expense => selectedExpenses.includes(expense.id))
                          .map((expense) => (
                            <div key={expense.id} className="flex justify-between text-sm">
                              <span>{expense.title}</span>
                              <span className="font-medium">{formatCurrency(expense.amount)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium">Additional Items</label>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={addCustomItem}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom Item
                    </Button>
                  </div>
                  
                  {customItems.map((item, index) => (
                    <div key={index} className="border rounded-md p-4 mb-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                        <input
                          type="text"
                          placeholder="Description"
                          className="px-3 py-2 border rounded-md"
                          value={item.description}
                          onChange={(e) => updateCustomItem(index, 'description', e.target.value)}
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          className="px-3 py-2 border rounded-md"
                          value={item.amount}
                          onChange={(e) => updateCustomItem(index, 'amount', parseFloat(e.target.value) || 0)}
                        />
                        <input
                          type="date"
                          className="px-3 py-2 border rounded-md"
                          value={item.date}
                          onChange={(e) => updateCustomItem(index, 'date', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Category"
                          className="px-3 py-2 border rounded-md"
                          value={item.category}
                          onChange={(e) => updateCustomItem(index, 'category', e.target.value)}
                        />
                      </div>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="Receipt/Reference"
                          className="flex-1 px-3 py-2 border rounded-md"
                          value={item.receipt}
                          onChange={(e) => updateCustomItem(index, 'receipt', e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => removeCustomItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </div>
                    ) : (
                      'Update Reimbursement'
                    )}
                  </Button>
                  <Button type="button" variant="secondary" onClick={cancelEdit} disabled={isSubmitting}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}