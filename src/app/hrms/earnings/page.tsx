'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/ui/role-guard'
import { Plus, Search, Edit, Trash2, User } from 'lucide-react'

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  department: string
  position: string
}

interface Earning {
  id: string
  employeeId: string
  employee?: Employee
  type: string
  description?: string
  amount: string
  currency: string
  frequency: string
  isActive: boolean
  effectiveDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [frequencyFilter, setFrequencyFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEarning, setEditingEarning] = useState<Earning | null>(null)
  const [formData, setFormData] = useState({
    employeeId: '',
    type: '',
    amount: '',
    description: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    endDate: '',
    frequency: 'MONTHLY',
    isActive: true
  })

  useEffect(() => {
    fetchEarnings()
    fetchEmployees()
  }, [searchTerm, selectedEmployee, typeFilter, frequencyFilter])

  const fetchEarnings = async () => {
    try {
      setLoading(true)
      
      // Get all earnings from all employees
      const employeesResponse = await fetch('/api/employees')
      const employeesData = await employeesResponse.json()
      
      const allEarnings: Earning[] = []
      
      for (const employee of employeesData.employees) {
        try {
          const earningsResponse = await fetch(`/api/employees/${employee.id}/earnings`)
          if (earningsResponse.ok) {
            const earningsData = await earningsResponse.json()
            const earningsWithEmployee = earningsData.map((earning: Earning) => ({
              ...earning,
              employee: {
                id: employee.id,
                employeeId: employee.employeeId,
                firstName: employee.firstName,
                lastName: employee.lastName,
                department: employee.department,
                position: employee.position
              }
            }))
            allEarnings.push(...earningsWithEmployee)
          }
        } catch (error) {
          console.error(`Error fetching earnings for employee ${employee.id}:`, error)
        }
      }
      
      // Apply filters
      let filteredEarnings = allEarnings
      
      if (searchTerm) {
        filteredEarnings = filteredEarnings.filter(earning =>
          earning.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          earning.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          earning.employee?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          earning.employee?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          earning.employee?.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      if (selectedEmployee) {
        filteredEarnings = filteredEarnings.filter(earning => earning.employeeId === selectedEmployee)
      }
      
      if (typeFilter) {
        filteredEarnings = filteredEarnings.filter(earning => earning.type === typeFilter)
      }
      
      if (frequencyFilter) {
        filteredEarnings = filteredEarnings.filter(earning => earning.frequency === frequencyFilter)
      }
      
      setEarnings(filteredEarnings)
    } catch (error) {
      console.error('Error fetching earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      const data = await response.json()
      setEmployees(data.employees || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      employeeId: '',
      type: '',
      amount: '',
      description: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      endDate: '',
      frequency: 'MONTHLY',
      isActive: true
    })
    setEditingEarning(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.employeeId) {
      alert('Please select an employee')
      return
    }

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        endDate: formData.endDate || undefined
      }

      const url = editingEarning 
        ? `/api/employees/${formData.employeeId}/earnings/${editingEarning.id}`
        : `/api/employees/${formData.employeeId}/earnings`
      
      const method = editingEarning ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
      
      if (response.ok) {
        setShowForm(false)
        resetForm()
        fetchEarnings()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error saving earning:', error)
      alert('Failed to save earning. Please try again.')
    }
  }

  const handleEdit = (earning: Earning) => {
    setEditingEarning(earning)
    setFormData({
      employeeId: earning.employeeId,
      type: earning.type,
      amount: earning.amount.toString(),
      description: earning.description || '',
      effectiveDate: earning.effectiveDate ? earning.effectiveDate.split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: earning.endDate ? earning.endDate.split('T')[0] : '',
      frequency: earning.frequency || 'MONTHLY',
      isActive: earning.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (earning: Earning) => {
    if (!confirm('Are you sure you want to delete this earning?')) return

    try {
      const response = await fetch(`/api/employees/${earning.employeeId}/earnings/${earning.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        fetchEarnings()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting earning:', error)
      alert('Failed to delete earning. Please try again.')
    }
  }

  const formatCurrency = (amount: string) => {
    return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
  }

  const getUniqueTypes = () => {
    const types = earnings.map(earning => earning.type)
    return [...new Set(types)].sort()
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
        <h1 className="text-3xl font-bold">Earnings Management</h1>
        <RoleGuard permission="createEarnings">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Earning
          </Button>
        </RoleGuard>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by type, employee..."
                  className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Employee</label>
              <select
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">All Employees</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.employeeId} - {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                {getUniqueTypes().map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Frequency</label>
              <select
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={frequencyFilter}
                onChange={(e) => setFrequencyFilter(e.target.value)}
              >
                <option value="">All Frequencies</option>
                <option value="HOURLY">Hourly</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Bi-weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="ANNUALLY">Annually</option>
                <option value="ONE_TIME">One-time</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Employee Earnings ({earnings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {earnings.map((earning) => (
                    <tr key={earning.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {earning.employee?.firstName} {earning.employee?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {earning.employee?.employeeId} - {earning.employee?.department}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {earning.type}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {earning.description || '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(earning.amount)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {earning.frequency?.replace('_', ' ') || 'Monthly'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {earning.effectiveDate ? new Date(earning.effectiveDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          earning.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {earning.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex gap-1">
                          <RoleGuard permission="editEarnings">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(earning)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          </RoleGuard>
                          <RoleGuard permission="deleteEarnings">
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(earning)}>
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </RoleGuard>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-gray-500">
              No earnings found. Add some earnings to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingEarning ? 'Edit Earning' : 'Add New Earning'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Employee *</label>
                  <select
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    disabled={!!editingEarning}
                  >
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.employeeId} - {employee.firstName} {employee.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Base Salary, Overtime, Bonus"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Optional description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Effective Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave blank if ongoing</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Frequency</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  >
                    <option value="HOURLY">Hourly</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Bi-weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUALLY">Annually</option>
                    <option value="ONE_TIME">One-time</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Active earning
                  </label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit">
                    {editingEarning ? 'Update Earning' : 'Add Earning'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => {
                      setShowForm(false)
                      resetForm()
                    }}
                  >
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