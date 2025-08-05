import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateEarningSchema = z.object({
  type: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  effectiveDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  frequency: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ONE_TIME']).optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; earningId: string }> }
) {
  try {
    const { id: employeeId, earningId } = await params
    const body = await request.json()
    const validatedData = updateEarningSchema.parse(body)

    // Verify earning exists and belongs to employee
    const existingEarning = await prisma.employeeEarning.findFirst({
      where: {
        id: earningId,
        employeeId: employeeId
      }
    })

    if (!existingEarning) {
      return NextResponse.json(
        { error: 'Earning not found' },
        { status: 404 }
      )
    }

    const earning = await prisma.employeeEarning.update({
      where: { id: earningId },
      data: validatedData
    })

    return NextResponse.json(earning)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating employee earning:', error)
    return NextResponse.json(
      { error: 'Failed to update earning' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; earningId: string }> }
) {
  try {
    const { id: employeeId, earningId } = await params

    // Verify earning exists and belongs to employee
    const existingEarning = await prisma.employeeEarning.findFirst({
      where: {
        id: earningId,
        employeeId: employeeId
      }
    })

    if (!existingEarning) {
      return NextResponse.json(
        { error: 'Earning not found' },
        { status: 404 }
      )
    }

    await prisma.employeeEarning.delete({
      where: { id: earningId }
    })

    return NextResponse.json({ message: 'Earning deleted successfully' })
  } catch (error) {
    console.error('Error deleting employee earning:', error)
    return NextResponse.json(
      { error: 'Failed to delete earning' },
      { status: 500 }
    )
  }
}