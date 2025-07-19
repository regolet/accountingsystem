'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Calculator, Eye, Trash2, FileText, Users, Edit, Receipt } from 'lucide-react'
import { RoleGuard } from '@/components/ui/role-guard'
import { PayslipViewer } from '@/components/ui/payslip-viewer'

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  department: string
  position: string
  baseSalary: number
  status: string
}

interface PayrollBatch {
  id: string
  batchName: string
  payPeriodStart: string
  payPeriodEnd: string
  payDate: string | null
  status: 'DRAFT' | 'PROCESSING' | 'CALCULATED' | 'APPROVED' | 'PAID'
  totalEmployees: number
  totalGrossPay: number
  totalDeductions: number
  totalNetPay: number
  createdAt: string
  processedAt: string | null
}

interface Payroll {
  id: string
  employeeId: string
  employee: Employee
  payPeriodStart: string
  payPeriodEnd: string
  payDate: string | null
  status: 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID'
  baseSalary: number
  totalWorkDays: number
  totalWorkHours: number
  regularHours: number
  overtimeHours: number
  hourlyRate: number
  regularPay: number
  overtimePay: number
  totalEarnings: number
  totalDeductions: number
  grossPay: number
  netPay: number
  taxableIncome: number
  withholdingTax: number
}

export default function PayrollPage() {
  const [batches, setBatches] = useState<PayrollBatch[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<PayrollBatch | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchBatches()
    fetchEmployees()
  }, [currentPage, statusFilter])

  const fetchBatches = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })
      
      if (statusFilter) {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/payroll/batch?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setBatches(data.batches || [])
        setTotalPages(data.pagination?.pages || 1)
      } else {
        showMessage('error', data.error || 'Failed to fetch payroll batches')
      }
    } catch (error) {
      showMessage('error', 'Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees?status=ACTIVE')
      const data = await response.json()
      
      if (response.ok) {
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '₱0.00'
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH')
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PROCESSING: 'bg-yellow-100 text-yellow-800',
      CALCULATED: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      PAID: 'bg-purple-100 text-purple-800'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  const handleProcessBatch = async (batchId: string) => {
    if (!confirm('Process this payroll batch? This will calculate payroll for all employees in this batch.')) return
    
    try {
      const batch = batches.find(b => b.id === batchId)
      if (!batch) return

      // Re-process the batch with the same parameters
      const response = await fetch('/api/payroll/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchName: batch.batchName,
          payPeriodStart: batch.payPeriodStart,
          payPeriodEnd: batch.payPeriodEnd,
          payDate: batch.payDate
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        showMessage('success', `Batch processed successfully. ${data.summary.successful} employees calculated.`)
        fetchBatches()
      } else {
        showMessage('error', data.error || 'Failed to process batch')
      }
    } catch (error) {
      showMessage('error', 'Network error occurred')
    }
  }

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this payroll batch? This will delete all associated payroll records.')) return
    
    try {
      const response = await fetch(`/api/payroll/batch/${batchId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showMessage('success', 'Payroll batch deleted successfully')
        fetchBatches()
      } else {
        const data = await response.json()
        showMessage('error', data.error || 'Failed to delete payroll batch')
      }
    } catch (error) {
      showMessage('error', 'Network error occurred')
    }
  }

  const handleGeneratePayslips = async (batchId: string) => {
    try {
      const response = await fetch('/api/payroll/payslip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId })
      })

      if (response.ok) {
        const data = await response.json()
        // For now, just show success message
        // In production, you would generate PDF payslips here
        showMessage('success', `Generated ${data.payslips.length} payslips successfully`)
        
        // Optional: Open payslips in new window or download
        console.log('Payslips data:', data.payslips)
      } else {
        const data = await response.json()
        showMessage('error', data.error || 'Failed to generate payslips')
      }
    } catch (error) {
      showMessage('error', 'Network error occurred')
    }
  }

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = searchTerm === '' || 
      batch.batchName.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <RoleGuard permission="viewPayroll">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Payroll Period
          </button>
        </div>

        {message.text && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search payroll periods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PROCESSING">Processing</option>
              <option value="CALCULATED">Calculated</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payroll Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employees</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Gross</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Deductions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Net</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{batch.batchName}</div>
                      <div className="text-sm text-gray-500">
                        Created: {formatDate(batch.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(batch.payPeriodStart)} - {formatDate(batch.payPeriodEnd)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">{batch.totalEmployees || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(batch.totalGrossPay)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(batch.totalDeductions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(batch.totalNetPay)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(batch.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleProcessBatch(batch.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Process/Calculate"
                        >
                          <Calculator className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBatch(batch)
                            setShowDetailsModal(true)
                          }}
                          className="text-green-600 hover:text-green-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBatch(batch)
                            setShowEditModal(true)
                          }}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {['CALCULATED', 'APPROVED', 'PAID'].includes(batch.status) && (
                          <button
                            onClick={() => handleGeneratePayslips(batch.id)}
                            className="text-purple-600 hover:text-purple-800"
                            title="Generate Payslips"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteBatch(batch.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                          disabled={batch.status === 'PAID'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBatches.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No payroll periods found</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-md ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <CreatePayrollPeriodModal
          employees={employees}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchBatches()
            showMessage('success', 'Payroll period created successfully')
          }}
        />
      )}

      {showEditModal && selectedBatch && (
        <EditPayrollPeriodModal
          batch={selectedBatch}
          onClose={() => {
            setShowEditModal(false)
            setSelectedBatch(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setSelectedBatch(null)
            fetchBatches()
            showMessage('success', 'Payroll period updated successfully')
          }}
        />
      )}

      {showDetailsModal && selectedBatch && (
        <PayrollDetailsModal
          batch={selectedBatch}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedBatch(null)
          }}
          onUpdate={() => fetchBatches()}
        />
      )}
    </RoleGuard>
  )
}

function CreatePayrollPeriodModal({ employees, onClose, onSuccess }: {
  employees: Employee[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    batchName: '',
    payPeriodStart: '',
    payPeriodEnd: '',
    payDate: '',
    selectedEmployees: [] as string[],
    selectedDepartments: [] as string[],
    selectAll: false
  })
  const [processing, setProcessing] = useState(false)

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    try {
      let employeeIds = formData.selectedEmployees

      // If select all or departments selected, determine employee IDs
      if (formData.selectAll) {
        employeeIds = [] // Empty array means all employees
      } else if (formData.selectedDepartments.length > 0) {
        employeeIds = [] // Will be filtered by departments in API
      }

      const response = await fetch('/api/payroll/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchName: formData.batchName,
          payPeriodStart: formData.payPeriodStart,
          payPeriodEnd: formData.payPeriodEnd,
          payDate: formData.payDate || null,
          employeeIds: employeeIds.length > 0 ? employeeIds : undefined,
          departments: formData.selectedDepartments.length > 0 ? formData.selectedDepartments : undefined
        })
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create payroll period')
      }
    } catch (error) {
      alert('Network error occurred')
    } finally {
      setProcessing(false)
    }
  }

  const toggleEmployee = (employeeId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedEmployees: prev.selectedEmployees.includes(employeeId)
        ? prev.selectedEmployees.filter(id => id !== employeeId)
        : [...prev.selectedEmployees, employeeId],
      selectAll: false
    }))
  }

  const toggleDepartment = (dept: string) => {
    setFormData(prev => {
      const newDepts = prev.selectedDepartments.includes(dept)
        ? prev.selectedDepartments.filter(d => d !== dept)
        : [...prev.selectedDepartments, dept]
      
      // Auto-select employees from selected departments
      const deptEmployeeIds = employees
        .filter(e => newDepts.includes(e.department))
        .map(e => e.id)
      
      return {
        ...prev,
        selectedDepartments: newDepts,
        selectedEmployees: deptEmployeeIds,
        selectAll: false
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create Payroll Period</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period Name</label>
            <input
              type="text"
              value={formData.batchName}
              onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              placeholder="e.g., January 2024 Payroll"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period Start</label>
              <input
                type="date"
                value={formData.payPeriodStart}
                onChange={(e) => setFormData({ ...formData, payPeriodStart: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period End</label>
              <input
                type="date"
                value={formData.payPeriodEnd}
                onChange={(e) => setFormData({ ...formData, payPeriodEnd: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pay Date (Optional)</label>
            <input
              type="date"
              value={formData.payDate}
              onChange={(e) => setFormData({ ...formData, payDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employee Selection</label>
            
            <div className="mb-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.selectAll}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    selectAll: e.target.checked,
                    selectedEmployees: [],
                    selectedDepartments: []
                  })}
                  className="mr-2"
                />
                <span className="font-medium">Select All Active Employees</span>
              </label>
            </div>

            {!formData.selectAll && (
              <>
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">Select by Department:</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                    {departments.map((dept) => (
                      <label key={dept} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.selectedDepartments.includes(dept)}
                          onChange={() => toggleDepartment(dept)}
                          className="mr-2"
                        />
                        {dept} ({employees.filter(e => e.department === dept).length} employees)
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Or select individual employees:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                    {employees.map((emp) => (
                      <label key={emp.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.selectedEmployees.includes(emp.id)}
                          onChange={() => toggleEmployee(emp.id)}
                          className="mr-2"
                        />
                        {emp.firstName} {emp.lastName} - {emp.employeeId} ({emp.department})
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={processing || (!formData.selectAll && formData.selectedEmployees.length === 0 && formData.selectedDepartments.length === 0)}
            >
              {processing ? 'Creating...' : 'Create & Process'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PayrollDetailsModal({ batch, onClose }: {
  batch: PayrollBatch
  onClose: () => void
}) {
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPayrollForPayslip, setSelectedPayrollForPayslip] = useState<string | null>(null)

  useEffect(() => {
    fetchPayrolls()
  }, [batch])

  const fetchPayrolls = async () => {
    try {
      const response = await fetch(`/api/payroll?startDate=${batch.payPeriodStart}&endDate=${batch.payPeriodEnd}&limit=100`)
      const data = await response.json()
      
      if (response.ok) {
        setPayrolls(data.payrolls || [])
      }
    } catch (error) {
      console.error('Error fetching payroll details:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '₱0.00'
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatHours = (hours: number | string | null) => {
    if (!hours) return '-'
    const numHours = typeof hours === 'string' ? parseFloat(hours) : hours
    if (isNaN(numHours)) return '-'
    return `${numHours.toFixed(2)}h`
  }

  const filteredPayrolls = payrolls.filter(payroll => {
    const matchesSearch = searchTerm === '' || 
      payroll.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">{batch.batchName} - Employee Details</h2>
            <p className="text-sm text-gray-600">
              Period: {new Date(batch.payPeriodStart).toLocaleDateString()} - {new Date(batch.payPeriodEnd).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">Loading...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Pay</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayrolls.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payroll.employee.firstName} {payroll.employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payroll.employee.employeeId} • {payroll.employee.department}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payroll.totalWorkDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>Regular: {formatHours(payroll.regularHours)}</div>
                        <div className="text-xs text-gray-500">OT: {formatHours(payroll.overtimeHours)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payroll.baseSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payroll.totalEarnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(payroll.grossPay)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{formatCurrency(payroll.totalDeductions)}</div>
                        <div className="text-xs text-gray-500">Tax: {formatCurrency(payroll.withholdingTax)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(payroll.netPay)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => setSelectedPayrollForPayslip(payroll.id)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Payslip"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Employees</p>
              <p className="text-lg font-semibold">{filteredPayrolls.length}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Gross Pay</p>
              <p className="text-lg font-semibold">{formatCurrency(batch.totalGrossPay)}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Deductions</p>
              <p className="text-lg font-semibold text-red-600">{formatCurrency(batch.totalDeductions)}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Net Pay</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(batch.totalNetPay)}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>

      {selectedPayrollForPayslip && (
        <PayslipViewer
          payrollId={selectedPayrollForPayslip}
          onClose={() => setSelectedPayrollForPayslip(null)}
        />
      )}
    </div>
  )
}

function EditPayrollPeriodModal({ batch, onClose, onSuccess }: {
  batch: PayrollBatch
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    batchName: batch.batchName,
    payDate: batch.payDate ? batch.payDate.split('T')[0] : '',
    status: batch.status
  })
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    try {
      const response = await fetch(`/api/payroll/batch/${batch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchName: formData.batchName,
          payDate: formData.payDate || null,
          status: formData.status
        })
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update payroll period')
      }
    } catch (error) {
      alert('Network error occurred')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Payroll Period</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period Name</label>
            <input
              type="text"
              value={formData.batchName}
              onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period</label>
            <p className="text-sm text-gray-600">
              {new Date(batch.payPeriodStart).toLocaleDateString()} - {new Date(batch.payPeriodEnd).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Pay period dates cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pay Date</label>
            <input
              type="date"
              value={formData.payDate}
              onChange={(e) => setFormData({ ...formData, payDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'DRAFT' | 'PROCESSING' | 'CALCULATED' | 'APPROVED' | 'COMPLETED' | 'CANCELLED' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="DRAFT">Draft</option>
              <option value="PROCESSING">Processing</option>
              <option value="CALCULATED">Calculated</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-600">Total Employees</p>
                <p className="font-medium">{batch.totalEmployees || 0}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Net Pay</p>
                <p className="font-medium">₱{batch.totalNetPay?.toLocaleString('en-PH', { minimumFractionDigits: 2 }) || '0.00'}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={processing}
            >
              {processing ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}