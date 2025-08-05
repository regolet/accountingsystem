import { NextResponse } from 'next/server'
import { getDashboardMetrics } from '@/lib/db-utils'

export async function GET() {
  const startTime = Date.now()
  
  try {
    console.log('Dashboard API request started')
    
    // Check if DATABASE_URL is available (skip during build if not)
    if (!process.env.DATABASE_URL) {
      console.log('No DATABASE_URL, returning empty metrics')
      return NextResponse.json({
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0,
        outstandingInvoices: 0,
        overdueInvoices: 0,
        customerCount: 0,
        recentTransactions: [],
        source: 'no-database',
        elapsed: Date.now() - startTime
      })
    }

    console.log('Fetching dashboard metrics...')
    const metrics = await getDashboardMetrics()
    const elapsed = Date.now() - startTime
    
    console.log(`Dashboard metrics fetched successfully in ${elapsed}ms`)
    return NextResponse.json({
      ...metrics,
      source: 'database',
      elapsed
    })
  } catch (error) {
    const elapsed = Date.now() - startTime
    console.error('Error fetching dashboard metrics:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'No stack',
      elapsed
    })
    
    // Return fallback data instead of 500 error
    return NextResponse.json({
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0,
      outstandingInvoices: 0,
      overdueInvoices: 0,
      customerCount: 0,
      recentTransactions: [],
      source: 'fallback-error',
      elapsed,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}