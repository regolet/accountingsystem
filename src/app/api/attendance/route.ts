import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    
    if (employeeId) {
      where.employeeId = employeeId
    }
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else if (startDate) {
      where.date = {
        gte: new Date(startDate),
      }
    } else if (endDate) {
      where.date = {
        lte: new Date(endDate),
      }
    }
    
    if (status) {
      where.status = status
    }

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
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
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ])

    return NextResponse.json({
      attendances,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {

    const body = await request.json()
    const {
      employeeId,
      date,
      clockIn,
      clockOut,
      breakStart,
      breakEnd,
      status,
      notes,
      isManual = false,
    } = body

    // Validate required fields
    if (!employeeId || !date) {
      return NextResponse.json(
        { error: 'Employee ID and date are required' },
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

    // Check if attendance record already exists for this date
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: new Date(date),
        },
      },
    })

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Attendance record already exists for this date' },
        { status: 409 }
      )
    }

    // Calculate hours if both clock in and out are provided
    let totalHours = null
    let regularHours = null
    let overtimeHours = null

    if (clockIn && clockOut) {
      const clockInTime = new Date(clockIn)
      const clockOutTime = new Date(clockOut)
      let workingMinutes = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60)

      // Subtract break time if provided
      if (breakStart && breakEnd) {
        const breakStartTime = new Date(breakStart)
        const breakEndTime = new Date(breakEnd)
        const breakMinutes = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60)
        workingMinutes -= breakMinutes
      }

      totalHours = workingMinutes / 60

      // Calculate regular and overtime hours (assuming 8 hours is regular)
      const regularWorkHours = 8
      if (totalHours <= regularWorkHours) {
        regularHours = totalHours
        overtimeHours = 0
      } else {
        regularHours = regularWorkHours
        overtimeHours = totalHours - regularWorkHours
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date: new Date(date),
        clockIn: clockIn ? new Date(clockIn) : null,
        clockOut: clockOut ? new Date(clockOut) : null,
        breakStart: breakStart ? new Date(breakStart) : null,
        breakEnd: breakEnd ? new Date(breakEnd) : null,
        totalHours,
        regularHours,
        overtimeHours,
        status: status || 'PRESENT',
        notes,
        isManual,
        approvedBy: isManual ? 'system' : null,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
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

    return NextResponse.json(attendance, { status: 201 })
  } catch (error) {
    console.error('Error creating attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}