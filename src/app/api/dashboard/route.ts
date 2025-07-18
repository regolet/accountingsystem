import { NextRequest, NextResponse } from 'next/server'
import { getDashboardMetrics } from '@/lib/db-utils'

export async function GET(request: NextRequest) {
  try {
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