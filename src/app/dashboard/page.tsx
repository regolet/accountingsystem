'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins, FileText, Users, TrendingUp } from 'lucide-react'

interface DashboardMetrics {
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  outstandingInvoices: number
  overdueInvoices: number
  customerCount: number
  recentTransactions: Array<{
    id: string;
    description: string;
    date: string;
    type: 'INCOME' | 'EXPENSE';
    amount: string;
  }>
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardMetrics()
  }, [])

  const fetchDashboardMetrics = async () => {
    try {
      const response = await fetch('/api/dashboard')
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="text-base sm:text-lg text-center">Loading dashboard...</div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="text-base sm:text-lg text-red-600 text-center">Failed to load dashboard data</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="mt-3 sm:mt-0">
          <p className="text-sm text-gray-500">Welcome back! Here's your business overview.</p>
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Coins className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-gray-500">All time revenue</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.netIncome)}</div>
            <p className="text-xs text-gray-500">Revenue - Expenses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.outstandingInvoices}</div>
            <p className="text-xs text-gray-500">{metrics.overdueInvoices} overdue</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.customerCount}</div>
            <p className="text-xs text-gray-500">Active customers</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {!metrics.recentTransactions || metrics.recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400 mt-1">Transactions will appear here once you start using the system</p>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm sm:text-base">{transaction.description}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`font-semibold text-sm sm:text-base mt-2 sm:mt-0 ${
                    transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(parseFloat(transaction.amount))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}