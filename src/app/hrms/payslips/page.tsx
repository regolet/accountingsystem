'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Calendar, Receipt, Download, Users, Eye } from 'lucide-react'
import { RoleGuard } from '@/components/ui/role-guard'
import { PayslipViewer } from '@/components/ui/payslip-viewer'

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  department: string
  position: string
}

interface PayrollRecord {
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
  grossPay: number
  totalDeductions: number
  netPay: number
  createdAt: string
}

export default function PayslipsHistoryPage() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedPayroll, setSelectedPayroll] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchPayrollRecords()
    fetchEmployees()
  }, [currentPage, selectedEmployee, selectedStatus, dateRange])

  const fetchPayrollRecords = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })

      if (selectedEmployee) {
        params.append('employeeId', selectedEmployee)
      }
      if (selectedStatus) {
        params.append('status', selectedStatus)
      }
      if (dateRange.startDate) {
        params.append('startDate', dateRange.startDate)
      }
      if (dateRange.endDate) {
        params.append('endDate', dateRange.endDate)
      }

      const response = await fetch(`/api/payroll?${params}`)
      const data = await response.json()

      if (response.ok) {
        setPayrollRecords(data.payrolls || [])
        setTotalPages(data.pagination?.pages || 1)
      }
    } catch (error) {
      console.error('Error fetching payroll records:', error)
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

  const handleBulkDownload = async () => {
    if (payrollRecords.length === 0) return

    try {
      const response = await fetch('/api/payroll/payslip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds: payrollRecords.map(record => record.id)
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Bulk payslips:', data.payslips)
        alert(`Generated ${data.payslips.length} payslips for download`)
      } else {
        alert('Failed to generate bulk payslips')
      }
    } catch (error) {
      alert('Error generating bulk payslips')
    }
  }

  const filteredRecords = payrollRecords.filter(record => {
    const matchesSearch = searchTerm === '' ||
      record.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <RoleGuard permission="viewPayroll">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payslips History</h1>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDownload}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              disabled={filteredRecords.length === 0}
            >
              <Download className="w-4 h-4" />
              Bulk Download
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
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

          <div className="flex items-center gap-2">
            <Users className="text-gray-400 w-4 h-4" />
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-4 h-4" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="CALCULATED">Calculated</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Start Date"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="End Date"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Pay</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.employee.firstName} {record.employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.employee.employeeId} • {record.employee.department}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.payPeriodStart)} - {formatDate(record.payPeriodEnd)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.payDate ? formatDate(record.payDate) : 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(record.grossPay)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(record.totalDeductions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(record.netPay)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedPayroll(record.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Payslip"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            // Individual download
                            fetch('/api/payroll/payslip', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ employeeId: record.id })
                            }).then(() => {
                              alert('Payslip generated for download')
                            })
                          }}
                          className="text-green-600 hover:text-green-800"
                          title="Download Payslip"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No payslips found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
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

      {selectedPayroll && (
        <PayslipViewer
          payrollId={selectedPayroll}
          onClose={() => setSelectedPayroll(null)}
        />
      )}
    </RoleGuard>
  )
}