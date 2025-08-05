import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Environment diagnostics
    const envDiagnostics = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_REGION: process.env.VERCEL_REGION,
      DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : 'Not set',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set',
      timestamp: new Date().toISOString(),
    }

    console.log('Vercel Environment Diagnostics:', envDiagnostics)

    // Database connection test
    let dbStatus = 'Not tested'
    let dbError = null
    let dbElapsed = 0

    if (process.env.DATABASE_URL) {
      const dbStartTime = Date.now()
      try {
        await prisma.$connect()
        await prisma.$queryRaw`SELECT 1 as test`
        dbElapsed = Date.now() - dbStartTime
        dbStatus = 'Connected successfully'
        console.log(`Database connection successful in ${dbElapsed}ms`)
      } catch (error) {
        dbElapsed = Date.now() - dbStartTime
        dbError = error instanceof Error ? error.message : 'Unknown error'
        dbStatus = 'Connection failed'
        console.error('Database connection failed:', error)
      } finally {
        try {
          await prisma.$disconnect()
        } catch (disconnectError) {
          console.warn('Disconnect error:', disconnectError)
        }
      }
    }

    // Memory and runtime info
    const memoryUsage = process.memoryUsage()
    const runtime = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      }
    }

    const totalElapsed = Date.now() - startTime

    return NextResponse.json({
      status: 'Vercel diagnostics completed',
      environment: envDiagnostics,
      database: {
        status: dbStatus,
        error: dbError,
        elapsed: dbElapsed,
        hasUrl: !!process.env.DATABASE_URL
      },
      runtime,
      performance: {
        totalElapsed,
        dbElapsed
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    const totalElapsed = Date.now() - startTime
    console.error('Vercel diagnostics error:', error)
    
    return NextResponse.json({
      status: 'Diagnostics failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'No stack',
      elapsed: totalElapsed,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST() {
  // Test demo user creation specifically on Vercel
  const startTime = Date.now()
  
  try {
    console.log('Testing demo user creation on Vercel...')
    
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        error: 'DATABASE_URL not configured',
        vercel: true,
        elapsed: Date.now() - startTime
      }, { status: 500 })
    }

    // Simple user check
    await prisma.$connect()
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@demo.com' },
      select: { id: true, email: true, role: true }
    })

    await prisma.$disconnect()

    return NextResponse.json({
      status: 'Vercel user test completed',
      userExists: !!existingUser,
      user: existingUser || null,
      elapsed: Date.now() - startTime,
      vercel: true
    })

  } catch (error) {
    const elapsed = Date.now() - startTime
    console.error('Vercel user test error:', error)
    
    return NextResponse.json({
      error: 'Vercel user test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      elapsed,
      vercel: true
    }, { status: 500 })
  }
}