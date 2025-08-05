import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateDeductionSchema = z.object({
  type: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  percentage: z.number().min(0).max(100).optional(),
  description: z.string().optional(),
  effectiveDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ONE_TIME']).optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deductionId: string }> }
) {
  try {
    const { id: employeeId, deductionId } = await params
    const body = await request.json()
    const validatedData = updateDeductionSchema.parse(body)

    // Verify deduction exists and belongs to employee
    const existingDeduction = await prisma.employeeDeduction.findFirst({
      where: {
        id: deductionId,
        employeeId: employeeId
      }
    })

    if (!existingDeduction) {
      return NextResponse.json(
        { error: 'Deduction not found' },
        { status: 404 }
      )
    }

    const deduction = await prisma.employeeDeduction.update({
      where: { id: deductionId },
      data: validatedData
    })

    return NextResponse.json(deduction)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating employee deduction:', error)
    return NextResponse.json(
      { error: 'Failed to update deduction' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deductionId: string }> }
) {
  try {
    const { id: employeeId, deductionId } = await params

    // Verify deduction exists and belongs to employee
    const existingDeduction = await prisma.employeeDeduction.findFirst({
      where: {
        id: deductionId,
        employeeId: employeeId
      }
    })

    if (!existingDeduction) {
      return NextResponse.json(
        { error: 'Deduction not found' },
        { status: 404 }
      )
    }

    await prisma.employeeDeduction.delete({
      where: { id: deductionId }
    })

    return NextResponse.json({ message: 'Deduction deleted successfully' })
  } catch (error) {
    console.error('Error deleting employee deduction:', error)
    return NextResponse.json(
      { error: 'Failed to delete deduction' },
      { status: 500 }
    )
  }
}