'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/ui/role-guard'
import { Plus, Search, Edit, Trash2, Eye, Calendar } from 'lucide-react'

interface Expense {
  id: string
  title: string
  description?: string
  amount: number
  currency: string
  category: string
  date: string
  paymentMethod: string
  vendor?: string
  receipt?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
  submittedBy?: string
  approvedBy?: string
  createdAt: string
  updatedAt: string
}

const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Travel',
  'Meals & Entertainment',
  'Equipment',
  'Software',
  'Marketing',
  'Utilities',
  'Rent',
  'Professional Services',
  'Training',
  'Insurance',
  'Maintenance',
  'Other'
]

const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Bank Transfer',
  'Check',
  'Petty Cash',
  'Company Card',
  'Online Payment',
  'Other'
]

const EXPENSE_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'APPROVED', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'PAID', label: 'Paid', color: 'bg-blue-100 text-blue-800' },
]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'PHP',
    category: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    vendor: '',
    receipt: '',
    status: 'PENDING' as const
  })

  useEffect(() => {
    fetchExpenses()
  }, [categoryFilter, statusFilter, dateRange])

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams()
      if (categoryFilter) params.append('category', categoryFilter)
      if (statusFilter) params.append('status', statusFilter)
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)
      
      const response = await fetch(`/api/expenses?${params}`)
      const data = await response.json()
      setExpenses(data.expenses || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount)
      }

      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses'
      const method = editingExpense ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
      
      if (response.ok) {
        setShowForm(false)
        setEditingExpense(null)
        resetForm()
        fetchExpenses()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error saving expense:', error)
      alert('Failed to save expense. Please try again.')
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount.toString(),
      currency: expense.currency,
      category: expense.category,
      date: expense.date.split('T')[0],
      paymentMethod: expense.paymentMethod,
      vendor: expense.vendor || '',
      receipt: expense.receipt || '',
      status: expense.status
    })
    setShowForm(true)
  }

  const handleView = (expense: Expense) => {
    setViewingExpense(expense)
    setShowViewModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        fetchExpenses()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Failed to delete expense. Please try again.')
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        fetchExpenses()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      amount: '',
      currency: 'PHP',
      category: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      vendor: '',
      receipt: '',
      status: 'PENDING'
    })
  }

  const cancelEdit = () => {
    setShowForm(false)
    setEditingExpense(null)
    resetForm()
  }

  const formatCurrency = (amount: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const statusObj = EXPENSE_STATUSES.find(s => s.value === status)
    return statusObj?.color || 'bg-gray-100 text-gray-800'
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = searchTerm === '' ||
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const pendingExpenses = filteredExpenses.filter(e => e.status === 'PENDING').length
  const approvedExpenses = filteredExpenses.filter(e => e.status === 'APPROVED').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <RoleGuard permission="viewExpenses">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Expenses</h1>
            <p className="text-gray-600">Manage business expenses and reimbursements</p>
          </div>
          <div className="flex gap-2">
            <RoleGuard permission="createExpenses">
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </RoleGuard>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingExpenses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{approvedExpenses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Download className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredExpenses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search expenses..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            {EXPENSE_STATUSES.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
          <input
            type="date"
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            placeholder="Start Date"
          />
          <input
            type="date"
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            placeholder="End Date"
          />
        </div>

        {/* Expenses List */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{expense.title}</div>
                          {expense.description && (
                            <div className="text-sm text-gray-500">{expense.description}</div>
                          )}
                          {expense.vendor && (
                            <div className="text-sm text-gray-500">Vendor: {expense.vendor}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(expense.amount, expense.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(expense.status)}`}>
                            {expense.status}
                          </span>
                          {expense.status === 'PENDING' && (
                            <RoleGuard permission="editExpenses">
                              <select
                                className="text-xs border rounded px-2 py-1"
                                value={expense.status}
                                onChange={(e) => handleStatusUpdate(expense.id, e.target.value)}
                              >
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Approve</option>
                                <option value="REJECTED">Reject</option>
                              </select>
                            </RoleGuard>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(expense)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <RoleGuard permission="editExpenses">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </RoleGuard>
                          <RoleGuard permission="deleteExpenses">
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)}>
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
            {filteredExpenses.length === 0 && (
              <div className="text-center py-12">
                <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No expenses found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Expense Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Office supplies, Travel expense"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Additional details about the expense"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <select
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {EXPENSE_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Method *</label>
                    <select
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    >
                      <option value="">Select Payment Method</option>
                      {PAYMENT_METHODS.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vendor</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Vendor or supplier name"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Receipt/Reference</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Receipt number or reference"
                    value={formData.receipt}
                    onChange={(e) => setFormData({ ...formData, receipt: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit">
                    {editingExpense ? 'Update Expense' : 'Add Expense'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Expense Modal */}
      {showViewModal && viewingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Expense Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowViewModal(false)}>
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingExpense.title}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatCurrency(viewingExpense.amount, viewingExpense.currency)}
                    </p>
                  </div>
                </div>

                {viewingExpense.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingExpense.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingExpense.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(viewingExpense.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingExpense.paymentMethod}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`mt-1 inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingExpense.status)}`}>
                      {viewingExpense.status}
                    </span>
                  </div>
                </div>

                {viewingExpense.vendor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vendor</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingExpense.vendor}</p>
                  </div>
                )}

                {viewingExpense.receipt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Receipt/Reference</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingExpense.receipt}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1">
                      {new Date(viewingExpense.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="mt-1">
                      {new Date(viewingExpense.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <RoleGuard permission="editExpenses">
                  <Button 
                    onClick={() => {
                      setShowViewModal(false)
                      handleEdit(viewingExpense)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Expense
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
    </RoleGuard>
  )
}