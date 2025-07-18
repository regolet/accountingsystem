import { NextResponse } from 'next/server'
import { getDashboardMetrics } from '@/lib/db-utils'

export async function GET() {
  try {
    // Check if DATABASE_URL is available (skip during build if not)
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        totalRevenue: 0,
        totalExpenses: 0,
        totalCustomers: 0,
        totalInvoices: 0,
        recentTransactions: [],
        monthlyRevenue: [],
      })
    }

    const metrics = await getDashboardMetrics()
    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    )
  }
}