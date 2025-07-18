'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Download, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ReportsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Reports</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Summary</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Comprehensive overview of revenue, expenses, and profit margins
            </p>
            <Button size="sm" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoice Report</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Detailed breakdown of all invoices by status and time period
            </p>
            <Button size="sm" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Analysis</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Customer payment patterns and revenue contribution analysis
            </p>
            <Button size="sm" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Monthly Reports</h4>
              <div className="space-y-1">
                <Button variant="ghost" size="sm" className="justify-start">
                  Revenue by Month
                </Button>
                <Button variant="ghost" size="sm" className="justify-start">
                  Expenses by Category
                </Button>
                <Button variant="ghost" size="sm" className="justify-start">
                  Customer Growth
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Tax Reports</h4>
              <div className="space-y-1">
                <Button variant="ghost" size="sm" className="justify-start">
                  Tax Summary (Quarterly)
                </Button>
                <Button variant="ghost" size="sm" className="justify-start">
                  Deductible Expenses
                </Button>
                <Button variant="ghost" size="sm" className="justify-start">
                  1099 Preparation
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}