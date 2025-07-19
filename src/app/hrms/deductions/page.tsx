'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/ui/role-guard'
import { Plus, Search, Edit, Trash2, User, Settings, FileText, Building2 } from 'lucide-react'

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  department: string
  position: string
  baseSalary: string
}

interface Deduction {
  id: string
  employeeId: string
  employee?: Employee
  type: string
  description?: string
  amount?: string
  percentage?: string
  currency: string
  frequency: string
  isActive: boolean
  effectiveDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
}

interface GovernmentSettings {
  sssRate: number
  sssMaxSalary: number
  philhealthRate: number
  philhealthMaxSalary: number
  pagibigRate: number
  pagibigMaxSalary: number
}

interface SidebarItem {
  id: string
  name: string
  icon: React.ElementType
  permission?: string
}

const sidebarItems: SidebarItem[] = [
  { id: 'employee', name: 'Employee Deductions', icon: User },
  { id: 'government', name: 'Government Contributions', icon: Building2 },
  { id: 'templates', name: 'Deduction Templates', icon: FileText },
  { id: 'settings', name: 'Deduction Settings', icon: Settings, permission: 'editSettings' },
]

export default function DeductionsPage() {
  const [deductions, setDeductions] = useState<Deduction[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [frequencyFilter, setFrequencyFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingDeduction, setEditingDeduction] = useState<Deduction | null>(null)
  const [activeSection, setActiveSection] = useState('employee')
  const [governmentSettings, setGovernmentSettings] = useState<GovernmentSettings>({
    sssRate: 4.5,
    sssMaxSalary: 25000,
    philhealthRate: 2.75,
    philhealthMaxSalary: 100000,
    pagibigRate: 2.0,
    pagibigMaxSalary: 5000
  })
  const [formData, setFormData] = useState({
    employeeId: '',
    type: '',
    amount: '',
    percentage: '',
    description: '',
    frequency: 'MONTHLY',
    effectiveDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true
  })

  useEffect(() => {
    fetchDeductions()
    fetchEmployees()
  }, [selectedEmployee, typeFilter, frequencyFilter])

  const fetchDeductions = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedEmployee) params.append('employeeId', selectedEmployee)
      if (typeFilter) params.append('type', typeFilter)
      if (frequencyFilter) params.append('frequency', frequencyFilter)
      
      const response = await fetch(`/api/deductions?${params}`)
      const data = await response.json()
      setDeductions(data || [])
    } catch (error) {
      console.error('Error fetching deductions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees?status=ACTIVE')
      const data = await response.json()
      setEmployees(data.employees || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        percentage: formData.percentage ? parseFloat(formData.percentage) : undefined,
        endDate: formData.endDate || undefined
      }

      const url = editingDeduction ? `/api/deductions/${editingDeduction.id}` : '/api/deductions'
      const method = editingDeduction ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
      
      if (response.ok) {
        setShowForm(false)
        setEditingDeduction(null)
        resetForm()
        fetchDeductions()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error saving deduction:', error)
      alert('Failed to save deduction. Please try again.')
    }
  }

  const handleEdit = (deduction: Deduction) => {
    setEditingDeduction(deduction)
    setFormData({
      employeeId: deduction.employeeId,
      type: deduction.type,
      amount: deduction.amount || '',
      percentage: deduction.percentage || '',
      description: deduction.description || '',
      frequency: deduction.frequency,
      effectiveDate: deduction.effectiveDate ? deduction.effectiveDate.split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: deduction.endDate ? deduction.endDate.split('T')[0] : '',
      isActive: deduction.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deduction?')) return
    
    try {
      const response = await fetch(`/api/deductions/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        fetchDeductions()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting deduction:', error)
      alert('Failed to delete deduction. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      employeeId: '',
      type: '',
      amount: '',
      percentage: '',
      description: '',
      frequency: 'MONTHLY',
      effectiveDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isActive: true
    })
  }

  const cancelEdit = () => {
    setShowForm(false)
    setEditingDeduction(null)
    resetForm()
  }

  const formatCurrency = (amount: string | undefined) => {
    if (!amount) return ''
    return `₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getFrequencyColor = (frequency: string) => {
    const colors = {
      DAILY: 'bg-blue-100 text-blue-800',
      WEEKLY: 'bg-purple-100 text-purple-800',
      BIWEEKLY: 'bg-cyan-100 text-cyan-800',
      MONTHLY: 'bg-green-100 text-green-800',
      QUARTERLY: 'bg-orange-100 text-orange-800',
      ANNUALLY: 'bg-pink-100 text-pink-800',
      ONE_TIME: 'bg-gray-100 text-gray-800',
    }
    return colors[frequency as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const filteredDeductions = deductions.filter(deduction => {
    const matchesSearch = searchTerm === '' ||
      deduction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deduction.employee?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deduction.employee?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deduction.employee?.employeeId.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const calculateGovernmentContribution = (employee: Employee, type: 'sss' | 'philhealth' | 'pagibig') => {
    const salary = parseFloat(employee.baseSalary)
    
    switch (type) {
      case 'sss':
        return Math.min(salary, governmentSettings.sssMaxSalary) * (governmentSettings.sssRate / 100)
      case 'philhealth':
        return Math.min(salary, governmentSettings.philhealthMaxSalary) * (governmentSettings.philhealthRate / 100)
      case 'pagibig':
        return Math.min(salary, governmentSettings.pagibigMaxSalary) * (governmentSettings.pagibigRate / 100)
      default:
        return 0
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
    <RoleGuard permission="viewDeductions">
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Deductions</h1>
            <p className="text-sm text-gray-600 mt-1">Manage employee deductions</p>
          </div>
          <nav className="p-4">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              
              if (item.permission) {
                return (
                  <RoleGuard key={item.id} permission={item.permission as 'editSettings'}>
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
          <div className="p-8">
            {/* Employee Deductions Section */}
            {activeSection === 'employee' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Employee Deductions</h2>
                    <p className="text-gray-600">Manage custom deductions for employees</p>
                  </div>
                  <RoleGuard permission="createDeductions">
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Deduction
                    </Button>
                  </RoleGuard>
                </div>

                {/* Filters */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search deductions..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    <option value="">All Employees</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} ({employee.employeeId})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Filter by type..."
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  />
                  <select
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={frequencyFilter}
                    onChange={(e) => setFrequencyFilter(e.target.value)}
                  >
                    <option value="">All Frequencies</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Bi-weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUALLY">Annually</option>
                    <option value="ONE_TIME">One-time</option>
                  </select>
                </div>

                {/* Deductions List */}
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredDeductions.map((deduction) => (
                            <tr key={deduction.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {deduction.employee?.firstName} {deduction.employee?.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {deduction.employee?.employeeId} • {deduction.employee?.department}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{deduction.type}</div>
                                {deduction.description && (
                                  <div className="text-sm text-gray-500">{deduction.description}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {deduction.amount ? formatCurrency(deduction.amount) : `${deduction.percentage}%`}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFrequencyColor(deduction.frequency)}`}>
                                  {deduction.frequency.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {deduction.effectiveDate ? new Date(deduction.effectiveDate).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(deduction.isActive)}`}>
                                  {deduction.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center space-x-2">
                                  <RoleGuard permission="editDeductions">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(deduction)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </RoleGuard>
                                  <RoleGuard permission="deleteDeductions">
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(deduction.id)}>
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
                    {filteredDeductions.length === 0 && (
                      <div className="text-center py-12">
                        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No deductions found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Government Contributions Section */}
            {activeSection === 'government' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Government Contributions</h2>
                  <p className="text-gray-600">View calculated government contributions for all employees</p>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Salary</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SSS</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PhilHealth</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pag-IBIG</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {employees.map((employee) => {
                            const sssAmount = calculateGovernmentContribution(employee, 'sss')
                            const philhealthAmount = calculateGovernmentContribution(employee, 'philhealth')
                            const pagibigAmount = calculateGovernmentContribution(employee, 'pagibig')
                            const total = sssAmount + philhealthAmount + pagibigAmount

                            return (
                              <tr key={employee.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {employee.firstName} {employee.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {employee.employeeId} • {employee.department}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(employee.baseSalary)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  ₱{sssAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  ₱{philhealthAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  ₱{pagibigAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Deduction Templates Section */}
            {activeSection === 'templates' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Deduction Templates</h2>
                  <p className="text-gray-600">Manage predefined deduction types</p>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Deduction templates feature coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings Section */}
            {activeSection === 'settings' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Deduction Settings</h2>
                  <p className="text-gray-600">Configure government contribution rates and limits</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Government Contribution Rates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* SSS Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">SSS Rate (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          value={governmentSettings.sssRate}
                          onChange={(e) => setGovernmentSettings({
                            ...governmentSettings,
                            sssRate: parseFloat(e.target.value) || 0
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">SSS Max Salary</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          value={governmentSettings.sssMaxSalary}
                          onChange={(e) => setGovernmentSettings({
                            ...governmentSettings,
                            sssMaxSalary: parseFloat(e.target.value) || 0
                          })}
                        />
                      </div>
                    </div>

                    {/* PhilHealth Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">PhilHealth Rate (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          value={governmentSettings.philhealthRate}
                          onChange={(e) => setGovernmentSettings({
                            ...governmentSettings,
                            philhealthRate: parseFloat(e.target.value) || 0
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">PhilHealth Max Salary</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          value={governmentSettings.philhealthMaxSalary}
                          onChange={(e) => setGovernmentSettings({
                            ...governmentSettings,
                            philhealthMaxSalary: parseFloat(e.target.value) || 0
                          })}
                        />
                      </div>
                    </div>

                    {/* Pag-IBIG Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Pag-IBIG Rate (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          value={governmentSettings.pagibigRate}
                          onChange={(e) => setGovernmentSettings({
                            ...governmentSettings,
                            pagibigRate: parseFloat(e.target.value) || 0
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Pag-IBIG Max Salary</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          value={governmentSettings.pagibigMaxSalary}
                          onChange={(e) => setGovernmentSettings({
                            ...governmentSettings,
                            pagibigMaxSalary: parseFloat(e.target.value) || 0
                          })}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button>Save Settings</Button>
                      <Button variant="secondary">Reset to Defaults</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Deduction Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingDeduction ? 'Edit Deduction' : 'Add New Deduction'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Employee *</label>
                  <select
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  >
                    <option value="">Select Employee</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} ({employee.employeeId})
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
                    placeholder="e.g., Loan, Advance, Late Fee"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value, percentage: '' })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Percentage</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                      value={formData.percentage}
                      onChange={(e) => setFormData({ ...formData, percentage: e.target.value, amount: '' })}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">Enter either amount or percentage, not both</p>
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
                  <label className="block text-sm font-medium mb-1">Frequency</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Bi-weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUALLY">Annually</option>
                    <option value="ONE_TIME">One-time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Effective Date *</label>
                  <input
                    type="date"
                    required
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
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Active deduction
                  </label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit">
                    {editingDeduction ? 'Update Deduction' : 'Add Deduction'}
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
    </RoleGuard>
  )
}