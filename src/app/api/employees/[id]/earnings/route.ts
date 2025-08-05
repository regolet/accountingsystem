import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createEarningSchema = z.object({
  type: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().optional(),
  effectiveDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  frequency: z.enum(['HOURLY', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ONE_TIME']).default('MONTHLY'),
  isActive: z.boolean().default(true),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: employeeId } = await params

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    const earnings = await prisma.employeeEarning.findMany({
      where: { employeeId },
      orderBy: { effectiveDate: 'desc' }
    })

    return NextResponse.json(earnings)
  } catch (error) {
    console.error('Error fetching employee earnings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: employeeId } = await params
    const body = await request.json()
    const validatedData = createEarningSchema.parse(body)

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    const earning = await prisma.employeeEarning.create({
      data: {
        ...validatedData,
        employeeId,
      }
    })

    return NextResponse.json(earning, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating employee earning:', error)
    return NextResponse.json(
      { error: 'Failed to create earning' },
      { status: 500 }
    )
  }
}