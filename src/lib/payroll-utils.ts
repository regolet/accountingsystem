export interface PayrollCalculationData {
  employee: {
    id: string
    baseSalary: number
    currency: string
    employmentType: string
  }
  attendance: {
    totalWorkDays: number
    totalWorkHours: number
    regularHours: number
    overtimeHours: number
  }
  earnings: Array<{
    type: string
    amount: number
    frequency: string
    isActive: boolean
  }>
  deductions: Array<{
    type: string
    amount?: number
    percentage?: number
    frequency: string
    isActive: boolean
  }>
}

export interface PayrollCalculationResult {
  // Work Summary
  totalWorkDays: number
  totalWorkHours: number
  regularHours: number
  overtimeHours: number
  
  // Base Pay
  baseSalary: number
  hourlyRate: number
  regularPay: number
  overtimePay: number
  
  // Earnings
  totalEarnings: number
  earningsBreakdown: Array<{
    type: string
    amount: number
    frequency: string
  }>
  
  // Deductions
  totalDeductions: number
  deductionsBreakdown: Array<{
    type: string
    amount: number
    frequency: string
  }>
  
  // Final Calculations
  grossPay: number
  taxableIncome: number
  withholdingTax: number
  netPay: number
}

export interface PayrollSettings {
  workingDaysPerMonth: number
  workingHoursPerDay: number
  overtimeMultiplier: number
  taxBrackets: Array<{
    min: number
    max: number | null
    rate: number
  }>
  sssContribution: {
    employeeRate: number
    employerRate: number
    maxSalary: number
  }
  philhealthContribution: {
    employeeRate: number
    employerRate: number
    maxSalary: number
  }
  pagibigContribution: {
    employeeRate: number
    employerRate: number
    maxSalary: number
  }
}

// Default payroll settings for Philippines
export const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  workingDaysPerMonth: 22,
  workingHoursPerDay: 8,
  overtimeMultiplier: 1.25,
  taxBrackets: [
    { min: 0, max: 250000, rate: 0.0 },
    { min: 250000, max: 400000, rate: 0.2 },
    { min: 400000, max: 800000, rate: 0.25 },
    { min: 800000, max: 2000000, rate: 0.30 },
    { min: 2000000, max: 8000000, rate: 0.32 },
    { min: 8000000, max: null, rate: 0.35 }
  ],
  sssContribution: {
    employeeRate: 0.045, // 4.5%
    employerRate: 0.095, // 9.5%
    maxSalary: 25000
  },
  philhealthContribution: {
    employeeRate: 0.0275, // 2.75%
    employerRate: 0.0275, // 2.75%
    maxSalary: 100000
  },
  pagibigContribution: {
    employeeRate: 0.02, // 2%
    employerRate: 0.02, // 2%
    maxSalary: 5000
  }
}

/**
 * Calculate payroll for an employee
 */
export function calculatePayroll(
  data: PayrollCalculationData,
  settings: PayrollSettings = DEFAULT_PAYROLL_SETTINGS
): PayrollCalculationResult {
  const { employee, attendance, earnings, deductions } = data

  // Calculate hourly rate
  const monthlyWorkingHours = settings.workingDaysPerMonth * settings.workingHoursPerDay
  const hourlyRate = employee.baseSalary / monthlyWorkingHours

  // Calculate base pay
  const regularPay = attendance.regularHours * hourlyRate
  const overtimePay = attendance.overtimeHours * hourlyRate * settings.overtimeMultiplier

  // Calculate earnings
  const earningsBreakdown: Array<{ type: string; amount: number; frequency: string }> = []
  let totalEarnings = 0

  earnings.filter(e => e.isActive).forEach(earning => {
    let monthlyAmount = earning.amount
    
    // Convert to monthly amount based on frequency
    switch (earning.frequency) {
      case 'DAILY':
        monthlyAmount = earning.amount * settings.workingDaysPerMonth
        break
      case 'WEEKLY':
        monthlyAmount = earning.amount * 4.33 // Average weeks per month
        break
      case 'BIWEEKLY':
        monthlyAmount = earning.amount * 2.17 // Average biweeks per month
        break
      case 'QUARTERLY':
        monthlyAmount = earning.amount / 3
        break
      case 'ANNUALLY':
        monthlyAmount = earning.amount / 12
        break
      case 'ONE_TIME':
        // One-time earnings are applied as-is
        break
      // MONTHLY is default
    }

    earningsBreakdown.push({
      type: earning.type,
      amount: monthlyAmount,
      frequency: earning.frequency
    })
    totalEarnings += monthlyAmount
  })

  // Calculate gross pay
  const grossPay = regularPay + overtimePay + totalEarnings

  // Calculate deductions
  const deductionsBreakdown: Array<{ type: string; amount: number; frequency: string }> = []
  let totalDeductions = 0

  deductions.filter(d => d.isActive).forEach(deduction => {
    let deductionAmount = 0
    
    if (deduction.amount) {
      deductionAmount = deduction.amount
    } else if (deduction.percentage) {
      deductionAmount = grossPay * (deduction.percentage / 100)
    }

    // Convert to monthly amount based on frequency
    switch (deduction.frequency) {
      case 'DAILY':
        deductionAmount = deductionAmount * settings.workingDaysPerMonth
        break
      case 'WEEKLY':
        deductionAmount = deductionAmount * 4.33
        break
      case 'BIWEEKLY':
        deductionAmount = deductionAmount * 2.17
        break
      case 'QUARTERLY':
        deductionAmount = deductionAmount / 3
        break
      case 'ANNUALLY':
        deductionAmount = deductionAmount / 12
        break
      // MONTHLY and ONE_TIME are used as-is
    }

    deductionsBreakdown.push({
      type: deduction.type,
      amount: deductionAmount,
      frequency: deduction.frequency
    })
    totalDeductions += deductionAmount
  })

  // Calculate automatic government contributions only if not already in employee deductions
  const existingSSS = deductionsBreakdown.find(d => d.type.toLowerCase().includes('sss'))
  const existingPhilHealth = deductionsBreakdown.find(d => d.type.toLowerCase().includes('philhealth'))
  const existingPagibig = deductionsBreakdown.find(d => d.type.toLowerCase().includes('pag-ibig'))


  // Add SSS if not already deducted
  if (!existingSSS) {
    const sssContribution = Math.min(grossPay, settings.sssContribution.maxSalary) * settings.sssContribution.employeeRate
    deductionsBreakdown.push({ type: 'SSS Contribution', amount: sssContribution, frequency: 'MONTHLY' })
    totalDeductions += sssContribution
  }

  // Add PhilHealth if not already deducted
  if (!existingPhilHealth) {
    const philhealthContribution = Math.min(grossPay, settings.philhealthContribution.maxSalary) * settings.philhealthContribution.employeeRate
    deductionsBreakdown.push({ type: 'PhilHealth Contribution', amount: philhealthContribution, frequency: 'MONTHLY' })
    totalDeductions += philhealthContribution
  }

  // Add Pag-IBIG if not already deducted
  if (!existingPagibig) {
    const pagibigContribution = Math.min(grossPay, settings.pagibigContribution.maxSalary) * settings.pagibigContribution.employeeRate
    deductionsBreakdown.push({ type: 'Pag-IBIG Contribution', amount: pagibigContribution, frequency: 'MONTHLY' })
    totalDeductions += pagibigContribution
  }

  // Calculate taxable income (gross pay minus non-taxable deductions)
  // Get actual government contributions (both from employee deductions and auto-calculated)
  const actualSSS = deductionsBreakdown.find(d => d.type.toLowerCase().includes('sss'))?.amount || 0
  const actualPhilHealth = deductionsBreakdown.find(d => d.type.toLowerCase().includes('philhealth'))?.amount || 0
  const actualPagibig = deductionsBreakdown.find(d => d.type.toLowerCase().includes('pag-ibig'))?.amount || 0
  
  const taxableIncome = grossPay - actualSSS - actualPhilHealth - actualPagibig

  // Calculate withholding tax
  const withholdingTax = calculateWithholdingTax(taxableIncome * 12, settings.taxBrackets) / 12

  // Add withholding tax to deductions
  deductionsBreakdown.push({
    type: 'Withholding Tax',
    amount: withholdingTax,
    frequency: 'MONTHLY'
  })
  totalDeductions += withholdingTax

  // Calculate net pay
  const netPay = grossPay - totalDeductions

  return {
    totalWorkDays: attendance.totalWorkDays,
    totalWorkHours: attendance.totalWorkHours,
    regularHours: attendance.regularHours,
    overtimeHours: attendance.overtimeHours,
    baseSalary: employee.baseSalary,
    hourlyRate: Math.round(hourlyRate * 100) / 100,
    regularPay: Math.round(regularPay * 100) / 100,
    overtimePay: Math.round(overtimePay * 100) / 100,
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    earningsBreakdown,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    deductionsBreakdown,
    grossPay: Math.round(grossPay * 100) / 100,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    withholdingTax: Math.round(withholdingTax * 100) / 100,
    netPay: Math.round(netPay * 100) / 100
  }
}

/**
 * Calculate annual withholding tax based on tax brackets
 */
function calculateWithholdingTax(
  annualIncome: number,
  taxBrackets: PayrollSettings['taxBrackets']
): number {
  let tax = 0
  let remainingIncome = annualIncome

  for (const bracket of taxBrackets) {
    if (remainingIncome <= 0) break

    const bracketMax = bracket.max || Infinity
    const taxableInBracket = Math.min(remainingIncome, bracketMax - bracket.min)
    
    if (taxableInBracket > 0) {
      tax += taxableInBracket * bracket.rate
      remainingIncome -= taxableInBracket
    }
  }

  return tax
}

/**
 * Get date range for a pay period
 */
export function getPayPeriodDates(
  type: 'monthly' | 'biweekly' | 'weekly',
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  const start = new Date(referenceDate)
  const end = new Date(referenceDate)

  switch (type) {
    case 'monthly':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(start.getMonth() + 1, 0) // Last day of month
      end.setHours(23, 59, 59, 999)
      break
      
    case 'biweekly':
      // Find the start of the biweekly period
      const dayOfYear = Math.floor((referenceDate.getTime() - new Date(referenceDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
      const biweekNumber = Math.floor(dayOfYear / 14)
      start.setTime(new Date(referenceDate.getFullYear(), 0, 1 + biweekNumber * 14).getTime())
      start.setHours(0, 0, 0, 0)
      end.setTime(start.getTime() + 13 * 24 * 60 * 60 * 1000) // 13 days later
      end.setHours(23, 59, 59, 999)
      break
      
    case 'weekly':
      const dayOfWeek = start.getDay()
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday
      start.setDate(diff)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6) // Sunday
      end.setHours(23, 59, 59, 999)
      break
  }

  return { start, end }
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'PHP'): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

/**
 * Calculate summary statistics for multiple payrolls
 */
export function calculatePayrollSummary(payrolls: PayrollCalculationResult[]): {
  totalEmployees: number
  totalGrossPay: number
  totalDeductions: number
  totalNetPay: number
  averageGrossPay: number
  averageNetPay: number
} {
  const totalEmployees = payrolls.length
  const totalGrossPay = payrolls.reduce((sum, p) => sum + p.grossPay, 0)
  const totalDeductions = payrolls.reduce((sum, p) => sum + p.totalDeductions, 0)
  const totalNetPay = payrolls.reduce((sum, p) => sum + p.netPay, 0)

  return {
    totalEmployees,
    totalGrossPay: Math.round(totalGrossPay * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    totalNetPay: Math.round(totalNetPay * 100) / 100,
    averageGrossPay: totalEmployees > 0 ? Math.round((totalGrossPay / totalEmployees) * 100) / 100 : 0,
    averageNetPay: totalEmployees > 0 ? Math.round((totalNetPay / totalEmployees) * 100) / 100 : 0
  }
}