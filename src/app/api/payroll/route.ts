import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    
    if (employeeId) {
      where.employeeId = employeeId
    }
    
    if (status) {
      where.status = status
    }
    
    if (startDate && endDate) {
      where.payPeriodStart = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else if (startDate) {
      where.payPeriodStart = {
        gte: new Date(startDate),
      }
    } else if (endDate) {
      where.payPeriodStart = {
        lte: new Date(endDate),
      }
    }

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
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
        orderBy: { payPeriodStart: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payroll.count({ where }),
    ])

    return NextResponse.json({
      payrolls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching payrolls:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      employeeId,
      payPeriodStart,
      payPeriodEnd,
      payDate,
      status = 'DRAFT',
      notes,
      // Calculation data will be computed
    } = body

    // Validate required fields
    if (!employeeId || !payPeriodStart || !payPeriodEnd) {
      return NextResponse.json(
        { error: 'Employee ID, pay period start, and pay period end are required' },
        { status: 400 }
      )
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check if payroll record already exists for this period
    const existingPayroll = await prisma.payroll.findUnique({
      where: {
        employeeId_payPeriodStart_payPeriodEnd: {
          employeeId,
          payPeriodStart: new Date(payPeriodStart),
          payPeriodEnd: new Date(payPeriodEnd),
        },
      },
    })

    if (existingPayroll) {
      return NextResponse.json(
        { error: 'Payroll record already exists for this period' },
        { status: 409 }
      )
    }

    // Create initial payroll record (will be calculated later)
    const payroll = await prisma.payroll.create({
      data: {
        employeeId,
        payPeriodStart: new Date(payPeriodStart),
        payPeriodEnd: new Date(payPeriodEnd),
        payDate: payDate ? new Date(payDate) : null,
        status,
        baseSalary: employee.baseSalary,
        notes,
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

    return NextResponse.json(payroll, { status: 201 })
  } catch (error) {
    console.error('Error creating payroll:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}