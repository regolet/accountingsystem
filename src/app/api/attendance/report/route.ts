import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const reportType = searchParams.get('type') || 'summary' // summary, detailed, monthly

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const where: any = {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    }

    if (employeeId) {
      where.employeeId = employeeId
    }

    switch (reportType) {
      case 'summary':
        const summaryData = await prisma.attendance.groupBy({
          by: ['employeeId'],
          where,
          _count: {
            id: true,
          },
          _sum: {
            totalHours: true,
            regularHours: true,
            overtimeHours: true,
          },
        })

        const employeeIds = summaryData.map(item => item.employeeId)
        const employees = await prisma.employee.findMany({
          where: {
            id: {
              in: employeeIds,
            },
          },
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
          },
        })

        const summary = summaryData.map(item => {
          const employee = employees.find(emp => emp.id === item.employeeId)
          return {
            employee,
            totalDays: item._count.id,
            totalHours: item._sum.totalHours || 0,
            regularHours: item._sum.regularHours || 0,
            overtimeHours: item._sum.overtimeHours || 0,
          }
        })

        return NextResponse.json({ summary })

      case 'detailed':
        const detailedData = await prisma.attendance.findMany({
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
          orderBy: [{ employeeId: 'asc' }, { date: 'asc' }],
        })

        return NextResponse.json({ attendances: detailedData })

      case 'monthly':
        const monthlyData = await prisma.$queryRaw`
          SELECT 
            DATE_TRUNC('month', date) as month,
            employee_id,
            COUNT(*) as total_days,
            SUM(total_hours) as total_hours,
            SUM(regular_hours) as regular_hours,
            SUM(overtime_hours) as overtime_hours,
            COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as present_days,
            COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) as absent_days,
            COUNT(CASE WHEN status = 'LATE' THEN 1 END) as late_days
          FROM attendances 
          WHERE date >= ${new Date(startDate)} AND date <= ${new Date(endDate)}
          ${employeeId ? `AND employee_id = ${employeeId}` : ''}
          GROUP BY DATE_TRUNC('month', date), employee_id
          ORDER BY month, employee_id
        `

        return NextResponse.json({ monthlyData })

      default:
        return NextResponse.json(
          { error: 'Invalid report type. Use: summary, detailed, monthly' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error generating attendance report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}