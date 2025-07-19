import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AttendanceStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {

    const body = await request.json()
    const { employeeId, action, location } = body // action: 'clock_in', 'clock_out', 'break_start', 'break_end'

    if (!employeeId || !action) {
      return NextResponse.json(
        { error: 'Employee ID and action are required' },
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

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const now = new Date()

    // Find or create today's attendance record
    let attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    })

    const updateData: {
      location?: string;
      ipAddress?: string | null;
      clockIn?: Date;
      status?: AttendanceStatus;
      clockOut?: Date;
      totalHours?: number;
      regularHours?: number;
      overtimeHours?: number;
      breakStart?: Date;
      breakEnd?: Date;
    } = {
      location: location || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    }

    switch (action) {
      case 'clock_in':
        if (attendance?.clockIn) {
          return NextResponse.json(
            { error: 'Already clocked in for today' },
            { status: 400 }
          )
        }
        updateData.clockIn = now
        updateData.status = AttendanceStatus.PRESENT
        break

      case 'clock_out':
        if (!attendance?.clockIn) {
          return NextResponse.json(
            { error: 'Must clock in first' },
            { status: 400 }
          )
        }
        if (attendance.clockOut) {
          return NextResponse.json(
            { error: 'Already clocked out for today' },
            { status: 400 }
          )
        }
        updateData.clockOut = now

        // Calculate total hours
        const clockInTime = new Date(attendance.clockIn)
        let workingMinutes = (now.getTime() - clockInTime.getTime()) / (1000 * 60)

        // Subtract break time if taken
        if (attendance.breakStart && attendance.breakEnd) {
          const breakStartTime = new Date(attendance.breakStart)
          const breakEndTime = new Date(attendance.breakEnd)
          const breakMinutes = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60)
          workingMinutes -= breakMinutes
        }

        const totalHours = workingMinutes / 60
        updateData.totalHours = totalHours

        // Calculate regular and overtime hours
        const regularWorkHours = 8
        if (totalHours <= regularWorkHours) {
          updateData.regularHours = totalHours
          updateData.overtimeHours = 0
        } else {
          updateData.regularHours = regularWorkHours
          updateData.overtimeHours = totalHours - regularWorkHours
        }
        break

      case 'break_start':
        if (!attendance?.clockIn) {
          return NextResponse.json(
            { error: 'Must clock in first' },
            { status: 400 }
          )
        }
        if (attendance.breakStart && !attendance.breakEnd) {
          return NextResponse.json(
            { error: 'Break already started' },
            { status: 400 }
          )
        }
        updateData.breakStart = now
        break

      case 'break_end':
        if (!attendance?.breakStart) {
          return NextResponse.json(
            { error: 'Must start break first' },
            { status: 400 }
          )
        }
        if (attendance.breakEnd) {
          return NextResponse.json(
            { error: 'Break already ended' },
            { status: 400 }
          )
        }
        updateData.breakEnd = now
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: clock_in, clock_out, break_start, break_end' },
          { status: 400 }
        )
    }

    if (attendance) {
      // Update existing record
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
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
    } else {
      // Create new record
      attendance = await prisma.attendance.create({
        data: {
          employeeId,
          date: today,
          ...updateData,
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
    }

    return NextResponse.json({
      message: `Successfully ${action.replace('_', ' ')}`,
      attendance,
    })
  } catch (error) {
    console.error('Error processing clock action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}