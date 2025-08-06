'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Users, Clock, TrendingUp, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function HRMSReportsPage() {
  const reports = [
    {
      title: 'Attendance Reports',
      description: 'Employee attendance summary, timesheets, and absence reports',
      icon: Clock,
      href: '/hrms/attendance/reports',
      color: 'bg-blue-500',
    },
    {
      title: 'Employee Reports',
      description: 'Employee directory, performance, and demographic reports',
      icon: Users,
      href: '/hrms/employees',
      color: 'bg-green-500',
    },
    {
      title: 'Payroll Reports',
      description: 'Salary analysis, payroll summaries, and cost center reports',
      icon: TrendingUp,
      href: '/hrms/payroll',
      color: 'bg-purple-500',
    },
    {
      title: 'Payslip Reports',
      description: 'Individual and batch payslip generation and distribution',
      icon: FileText,
      href: '/hrms/payslips',
      color: 'bg-orange-500',
    },
    {
      title: 'Earnings & Deductions',
      description: 'Earnings breakdown, deduction summaries, and benefit reports',
      icon: BarChart3,
      href: '/hrms/earnings',
      color: 'bg-indigo-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            HRMS Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate and view various HR reports and analytics
          </p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.title} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${report.color} bg-opacity-10`}>
                  <report.icon className={`h-6 w-6 ${report.color.replace('bg-', 'text-')}`} />
                </div>
                <CardTitle className="text-lg font-semibold">{report.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                {report.description}
              </p>
              <Link href={report.href}>
                <Button variant="outline" className="w-full">
                  View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Attendance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Average attendance rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payroll Processed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}