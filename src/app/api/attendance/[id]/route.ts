import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const attendance = await prisma.attendance.findUnique({
      where: { id: params.id },
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

    if (!attendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const body = await request.json()
    const {
      clockIn,
      clockOut,
      breakStart,
      breakEnd,
      status,
      notes,
    } = body

    // Check if attendance record exists
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: params.id },
    })

    if (!existingAttendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    // Calculate hours if both clock in and out are provided
    let totalHours = existingAttendance.totalHours
    let regularHours = existingAttendance.regularHours
    let overtimeHours = existingAttendance.overtimeHours

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

    const updatedAttendance = await prisma.attendance.update({
      where: { id: params.id },
      data: {
        clockIn: clockIn ? new Date(clockIn) : undefined,
        clockOut: clockOut ? new Date(clockOut) : undefined,
        breakStart: breakStart ? new Date(breakStart) : undefined,
        breakEnd: breakEnd ? new Date(breakEnd) : undefined,
        totalHours,
        regularHours,
        overtimeHours,
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
        isManual: true,
        approvedBy: 'system',
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

    return NextResponse.json(updatedAttendance)
  } catch (error) {
    console.error('Error updating attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    // Check if attendance record exists
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: params.id },
    })

    if (!existingAttendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    await prisma.attendance.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Attendance record deleted successfully' })
  } catch (error) {
    console.error('Error deleting attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}