'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/ui/role-guard'
import ClockWidget from '@/components/attendance/clock-widget'
import { Users, Clock, TrendingUp, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  department: string
  position: string
}

interface AttendanceStats {
  totalEmployees: number
  presentToday: number
  absentToday: number
  lateToday: number
  totalHoursToday: number
  overtimeHoursToday: number
}

interface RecentAttendance {
  id: string
  employee: {
    firstName: string
    lastName: string
    employeeId: string
  }
  clockIn: string | null
  clockOut: string | null
  status: string
  totalHours: number | string | null
}

export default function AttendanceDashboard() {
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [recentAttendance, setRecentAttendance] = useState<RecentAttendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAttendanceStats()
    fetchRecentAttendance()
    fetchEmployees()
  }, [])

  const fetchAttendanceStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/attendance/report?type=summary&startDate=${today}&endDate=${today}`)
      const data = await response.json()
      
      if (response.ok && data.summary) {
        const totalEmployees = await fetch('/api/employees').then(r => r.json()).then(d => d.employees?.length || 0)
        
        const presentToday = data.summary.filter((s: { totalDays: number }) => s.totalDays > 0).length
        const totalHours = data.summary.reduce((sum: number, s: { totalHours?: number }) => sum + (s.totalHours || 0), 0)
        const overtimeHours = data.summary.reduce((sum: number, s: { overtimeHours?: number }) => sum + (s.overtimeHours || 0), 0)

        setStats({
          totalEmployees,
          presentToday,
          absentToday: totalEmployees - presentToday,
          lateToday: 0, // Would need additional logic to calculate late arrivals
          totalHoursToday: totalHours,
          overtimeHoursToday: overtimeHours
        })
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error)
    }
  }

  const fetchRecentAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/attendance?startDate=${today}&endDate=${today}&limit=10`)
      const data = await response.json()
      
      if (response.ok) {
        setRecentAttendance(data.attendances || [])
      }
    } catch (error) {
      console.error('Error fetching recent attendance:', error)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      const data = await response.json()
      setEmployees(data.employees || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--'
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatHours = (hours: number | string | null) => {
    if (!hours) return '0.00'
    const numHours = typeof hours === 'string' ? parseFloat(hours) : hours
    if (isNaN(numHours)) return '0.00'
    return numHours.toFixed(2)
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PRESENT: 'text-green-600',
      ABSENT: 'text-red-600',
      LATE: 'text-yellow-600',
      HALF_DAY: 'text-blue-600'
    }
    return colors[status] || 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Attendance Dashboard</h1>
          <p className="text-gray-600">Today's attendance overview and quick actions</p>
        </div>
        <div className="flex gap-2">
          <Link href="/hrms/attendance">
            <Button variant="outline">
              View All Attendance
            </Button>
          </Link>
          <Link href="/hrms/attendance/reports">
            <Button variant="outline">
              Reports
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Clock Widget */}
        <div className="lg:col-span-1">
          <RoleGuard permission="clockInOut">
            <ClockWidget employees={employees} compact={true} />
          </RoleGuard>
        </div>

        {/* Stats Cards */}
        <div className="lg:col-span-2 space-y-6">
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Employees</p>
                      <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Present Today</p>
                      <p className="text-2xl font-bold text-green-600">{stats.presentToday}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Absent Today</p>
                      <p className="text-2xl font-bold text-red-600">{stats.absentToday}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Hours</p>
                      <p className="text-2xl font-bold">{formatHours(stats.totalHoursToday)}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Overtime Hours</p>
                      <p className="text-2xl font-bold text-orange-600">{formatHours(stats.overtimeHoursToday)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Attendance Rate</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.totalEmployees > 0 ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}%
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Recent Attendance */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Today's Attendance</span>
            <Link href="/hrms/attendance">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAttendance.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No attendance records for today yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock In</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock Out</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentAttendance.map((attendance) => (
                    <tr key={attendance.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {attendance.employee.firstName} {attendance.employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{attendance.employee.employeeId}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(attendance.clockIn)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(attendance.clockOut)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {formatHours(attendance.totalHours)}h
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getStatusColor(attendance.status)}`}>
                          {attendance.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}