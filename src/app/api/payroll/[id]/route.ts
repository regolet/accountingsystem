import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma, PayrollStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payroll = await prisma.payroll.findUnique({
      where: { id },
    
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
            baseSalary: true,
            currency: true,
            employmentType: true,
          },
        },
      },
    })

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 })
    }

    return NextResponse.json(payroll)
  } catch (error) {
    console.error('Error fetching payroll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      payDate,
      status,
      notes,
      // Allow updating calculated values
      totalWorkDays,
      totalWorkHours,
      regularHours,
      overtimeHours,
      hourlyRate,
      regularPay,
      overtimePay,
      totalEarnings,
      totalDeductions,
      grossPay,
      netPay,
      taxableIncome,
      withholdingTax,
      earningsData,
      deductionsData,
      processedBy,
    } = body

    // Check if payroll record exists
    const existingPayroll = await prisma.payroll.findUnique({
      where: { id },
    })

    if (!existingPayroll) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 })
    }

    const updateData: {
      payDate?: Date | null;
      status?: PayrollStatus;
      notes?: string;
      totalWorkDays?: number;
      totalWorkHours?: number;
      regularHours?: number;
      overtimeHours?: number;
      hourlyRate?: number;
      regularPay?: number;
      overtimePay?: number;
      totalEarnings?: number;
      totalDeductions?: number;
      grossPay?: number;
      netPay?: number;
      taxableIncome?: number;
      withholdingTax?: number;
      earningsData?: Prisma.InputJsonValue;
      deductionsData?: Prisma.InputJsonValue;
      processedBy?: string;
      processedAt?: Date;
    } = {}

    // Basic fields
    if (payDate !== undefined) updateData.payDate = payDate ? new Date(payDate) : null
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    // Calculation fields
    if (totalWorkDays !== undefined) updateData.totalWorkDays = totalWorkDays
    if (totalWorkHours !== undefined) updateData.totalWorkHours = totalWorkHours
    if (regularHours !== undefined) updateData.regularHours = regularHours
    if (overtimeHours !== undefined) updateData.overtimeHours = overtimeHours
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate
    if (regularPay !== undefined) updateData.regularPay = regularPay
    if (overtimePay !== undefined) updateData.overtimePay = overtimePay
    if (totalEarnings !== undefined) updateData.totalEarnings = totalEarnings
    if (totalDeductions !== undefined) updateData.totalDeductions = totalDeductions
    if (grossPay !== undefined) updateData.grossPay = grossPay
    if (netPay !== undefined) updateData.netPay = netPay
    if (taxableIncome !== undefined) updateData.taxableIncome = taxableIncome
    if (withholdingTax !== undefined) updateData.withholdingTax = withholdingTax
    if (earningsData !== undefined) updateData.earningsData = earningsData
    if (deductionsData !== undefined) updateData.deductionsData = deductionsData

    // Processing information
    if (processedBy !== undefined) updateData.processedBy = processedBy
    if (status === 'CALCULATED' || status === 'APPROVED') {
      updateData.processedAt = new Date()
    }

    const updatedPayroll = await prisma.payroll.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updatedPayroll)
  } catch (error) {
    console.error('Error updating payroll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Check if payroll record exists
    const existingPayroll = await prisma.payroll.findUnique({
      where: { id },
    })

    if (!existingPayroll) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 })
    }

    // Don't allow deletion of paid payrolls
    if (existingPayroll.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot delete paid payroll records' },
        { status: 400 }
      )
    }

    await prisma.payroll.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Payroll record deleted successfully' })
  } catch (error) {
    console.error('Error deleting payroll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}