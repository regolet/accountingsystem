import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { batchId, employeeId } = body

    console.log('Payslip generation request:', { batchId, employeeId })

    if (!batchId && !employeeId) {
      return NextResponse.json(
        { error: 'Either batchId or employeeId is required' },
        { status: 400 }
      )
    }

    let payrolls = []

    if (batchId) {
      // Get batch details
      const batch = await prisma.payrollBatch.findUnique({
        where: { id: batchId }
      })

      if (!batch) {
        return NextResponse.json({ error: 'Payroll batch not found' }, { status: 404 })
      }

      // Get all payrolls for this batch
      payrolls = await prisma.payroll.findMany({
        where: {
          payPeriodStart: batch.payPeriodStart,
          payPeriodEnd: batch.payPeriodEnd,
          status: { in: ['CALCULATED', 'APPROVED', 'PAID'] }
        },
        include: {
          employee: true
        }
      })

      console.log(`Found ${payrolls.length} payrolls for batch ${batchId}`)
    } else {
      // Get specific employee payroll
      const payroll = await prisma.payroll.findUnique({
        where: { id: employeeId },
        include: {
          employee: true
        }
      })

      if (!payroll) {
        return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 })
      }

      payrolls = [payroll]
    }

    // Get company information from settings
    const settings = await prisma.settings.findFirst()
    const companyInfo = settings ? {
      name: settings.companyName || 'Company Name',
      address: settings.companyAddress || '',
      phone: settings.companyPhone || '',
      email: settings.companyEmail || ''
    } : null

    // Format payslip data
    const payslips = payrolls.map(payroll => ({
      employee: {
        name: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
        employeeId: payroll.employee.employeeId,
        department: payroll.employee.department,
        position: payroll.employee.position,
        email: payroll.employee.email
      },
      company: companyInfo,
      payPeriod: {
        start: payroll.payPeriodStart,
        end: payroll.payPeriodEnd,
        payDate: payroll.payDate
      },
      earnings: {
        baseSalary: payroll.baseSalary,
        regularPay: payroll.regularPay,
        overtimePay: payroll.overtimePay,
        totalEarnings: payroll.totalEarnings,
        grossPay: payroll.grossPay
      },
      deductions: {
        totalDeductions: payroll.totalDeductions,
        withholdingTax: payroll.withholdingTax,
        breakdown: payroll.deductionsData || []
      },
      workSummary: {
        totalWorkDays: payroll.totalWorkDays,
        totalWorkHours: payroll.totalWorkHours,
        regularHours: payroll.regularHours,
        overtimeHours: payroll.overtimeHours
      },
      netPay: payroll.netPay,
      status: payroll.status
    }))

    console.log(`Generated ${payslips.length} payslips successfully`)
    return NextResponse.json({ payslips })
  } catch (error) {
    console.error('Error generating payslips:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 })
  }
}