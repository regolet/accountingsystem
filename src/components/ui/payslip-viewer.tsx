'use client'

import { useState, useEffect } from 'react'
import { X, Download, Mail, Building2, User, Calendar, DollarSign, Calculator } from 'lucide-react'

interface PayslipData {
  employee: {
    name: string
    employeeId: string
    department: string
    position: string
    email: string
  }
  company: {
    name: string
    address: string
    phone: string
    email: string
  } | null
  payPeriod: {
    start: string
    end: string
    payDate: string | null
  }
  earnings: {
    baseSalary: number
    regularPay: number
    overtimePay: number
    totalEarnings: number
    grossPay: number
  }
  deductions: {
    totalDeductions: number
    withholdingTax: number
    breakdown: Array<{
      type: string
      amount: number
      frequency: string
    }>
  }
  workSummary: {
    totalWorkDays: number
    totalWorkHours: number | string
    regularHours: number | string
    overtimeHours: number | string
  }
  netPay: number
  status: string
}

interface PayslipViewerProps {
  payrollId: string
  onClose: () => void
}

export function PayslipViewer({ payrollId, onClose }: PayslipViewerProps) {
  const [payslipData, setPayslipData] = useState<PayslipData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPayslipData()
  }, [payrollId])

  const fetchPayslipData = async () => {
    try {
      const response = await fetch('/api/payroll/payslip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: payrollId })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.payslips && data.payslips.length > 0) {
          setPayslipData(data.payslips[0])
        } else {
          setError('No payslip data found')
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load payslip')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numAmount)) return '₱0.00'
    return `₱${numAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatHours = (hours: number | string) => {
    const numHours = typeof hours === 'string' ? parseFloat(hours) : hours
    if (isNaN(numHours)) return '0.00'
    return numHours.toFixed(2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank')
    if (printWindow && payslipData) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payslip - ${payslipData.employee.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .company-info { text-align: center; margin-bottom: 20px; }
            .employee-info { margin-bottom: 20px; }
            .payslip-content { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .net-pay { font-size: 18px; font-weight: bold; color: #2563eb; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PAYSLIP</h1>
            <p>Pay Period: ${formatDate(payslipData.payPeriod.start)} - ${formatDate(payslipData.payPeriod.end)}</p>
          </div>
          
          <div class="company-info">
            <h2>${payslipData.company?.name || 'Company Name'}</h2>
            <p>${payslipData.company?.address || ''}</p>
            <p>${payslipData.company?.phone || ''} | ${payslipData.company?.email || ''}</p>
          </div>
          
          <div class="employee-info">
            <table>
              <tr><td><strong>Employee Name:</strong></td><td>${payslipData.employee.name}</td></tr>
              <tr><td><strong>Employee ID:</strong></td><td>${payslipData.employee.employeeId}</td></tr>
              <tr><td><strong>Department:</strong></td><td>${payslipData.employee.department}</td></tr>
              <tr><td><strong>Position:</strong></td><td>${payslipData.employee.position}</td></tr>
            </table>
          </div>
          
          <div class="payslip-content">
            <h3>Earnings</h3>
            <table>
              <tr><td>Base Salary</td><td>${formatCurrency(payslipData.earnings.baseSalary)}</td></tr>
              <tr><td>Regular Pay</td><td>${formatCurrency(payslipData.earnings.regularPay)}</td></tr>
              <tr><td>Overtime Pay</td><td>${formatCurrency(payslipData.earnings.overtimePay)}</td></tr>
              <tr><td>Additional Earnings</td><td>${formatCurrency(payslipData.earnings.totalEarnings - payslipData.earnings.baseSalary)}</td></tr>
              <tr class="total-row"><td><strong>Gross Pay</strong></td><td><strong>${formatCurrency(payslipData.earnings.grossPay)}</strong></td></tr>
            </table>
            
            <h3>Deductions</h3>
            <table>
              ${payslipData.deductions.breakdown.map(deduction => 
                `<tr><td>${deduction.type}</td><td>${formatCurrency(deduction.amount)}</td></tr>`
              ).join('')}
              <tr class="total-row"><td><strong>Total Deductions</strong></td><td><strong>${formatCurrency(payslipData.deductions.totalDeductions)}</strong></td></tr>
            </table>
            
            <h3>Work Summary</h3>
            <table>
              <tr><td>Total Work Days</td><td>${payslipData.workSummary.totalWorkDays}</td></tr>
              <tr><td>Regular Hours</td><td>${formatHours(payslipData.workSummary.regularHours)}</td></tr>
              <tr><td>Overtime Hours</td><td>${formatHours(payslipData.workSummary.overtimeHours)}</td></tr>
            </table>
            
            <div class="net-pay" style="text-align: center; margin-top: 30px; padding: 20px; border: 2px solid #2563eb;">
              <h2>NET PAY: ${formatCurrency(payslipData.netPay)}</h2>
            </div>
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center">Loading payslip...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-red-600">Error</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  if (!payslipData) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b no-print">
          <h2 className="text-xl font-bold">Payslip</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={handlePrint}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Print
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Payslip Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Company Header */}
          <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
            <div className="flex items-center justify-center mb-2">
              <Building2 className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold">{payslipData.company?.name || 'Company Name'}</h1>
            </div>
            <p className="text-gray-600">{payslipData.company?.address}</p>
            <p className="text-gray-600">{payslipData.company?.phone} | {payslipData.company?.email}</p>
            <h2 className="text-xl font-semibold mt-4 text-blue-600">PAYSLIP</h2>
            <p className="text-gray-700">
              Pay Period: {formatDate(payslipData.payPeriod.start)} - {formatDate(payslipData.payPeriod.end)}
            </p>
            {payslipData.payPeriod.payDate && (
              <p className="text-gray-700">Pay Date: {formatDate(payslipData.payPeriod.payDate)}</p>
            )}
          </div>

          {/* Employee Information */}
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <User className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Employee Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
              <div><strong>Name:</strong> {payslipData.employee.name}</div>
              <div><strong>Employee ID:</strong> {payslipData.employee.employeeId}</div>
              <div><strong>Department:</strong> {payslipData.employee.department}</div>
              <div><strong>Position:</strong> {payslipData.employee.position}</div>
            </div>
          </div>

          {/* Work Summary */}
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Work Summary</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
              <div><strong>Total Work Days:</strong> {payslipData.workSummary.totalWorkDays}</div>
              <div><strong>Total Hours:</strong> {formatHours(payslipData.workSummary.totalWorkHours)}</div>
              <div><strong>Regular Hours:</strong> {formatHours(payslipData.workSummary.regularHours)}</div>
              <div><strong>Overtime Hours:</strong> {formatHours(payslipData.workSummary.overtimeHours)}</div>
            </div>
          </div>

          {/* Earnings and Deductions */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Earnings */}
            <div>
              <div className="flex items-center mb-3">
                <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-green-600">Earnings</h3>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Base Salary:</span>
                    <span>{formatCurrency(payslipData.earnings.baseSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Regular Pay:</span>
                    <span>{formatCurrency(payslipData.earnings.regularPay)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime Pay:</span>
                    <span>{formatCurrency(payslipData.earnings.overtimePay)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Additional Earnings:</span>
                    <span>{formatCurrency(payslipData.earnings.totalEarnings - payslipData.earnings.baseSalary)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Gross Pay:</span>
                    <span>{formatCurrency(payslipData.earnings.grossPay)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <div className="flex items-center mb-3">
                <Calculator className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-red-600">Deductions</h3>
              </div>
              <div className="bg-red-50 p-4 rounded">
                <div className="space-y-2">
                  {payslipData.deductions.breakdown.map((deduction, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{deduction.type}:</span>
                      <span>{formatCurrency(deduction.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total Deductions:</span>
                    <span>{formatCurrency(payslipData.deductions.totalDeductions)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="text-center bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-blue-600 mb-2">NET PAY</h2>
            <div className="text-3xl font-bold text-blue-800">
              {formatCurrency(payslipData.netPay)}
            </div>
            <p className="text-sm text-gray-600 mt-2">Status: {payslipData.status}</p>
          </div>
        </div>
      </div>
    </div>
  )
}