'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/ui/role-guard'
import { PayslipViewer } from '@/components/ui/payslip-viewer'
import { Plus, Search, Mail, Phone, Edit, Trash2, Eye, Building2, Briefcase, Receipt } from 'lucide-react'

interface Address {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
}

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: string
  hireDate: string
  department: string
  position: string
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'CONSULTANT'
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE'
  baseSalary: string
  currency: string
  address?: Address
  emergencyContact?: EmergencyContact
  notes?: string
  createdAt: string
  updatedAt: string
}

const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERN', label: 'Intern' },
  { value: 'CONSULTANT', label: 'Consultant' },
]

const EMPLOYEE_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'ON_LEAVE', label: 'On Leave' },
]

const DEPARTMENTS = [
  'Engineering',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
  'Legal',
  'Administration',
  'IT',
]

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    hireDate: '',
    department: '',
    position: '',
    employmentType: 'FULL_TIME' as const,
    status: 'ACTIVE' as const,
    baseSalary: '',
    currency: 'PHP',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    notes: ''
  })
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'earnings' | 'deductions' | 'payslips'>('details')
  const [employeeEarnings, setEmployeeEarnings] = useState<{
    id: string
    type: string
    amount: string
    description?: string
    effectiveDate?: string
    endDate?: string
    frequency?: string
    isActive: boolean
  }[]>([])
  const [employeeDeductions, setEmployeeDeductions] = useState<{
    id: string
    type: string
    amount?: string
    percentage?: string
    description?: string
    effectiveDate?: string
    endDate?: string
    frequency?: string
    isActive: boolean
  }[]>([])
  const [loadingEarningsDeductions, setLoadingEarningsDeductions] = useState(false)
  const [showEarningForm, setShowEarningForm] = useState(false)
  const [showDeductionForm, setShowDeductionForm] = useState(false)
  const [editingEarning, setEditingEarning] = useState<{
    id: string
    type: string
    amount: string
    description?: string
    effectiveDate?: string
    endDate?: string
    frequency?: string
    isActive: boolean
  } | null>(null)
  const [editingDeduction, setEditingDeduction] = useState<{
    id: string
    type: string
    amount?: string
    percentage?: string
    description?: string
    effectiveDate?: string
    endDate?: string
    frequency?: string
    isActive: boolean
  } | null>(null)
  const [employeePayslips, setEmployeePayslips] = useState<{
    id: string
    payPeriodStart: string
    payPeriodEnd: string
    payDate?: string
    grossPay?: string
    totalDeductions?: string
    netPay?: string
    status: string
  }[]>([])
  const [loadingPayslips, setLoadingPayslips] = useState(false)
  const [selectedPayslip, setSelectedPayslip] = useState<string | null>(null)
  const [deductionsSubTab, setDeductionsSubTab] = useState<'employee' | 'government'>('employee')
  const [governmentContributions, setGovernmentContributions] = useState<{
    type: string
    description: string
    amount: number
    frequency: string
  }[]>([])
  const [earningFormData, setEarningFormData] = useState({
    type: '',
    amount: '',
    description: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    endDate: '',
    frequency: 'MONTHLY',
    isActive: true
  })
  const [deductionFormData, setDeductionFormData] = useState({
    type: '',
    amount: '',
    percentage: '',
    description: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    endDate: '',
    frequency: 'MONTHLY',
    isActive: true
  })

  useEffect(() => {
    fetchEmployees()
  }, [searchTerm, departmentFilter, statusFilter])

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
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      TERMINATED: 'bg-red-100 text-red-800',
      ON_LEAVE: 'bg-yellow-100 text-yellow-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getEmploymentTypeColor = (type: string) => {
    const colors = {
      FULL_TIME: 'bg-blue-100 text-blue-800',
      PART_TIME: 'bg-purple-100 text-purple-800',
      CONTRACT: 'bg-orange-100 text-orange-800',
      INTERN: 'bg-cyan-100 text-cyan-800',
      CONSULTANT: 'bg-pink-100 text-pink-800',
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const fetchEmployees = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (departmentFilter) params.append('department', departmentFilter)
      if (statusFilter) params.append('status', statusFilter)
      
      const response = await fetch(`/api/employees?${params}`)
      const data = await response.json()
      setEmployees(data.employees || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        baseSalary: parseFloat(formData.baseSalary),
        dateOfBirth: formData.dateOfBirth || undefined,
        address: Object.values(formData.address).some(v => v) ? formData.address : undefined,
        emergencyContact: Object.values(formData.emergencyContact).some(v => v) ? formData.emergencyContact : undefined,
      }

      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
      
      if (response.ok) {
        setShowAddForm(false)
        resetForm()
        fetchEmployees()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error creating employee:', error)
      alert('Failed to create employee. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return
    
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        fetchEmployees()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('Failed to delete employee. Please try again.')
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone || '',
      dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
      hireDate: employee.hireDate.split('T')[0],
      department: employee.department,
      position: employee.position,
      employmentType: employee.employmentType,
      status: employee.status,
      baseSalary: employee.baseSalary,
      currency: employee.currency,
      address: employee.address || {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      },
      emergencyContact: {
        name: employee.emergencyContact?.name || '',
        relationship: employee.emergencyContact?.relationship || '',
        phone: employee.emergencyContact?.phone || '',
        email: employee.emergencyContact?.email || ''
      },
      notes: employee.notes || ''
    })
    setShowEditForm(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee) return

    try {
      const submitData = {
        ...formData,
        baseSalary: parseFloat(formData.baseSalary),
        dateOfBirth: formData.dateOfBirth || undefined,
        address: Object.values(formData.address).some(v => v) ? formData.address : undefined,
        emergencyContact: Object.values(formData.emergencyContact).some(v => v) ? formData.emergencyContact : undefined,
      }

      const response = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
      
      if (response.ok) {
        setShowEditForm(false)
        setEditingEmployee(null)
        resetForm()
        fetchEmployees()
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      alert('Failed to update employee. Please try again.')
    }
  }

  const fetchEmployeeEarningsDeductions = async (employeeId: string) => {
    setLoadingEarningsDeductions(true)
    try {
      const [earningsResponse, deductionsResponse] = await Promise.all([
        fetch(`/api/employees/${employeeId}/earnings`),
        fetch(`/api/employees/${employeeId}/deductions`)
      ])
      
      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json()
        setEmployeeEarnings(earningsData)
      } else {
        setEmployeeEarnings([])
      }
      
      if (deductionsResponse.ok) {
        const deductionsData = await deductionsResponse.json()
        setEmployeeDeductions(deductionsData)
      } else {
        setEmployeeDeductions([])
      }
    } catch (error) {
      console.error('Error fetching employee earnings/deductions:', error)
      setEmployeeEarnings([])
      setEmployeeDeductions([])
    } finally {
      setLoadingEarningsDeductions(false)
    }
  }

  const fetchEmployeePayslips = async (employeeId: string) => {
    setLoadingPayslips(true)
    try {
      const response = await fetch(`/api/payroll?employeeId=${employeeId}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setEmployeePayslips(data.payrolls || [])
      } else {
        setEmployeePayslips([])
      }
    } catch (error) {
      console.error('Error fetching employee payslips:', error)
      setEmployeePayslips([])
    } finally {
      setLoadingPayslips(false)
    }
  }

  const calculateGovernmentContributions = (employee: Employee) => {
    if (!employee) return []
    
    const baseSalary = parseFloat(employee.baseSalary)
    const contributions = []
    
    // SSS Contribution (4.5% of salary, max ₱25,000)
    const sssContribution = Math.min(baseSalary, 25000) * 0.045
    contributions.push({
      type: 'SSS Contribution',
      description: '4.5% of salary (Employee share)',
      amount: sssContribution,
      frequency: 'MONTHLY'
    })
    
    // PhilHealth Contribution (2.75% of salary, max ₱100,000)
    const philhealthContribution = Math.min(baseSalary, 100000) * 0.0275
    contributions.push({
      type: 'PhilHealth Contribution', 
      description: '2.75% of salary (Employee share)',
      amount: philhealthContribution,
      frequency: 'MONTHLY'
    })
    
    // Pag-IBIG Contribution (2% of salary, max ₱5,000)
    const pagibigContribution = Math.min(baseSalary, 5000) * 0.02
    contributions.push({
      type: 'Pag-IBIG Contribution',
      description: '2% of salary (Employee share)',
      amount: pagibigContribution,
      frequency: 'MONTHLY'
    })
    
    return contributions
  }

  const handleView = (employee: Employee) => {
    setViewingEmployee(employee)
    setShowViewModal(true)
    setActiveTab('details')
  }

  const resetForm = () => {
    setFormData({
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      hireDate: '',
      department: '',
      position: '',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      baseSalary: '',
      currency: 'PHP',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
        email: ''
      },
      notes: ''
    })
  }

  const cancelEdit = () => {
    setShowEditForm(false)
    setEditingEmployee(null)
    resetForm()
  }

  const closeViewModal = () => {
    setShowViewModal(false)
    setViewingEmployee(null)
    setActiveTab('details')
    setEmployeeEarnings([])
    setEmployeeDeductions([])
    setEmployeePayslips([])
    setLoadingEarningsDeductions(false)
    setLoadingPayslips(false)
    setShowEarningForm(false)
    setShowDeductionForm(false)
    setSelectedPayslip(null)
    setDeductionsSubTab('employee')
    setGovernmentContributions([])
    resetEarningForm()
    resetDeductionForm()
  }

  const resetEarningForm = () => {
    setEarningFormData({
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

  const resetDeductionForm = () => {
    setDeductionFormData({
      type: '',
      amount: '',
      percentage: '',
      description: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      endDate: '',
      frequency: 'MONTHLY',
      isActive: true
    })
    setEditingDeduction(null)
  }

  const handleEarningSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!viewingEmployee) return

    try {
      const submitData = {
        ...earningFormData,
        amount: parseFloat(earningFormData.amount),
        endDate: earningFormData.endDate || undefined
      }

      const url = editingEarning 
        ? `/api/employees/${viewingEmployee.id}/earnings/${editingEarning.id}`
        : `/api/employees/${viewingEmployee.id}/earnings`
      
      const method = editingEarning ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
      
      if (response.ok) {
        setShowEarningForm(false)
        resetEarningForm()
        fetchEmployeeEarningsDeductions(viewingEmployee.id)
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error saving earning:', error)
      alert('Failed to save earning. Please try again.')
    }
  }

  const handleDeductionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!viewingEmployee) return

    // Validate that either amount or percentage is provided
    if (!deductionFormData.amount && !deductionFormData.percentage) {
      alert('Please enter either an amount or percentage')
      return
    }

    try {
      const submitData = {
        ...deductionFormData,
        amount: deductionFormData.amount ? parseFloat(deductionFormData.amount) : undefined,
        percentage: deductionFormData.percentage ? parseFloat(deductionFormData.percentage) : undefined,
        endDate: deductionFormData.endDate || undefined
      }

      const url = editingDeduction 
        ? `/api/employees/${viewingEmployee.id}/deductions/${editingDeduction.id}`
        : `/api/employees/${viewingEmployee.id}/deductions`
      
      const method = editingDeduction ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
      
      if (response.ok) {
        setShowDeductionForm(false)
        resetDeductionForm()
        fetchEmployeeEarningsDeductions(viewingEmployee.id)
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error saving deduction:', error)
      alert('Failed to save deduction. Please try again.')
    }
  }

  const handleEditEarning = (earning: {
    id: string
    type: string
    amount: string
    description?: string
    effectiveDate?: string
    endDate?: string
    frequency?: string
    isActive: boolean
  }) => {
    setEditingEarning(earning)
    setEarningFormData({
      type: earning.type,
      amount: earning.amount.toString(),
      description: earning.description || '',
      effectiveDate: earning.effectiveDate ? earning.effectiveDate.split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: earning.endDate ? earning.endDate.split('T')[0] : '',
      frequency: earning.frequency || 'MONTHLY',
      isActive: earning.isActive
    })
    setShowEarningForm(true)
  }

  const handleEditDeduction = (deduction: {
    id: string
    type: string
    amount?: string
    percentage?: string
    description?: string
    effectiveDate?: string
    endDate?: string
    frequency?: string
    isActive: boolean
  }) => {
    setEditingDeduction(deduction)
    setDeductionFormData({
      type: deduction.type,
      amount: deduction.amount ? deduction.amount.toString() : '',
      percentage: deduction.percentage ? deduction.percentage.toString() : '',
      description: deduction.description || '',
      effectiveDate: deduction.effectiveDate ? deduction.effectiveDate.split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: deduction.endDate ? deduction.endDate.split('T')[0] : '',
      frequency: deduction.frequency || 'MONTHLY',
      isActive: deduction.isActive
    })
    setShowDeductionForm(true)
  }

  const handleDeleteEarning = async (earningId: string) => {
    if (!viewingEmployee || !confirm('Are you sure you want to delete this earning?')) return

    try {
      const response = await fetch(`/api/employees/${viewingEmployee.id}/earnings/${earningId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        fetchEmployeeEarningsDeductions(viewingEmployee.id)
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting earning:', error)
      alert('Failed to delete earning. Please try again.')
    }
  }

  const handleDeleteDeduction = async (deductionId: string) => {
    if (!viewingEmployee || !confirm('Are you sure you want to delete this deduction?')) return

    try {
      const response = await fetch(`/api/employees/${viewingEmployee.id}/deductions/${deductionId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        fetchEmployeeEarningsDeductions(viewingEmployee.id)
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting deduction:', error)
      alert('Failed to delete deduction. Please try again.')
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
        <h1 className="text-3xl font-bold">Employees</h1>
        <div className="flex gap-2">
          <RoleGuard permission="createEmployees">
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </RoleGuard>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search employees..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
        <select
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {EMPLOYEE_STATUSES.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>

      {/* Add Employee Form */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Employee ID</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Leave blank for auto-generation"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to auto-generate based on settings
                    </p>
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
                    <label className="block text-sm font-medium mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                    <label className="block text-sm font-medium mb-1">Date of Birth</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-3">Employment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Hire Date *</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.hireDate}
                      onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Department *</label>
                    <select
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Position *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Employment Type</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'CONSULTANT' })}
                    >
                      {EMPLOYMENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE' })}
                    >
                      {EMPLOYEE_STATUSES.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Base Salary *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
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

              {/* Emergency Contact */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-3">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.emergencyContact.name}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, name: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Relationship</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.emergencyContact.relationship}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, relationship: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.emergencyContact.phone}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phone: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.emergencyContact.email}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, email: e.target.value } })}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Employee</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Employee Form */}
      {showEditForm && editingEmployee && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Edit Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-6">
              {/* Same form structure as add form, but with update handler */}
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Employee ID *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
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
                    <label className="block text-sm font-medium mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                    <label className="block text-sm font-medium mb-1">Date of Birth</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-3">Employment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Hire Date *</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.hireDate}
                      onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Department *</label>
                    <select
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Position *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Employment Type</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'CONSULTANT' })}
                    >
                      {EMPLOYMENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE' })}
                    >
                      {EMPLOYEE_STATUSES.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Base Salary *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Update Employee</Button>
                <Button type="button" variant="secondary" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Employee List */}
      <div className="grid gap-4">
        {employees.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No employees found. Add your first employee to get started.</p>
            </CardContent>
          </Card>
        ) : (
          employees.map((employee) => (
            <Card key={employee.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <h3 className="text-lg font-semibold">{employee.firstName} {employee.lastName}</h3>
                  <p className="text-sm text-gray-600 mb-1">ID: {employee.employeeId}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {employee.email}
                    </span>
                    {employee.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {employee.phone}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {employee.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {employee.position}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(employee.status)}`}>
                      {employee.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEmploymentTypeColor(employee.employmentType)}`}>
                      {employee.employmentType.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Salary: {formatCurrency(employee.baseSalary, employee.currency)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleView(employee)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <RoleGuard permission="editEmployees">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </RoleGuard>
                  <RoleGuard permission="deleteEmployees">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(employee.id)}
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

      {/* View Employee Modal */}
      {showViewModal && viewingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Employee Details</h2>
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
                      setActiveTab('earnings')
                      if (employeeEarnings.length === 0 && !loadingEarningsDeductions) {
                        fetchEmployeeEarningsDeductions(viewingEmployee.id)
                      }
                    }}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'earnings'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Earnings
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('deductions')
                      if (employeeDeductions.length === 0 && !loadingEarningsDeductions) {
                        fetchEmployeeEarningsDeductions(viewingEmployee.id)
                      }
                    }}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'deductions'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Deductions
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('payslips')
                      if (employeePayslips.length === 0 && !loadingPayslips) {
                        fetchEmployeePayslips(viewingEmployee.id)
                      }
                    }}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'payslips'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Payslips
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="space-y-4">
                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Full Name</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingEmployee.firstName} {viewingEmployee.lastName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingEmployee.employeeId}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingEmployee.email}</p>
                        </div>
                        {viewingEmployee.phone && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <p className="mt-1 text-sm text-gray-900">{viewingEmployee.phone}</p>
                          </div>
                        )}
                        {viewingEmployee.dateOfBirth && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                            <p className="mt-1 text-sm text-gray-900">
                              {new Date(viewingEmployee.dateOfBirth).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Employment Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Employment Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Department</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingEmployee.department}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Position</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingEmployee.position}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                          <p className="mt-1 text-sm text-gray-900">{viewingEmployee.employmentType.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingEmployee.status)}`}>
                            {viewingEmployee.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Hire Date</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date(viewingEmployee.hireDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Base Salary</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {formatCurrency(viewingEmployee.baseSalary, viewingEmployee.currency)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    {viewingEmployee.address && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Address</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Full Address</label>
                            <p className="mt-1 text-sm text-gray-900">{formatAddress(viewingEmployee.address)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Emergency Contact */}
                    {viewingEmployee.emergencyContact && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Emergency Contact</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <p className="mt-1 text-sm text-gray-900">{viewingEmployee.emergencyContact.name}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Relationship</label>
                            <p className="mt-1 text-sm text-gray-900">{viewingEmployee.emergencyContact.relationship}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <p className="mt-1 text-sm text-gray-900">{viewingEmployee.emergencyContact.phone}</p>
                          </div>
                          {viewingEmployee.emergencyContact.email && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Email</label>
                              <p className="mt-1 text-sm text-gray-900">{viewingEmployee.emergencyContact.email}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {viewingEmployee.notes && (
                      <div className="col-span-full mt-6">
                        <h3 className="text-lg font-semibold mb-3">Notes</h3>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingEmployee.notes}</p>
                      </div>
                    )}
                  </div>
                )}

            {/* Earnings Tab */}
                {activeTab === 'earnings' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Employee Earnings</h3>
                      <RoleGuard permission="createEarnings">
                        <Button size="sm" onClick={() => setShowEarningForm(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Earning
                        </Button>
                      </RoleGuard>
                    </div>
                    
                    {loadingEarningsDeductions ? (
                      <div className="text-center py-4">
                        <div className="text-sm text-gray-500">Loading earnings...</div>
                      </div>
                    ) : employeeEarnings.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {employeeEarnings.map((earning) => (
                                <tr key={earning.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {earning.type}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-500">
                                    {earning.description || '-'}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    ₱{parseFloat(earning.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {earning.effectiveDate ? new Date(earning.effectiveDate).toLocaleDateString() : '-'}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {earning.frequency?.replace('_', ' ') || 'Monthly'}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex gap-1">
                                      <RoleGuard permission="editEarnings">
                                        <Button variant="ghost" size="sm" onClick={() => handleEditEarning(earning)}>
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                      </RoleGuard>
                                      <RoleGuard permission="deleteEarnings">
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteEarning(earning.id)}>
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
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sm text-gray-500">
                        No earnings found for this employee.
                      </div>
                    )}
                  </div>
                )}

                {/* Deductions Tab */}
                {activeTab === 'deductions' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Deductions</h3>
                    </div>
                    
                    {/* Deductions Sub-tabs */}
                    <div className="border-b border-gray-200 mb-4">
                      <nav className="-mb-px flex space-x-8">
                        <button
                          onClick={() => {
                            setDeductionsSubTab('employee')
                            if (employeeDeductions.length === 0 && !loadingEarningsDeductions) {
                              fetchEmployeeEarningsDeductions(viewingEmployee.id)
                            }
                          }}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            deductionsSubTab === 'employee'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Employee Deductions
                        </button>
                        <button
                          onClick={() => {
                            setDeductionsSubTab('government')
                            if (governmentContributions.length === 0) {
                              setGovernmentContributions(calculateGovernmentContributions(viewingEmployee))
                            }
                          }}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            deductionsSubTab === 'government'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Government Contributions
                        </button>
                      </nav>
                    </div>
                    
                    {/* Employee Deductions Sub-tab */}
                    {deductionsSubTab === 'employee' && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-md font-medium">Custom Employee Deductions</h4>
                          <RoleGuard permission="createDeductions">
                            <Button size="sm" onClick={() => setShowDeductionForm(true)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Deduction
                            </Button>
                          </RoleGuard>
                        </div>
                        
                        {loadingEarningsDeductions ? (
                          <div className="text-center py-4">
                            <div className="text-sm text-gray-500">Loading deductions...</div>
                          </div>
                        ) : employeeDeductions.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {employeeDeductions.map((deduction) => (
                                <tr key={deduction.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {deduction.type}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-500">
                                    {deduction.description || '-'}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {deduction.amount ? `₱${parseFloat(deduction.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : `${deduction.percentage}%`}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {deduction.effectiveDate ? new Date(deduction.effectiveDate).toLocaleDateString() : '-'}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {deduction.frequency?.replace('_', ' ') || 'Monthly'}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex gap-1">
                                      <RoleGuard permission="editDeductions">
                                        <Button variant="ghost" size="sm" onClick={() => handleEditDeduction(deduction)}>
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                      </RoleGuard>
                                      <RoleGuard permission="deleteDeductions">
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteDeduction(deduction.id)}>
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
                      </div>
                        ) : (
                          <div className="text-center py-8 text-sm text-gray-500">
                            No custom deductions found for this employee.
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Government Contributions Sub-tab */}
                    {deductionsSubTab === 'government' && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-md font-medium">Mandatory Government Contributions</h4>
                          <div className="text-sm text-gray-500">
                            Auto-calculated based on salary
                          </div>
                        </div>
                        
                        {governmentContributions.length > 0 ? (
                          <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {governmentContributions.map((contribution, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {contribution.type}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-500">
                                        {contribution.description}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                        ₱{contribution.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {contribution.frequency}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-sm text-gray-500">
                            No government contributions calculated.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Payslips Tab */}
                {activeTab === 'payslips' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Employee Payslips History</h3>
                    </div>
                    
                    {loadingPayslips ? (
                      <div className="text-center py-4">
                        <div className="text-sm text-gray-500">Loading payslips...</div>
                      </div>
                    ) : employeePayslips.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Period</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Pay</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {employeePayslips.map((payslip) => (
                                <tr key={payslip.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(payslip.payPeriodStart).toLocaleDateString()} - {new Date(payslip.payPeriodEnd).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {payslip.payDate ? new Date(payslip.payDate).toLocaleDateString() : 'Not set'}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                    ₱{parseFloat(payslip.grossPay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    ₱{parseFloat(payslip.totalDeductions || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-green-600">
                                    ₱{parseFloat(payslip.netPay || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      payslip.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                      payslip.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                                      payslip.status === 'CALCULATED' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {payslip.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {payslip.status !== 'DRAFT' && (
                                      <button
                                        onClick={() => setSelectedPayslip(payslip.id)}
                                        className="text-blue-600 hover:text-blue-800"
                                        title="View Payslip"
                                      >
                                        <Receipt className="w-4 h-4" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sm text-gray-500">
                        No payslips found for this employee.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                <RoleGuard permission="editEmployees">
                  <Button 
                    onClick={() => {
                      closeViewModal()
                      handleEdit(viewingEmployee)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Employee
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

      {/* Earning Form Modal */}
      {showEarningForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingEarning ? 'Edit Earning' : 'Add New Earning'}
              </h2>
              <form onSubmit={handleEarningSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Base Salary, Overtime, Bonus"
                    value={earningFormData.type}
                    onChange={(e) => setEarningFormData({ ...earningFormData, type: e.target.value })}
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
                    value={earningFormData.amount}
                    onChange={(e) => setEarningFormData({ ...earningFormData, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Optional description"
                    value={earningFormData.description}
                    onChange={(e) => setEarningFormData({ ...earningFormData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Effective Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={earningFormData.effectiveDate}
                    onChange={(e) => setEarningFormData({ ...earningFormData, effectiveDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={earningFormData.endDate}
                    onChange={(e) => setEarningFormData({ ...earningFormData, endDate: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave blank if ongoing</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Frequency</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={earningFormData.frequency}
                    onChange={(e) => setEarningFormData({ ...earningFormData, frequency: e.target.value })}
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
                    checked={earningFormData.isActive}
                    onChange={(e) => setEarningFormData({ ...earningFormData, isActive: e.target.checked })}
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
                      setShowEarningForm(false)
                      resetEarningForm()
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

      {/* Deduction Form Modal */}
      {showDeductionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingDeduction ? 'Edit Deduction' : 'Add New Deduction'}
              </h2>
              <form onSubmit={handleDeductionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., SSS, PhilHealth, Income Tax"
                    value={deductionFormData.type}
                    onChange={(e) => setDeductionFormData({ ...deductionFormData, type: e.target.value })}
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
                      value={deductionFormData.amount}
                      onChange={(e) => setDeductionFormData({ ...deductionFormData, amount: e.target.value, percentage: '' })}
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
                      value={deductionFormData.percentage}
                      onChange={(e) => setDeductionFormData({ ...deductionFormData, percentage: e.target.value, amount: '' })}
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
                    value={deductionFormData.description}
                    onChange={(e) => setDeductionFormData({ ...deductionFormData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Effective Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={deductionFormData.effectiveDate}
                    onChange={(e) => setDeductionFormData({ ...deductionFormData, effectiveDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={deductionFormData.endDate}
                    onChange={(e) => setDeductionFormData({ ...deductionFormData, endDate: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave blank if ongoing</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Frequency</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={deductionFormData.frequency}
                    onChange={(e) => setDeductionFormData({ ...deductionFormData, frequency: e.target.value })}
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
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActiveDeduction"
                    checked={deductionFormData.isActive}
                    onChange={(e) => setDeductionFormData({ ...deductionFormData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="isActiveDeduction" className="text-sm font-medium">
                    Active deduction
                  </label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit">
                    {editingDeduction ? 'Update Deduction' : 'Add Deduction'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => {
                      setShowDeductionForm(false)
                      resetDeductionForm()
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

      {/* Payslip Viewer */}
      {selectedPayslip && (
        <PayslipViewer
          payrollId={selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
        />
      )}
    </div>
  )
}