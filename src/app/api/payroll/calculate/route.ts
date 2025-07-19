import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculatePayroll, PayrollCalculationData } from '@/lib/payroll-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payrollId, employeeId, payPeriodStart, payPeriodEnd } = body

    let payroll = null

    // If payrollId is provided, update existing payroll
    if (payrollId) {
      payroll = await prisma.payroll.findUnique({
        where: { id: payrollId },
        include: { employee: true },
      })

      if (!payroll) {
        return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 })
      }
    } else if (employeeId && payPeriodStart && payPeriodEnd) {
      // Find or create payroll record
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      })

      if (!employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }

      payroll = await prisma.payroll.upsert({
        where: {
          employeeId_payPeriodStart_payPeriodEnd: {
            employeeId,
            payPeriodStart: new Date(payPeriodStart),
            payPeriodEnd: new Date(payPeriodEnd),
          },
        },
        update: {},
        create: {
          employeeId,
          payPeriodStart: new Date(payPeriodStart),
          payPeriodEnd: new Date(payPeriodEnd),
          baseSalary: employee.baseSalary,
          status: 'DRAFT',
        },
        include: { employee: true },
      })
    } else {
      return NextResponse.json(
        { error: 'Either payrollId or (employeeId, payPeriodStart, payPeriodEnd) required' },
        { status: 400 }
      )
    }

    // Get attendance data for the pay period
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employeeId: payroll.employeeId,
        date: {
          gte: payroll.payPeriodStart,
          lte: payroll.payPeriodEnd,
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
        employeeId: payroll.employeeId,
        isActive: true,
        OR: [
          { effectiveDate: null },
          { effectiveDate: { lte: payroll.payPeriodEnd } },
        ],
      },
    })

    // Get employee deductions
    const deductions = await prisma.employeeDeduction.findMany({
      where: {
        employeeId: payroll.employeeId,
        isActive: true,
        OR: [
          { effectiveDate: null },
          { effectiveDate: { lte: payroll.payPeriodEnd } },
        ],
      },
    })

    // Prepare calculation data
    const calculationData: PayrollCalculationData = {
      employee: {
        id: payroll.employee.id,
        baseSalary: parseFloat(payroll.employee.baseSalary.toString()),
        currency: payroll.employee.currency,
        employmentType: payroll.employee.employmentType,
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

    // Update payroll record with calculated values
    const updatedPayroll = await prisma.payroll.update({
      where: { id: payroll.id },
      data: {
        status: 'CALCULATED',
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
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
          },
        },
      },
    })

    return NextResponse.json({
      payroll: updatedPayroll,
      calculationDetails: calculationResult,
    })
  } catch (error) {
    console.error('Error calculating payroll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}