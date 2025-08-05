import { NextResponse } from 'next/server'
import { createDemoUser } from '@/lib/seed'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const startTime = Date.now()
  
  try {
    console.log('Starting demo user creation...')
    console.log('Environment check:', {
      DATABASE_URL: process.env.DATABASE_URL ? `Set (${process.env.DATABASE_URL.substring(0, 20)}...)` : 'Not set',
      VERCEL: process.env.VERCEL ? 'True' : 'False',
      NODE_ENV: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
    
    // Quick database connectivity test
    if (process.env.DATABASE_URL) {
      try {
        console.log('Testing database connectivity...')
        await prisma.$connect()
        console.log('Database connection successful')
      } catch (connectError) {
        console.error('Database connection failed:', connectError)
        return NextResponse.json({ 
          error: 'Database connection failed', 
          details: connectError instanceof Error ? connectError.message : 'Connection error',
          timestamp: new Date().toISOString(),
          debug: {
            hasDatabase: !!process.env.DATABASE_URL,
            isVercel: !!process.env.VERCEL,
            nodeEnv: process.env.NODE_ENV,
            elapsed: Date.now() - startTime
          }
        }, { status: 500 })
      }
    }
    
    const user = await createDemoUser()
    console.log('Demo user created successfully:', user.email)
    
    return NextResponse.json({ 
      message: 'Demo user created', 
      user: { id: user.id, email: user.email },
      timestamp: new Date().toISOString(),
      elapsed: Date.now() - startTime
    })
  } catch (error) {
    const elapsed = Date.now() - startTime
    console.error('Seed error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 1000) : 'No stack trace',
      elapsed,
      environment: {
        DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
        VERCEL: process.env.VERCEL ? 'True' : 'False',
        NODE_ENV: process.env.NODE_ENV
      }
    })
    
    // Extract the most relevant error message
    let errorMessage = 'Unknown error occurred'
    if (error instanceof Error) {
      errorMessage = error.message
      // If the error message is just our generic message, try to extract more details
      if (errorMessage.includes('Failed to create demo user after')) {
        const match = errorMessage.match(/Last error: (.+)$/)
        if (match) {
          errorMessage = match[1]
        }
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to create demo user', 
      details: errorMessage,
      timestamp: new Date().toISOString(),
      debug: {
        hasDatabase: !!process.env.DATABASE_URL,
        isVercel: !!process.env.VERCEL,
        nodeEnv: process.env.NODE_ENV,
        elapsed,
        errorType: error?.constructor?.name || 'Unknown'
      }
    }, { status: 500 })
  } finally {
    // Ensure database connection is closed
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.warn('Error disconnecting from database:', disconnectError)
    }
  }
}