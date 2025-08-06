import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EmployeeStatus } from '@prisma/client'
import { calculatePayroll, PayrollCalculationData } from '@/lib/payroll-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      batchName,
      payPeriodStart,
      payPeriodEnd,
      payDate,
      employeeIds, // Optional: specific employees, or all if not provided
      departments, // Optional: filter by departments
    } = body

    if (!batchName || !payPeriodStart || !payPeriodEnd) {
      return NextResponse.json(
        { error: 'Batch name, pay period start, and pay period end are required' },
        { status: 400 }
      )
    }

    const periodStart = new Date(payPeriodStart)
    const periodEnd = new Date(payPeriodEnd)

    // Create payroll batch record
    const batch = await prisma.payrollBatch.create({
      data: {
        batchName,
        payPeriodStart: periodStart,
        payPeriodEnd: periodEnd,
        payDate: payDate ? new Date(payDate) : null,
        status: 'PROCESSING',
      },
    })

    // Get employees to process
    const employeeFilter: {
      status: EmployeeStatus;
      id?: { in: string[] };
      department?: { in: string[] };
    } = {
      status: EmployeeStatus.ACTIVE,
    }

    if (employeeIds && employeeIds.length > 0) {
      employeeFilter.id = { in: employeeIds }
    }

    if (departments && departments.length > 0) {
      employeeFilter.department = { in: departments }
    }

    const employees = await prisma.employee.findMany({
      where: employeeFilter,
    })

    if (employees.length === 0) {
      await prisma.payrollBatch.update({
        where: { id: batch.id },
        data: { status: 'CANCELLED' },
      })
      return NextResponse.json(
        { error: 'No employees found matching criteria' },
        { status: 400 }
      )
    }

    const payrollResults = []
    let totalGrossPay = 0
    let totalDeductions = 0
    let totalNetPay = 0

    // Process each employee
    for (const employee of employees) {
      try {
        // Check if payroll already exists for this period
        const existingPayroll = await prisma.payroll.findUnique({
          where: {
            employeeId_payPeriodStart_payPeriodEnd: {
              employeeId: employee.id,
              payPeriodStart: periodStart,
              payPeriodEnd: periodEnd,
            },
          },
        })

        if (existingPayroll) {
          payrollResults.push({
            employeeId: employee.id,
            status: 'SKIPPED',
            reason: 'Payroll already exists',
          })
          continue
        }

        // Get attendance data
        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            employeeId: employee.id,
            date: {
              gte: periodStart,
              lte: periodEnd,
            },
          },
        })

        // Calculate attendance summary
        const totalWorkDays = attendanceRecords.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length
        const totalWorkHours = attendanceRecords.reduce((sum, a) => sum + parseFloat(a.totalHours?.toString() || '0'), 0)
        const regularHours = attendanceRecords.reduce((sum, a) => sum + parseFloat(a.regularHours?.toString() || '0'), 0)
        const overtimeHours = attendanceRecords.reduce((sum, a) => sum + parseFloat(a.overtimeHours?.toString() || '0'), 0)

        // Get employee earnings
        const earnings = await prisma.employeeEarning.findMany({
          where: {
            employeeId: employee.id,
            isActive: true,
            OR: [
              { effectiveDate: null },
              { effectiveDate: { lte: periodEnd } },
            ],
          },
        })

        // Get employee deductions
        const deductions = await prisma.employeeDeduction.findMany({
          where: {
            employeeId: employee.id,
            isActive: true,
            OR: [
              { effectiveDate: null },
              { effectiveDate: { lte: periodEnd } },
            ],
          },
        })

        // Prepare calculation data
        const calculationData: PayrollCalculationData = {
          employee: {
            id: employee.id,
            baseSalary: parseFloat(employee.baseSalary.toString()),
            currency: employee.currency,
            employmentType: employee.employmentType,
          },
          attendance: {
            totalWorkDays,
            totalWorkHours,
            regularHours,
            overtimeHours,
          },
          earnings: earnings.map(e => ({
            type: e.type,
            amount: parseFloat(e.amount.toString()),
            frequency: e.frequency,
            isActive: e.isActive,
          })),
          deductions: deductions.map(d => ({
            type: d.type,
            amount: d.amount ? parseFloat(d.amount.toString()) : undefined,
            percentage: d.percentage ? parseFloat(d.percentage.toString()) : undefined,
            frequency: d.frequency,
            isActive: d.isActive,
          })),
        }

        // Calculate payroll
        const calculationResult = calculatePayroll(calculationData)

        // Create payroll record
        const payroll = await prisma.payroll.create({
          data: {
            employeeId: employee.id,
            payPeriodStart: periodStart,
            payPeriodEnd: periodEnd,
            payDate: payDate ? new Date(payDate) : null,
            status: 'CALCULATED',
            baseSalary: employee.baseSalary,
            totalWorkDays: calculationResult.totalWorkDays,
            totalWorkHours: calculationResult.totalWorkHours,
            regularHours: calculationResult.regularHours,
            overtimeHours: calculationResult.overtimeHours,
            hourlyRate: calculationResult.hourlyRate,
            regularPay: calculationResult.regularPay,
            overtimePay: calculationResult.overtimePay,
            totalEarnings: calculationResult.totalEarnings,
            totalDeductions: calculationResult.totalDeductions,
            grossPay: calculationResult.grossPay,
            netPay: calculationResult.netPay,
            taxableIncome: calculationResult.taxableIncome,
            withholdingTax: calculationResult.withholdingTax,
            earningsData: calculationResult.earningsBreakdown,
            deductionsData: calculationResult.deductionsBreakdown,
            processedAt: new Date(),
          },
        })

        totalGrossPay += calculationResult.grossPay
        totalDeductions += calculationResult.totalDeductions
        totalNetPay += calculationResult.netPay

        payrollResults.push({
          employeeId: employee.id,
          payrollId: payroll.id,
          status: 'SUCCESS',
          grossPay: calculationResult.grossPay,
          netPay: calculationResult.netPay,
        })
      } catch (error) {
        console.error(`Error processing payroll for employee ${employee.id}:`, error)
        payrollResults.push({
          employeeId: employee.id,
          status: 'ERROR',
          reason: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Update batch with summary
    const updatedBatch = await prisma.payrollBatch.update({
      where: { id: batch.id },
      data: {
        status: 'CALCULATED',
        totalEmployees: payrollResults.filter(r => r.status === 'SUCCESS').length,
        totalGrossPay,
        totalDeductions,
        totalNetPay,
        processedAt: new Date(),
      },
    })

    return NextResponse.json({
      batch: updatedBatch,
      results: payrollResults,
      summary: {
        totalProcessed: employees.length,
        successful: payrollResults.filter(r => r.status === 'SUCCESS').length,
        skipped: payrollResults.filter(r => r.status === 'SKIPPED').length,
        errors: payrollResults.filter(r => r.status === 'ERROR').length,
      },
    })
  } catch (error) {
    console.error('Error processing payroll batch:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not available, returning empty payroll batches list')
      return NextResponse.json({
        batches: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const [batches, total] = await Promise.all([
      prisma.payrollBatch.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payrollBatch.count(),
    ])

    return NextResponse.json({
      batches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching payroll batches:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'No stack',
      elapsed: Date.now() - startTime
    })
    
    // Return empty array structure to prevent frontend crashes
    return NextResponse.json({
      batches: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },
      error: 'Failed to fetch payroll batches'
    })
  }
}