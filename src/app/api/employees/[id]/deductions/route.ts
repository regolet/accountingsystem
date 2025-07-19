import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const baseDeductionSchema = z.object({
  type: z.string().min(1),
  amount: z.number().positive().optional(),
  percentage: z.number().min(0).max(100).optional(),
  description: z.string().optional(),
  effectiveDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ONE_TIME']).default('MONTHLY'),
  isActive: z.boolean().default(true),
})

const createDeductionSchema = baseDeductionSchema.refine((data) => data.amount || data.percentage, {
  message: "Either amount or percentage must be provided"
})

const updateDeductionSchema = baseDeductionSchema

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = params.id

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

    const deductions = await prisma.employeeDeduction.findMany({
      where: { employeeId },
      orderBy: { effectiveDate: 'desc' }
    })

    return NextResponse.json(deductions)
  } catch (error) {
    console.error('Error fetching employee deductions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deductions' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = params.id
    const body = await request.json()
    const validatedData = createDeductionSchema.parse(body)

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

    const deduction = await prisma.employeeDeduction.create({
      data: {
        ...validatedData,
        employeeId,
      }
    })

    return NextResponse.json(deduction, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating employee deduction:', error)
    return NextResponse.json(
      { error: 'Failed to create deduction' },
      { status: 500 }
    )
  }
}