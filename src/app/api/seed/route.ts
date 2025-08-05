import { NextResponse } from 'next/server'
import { createDemoUser } from '@/lib/seed'

export async function POST() {
  try {
    console.log('Starting demo user creation...')
    console.log('Environment check:', {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      VERCEL: process.env.VERCEL ? 'True' : 'False',
      NODE_ENV: process.env.NODE_ENV
    })
    
    const user = await createDemoUser()
    console.log('Demo user created successfully:', user.email)
    return NextResponse.json({ 
      message: 'Demo user created', 
      user: { id: user.id, email: user.email },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Seed error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      error: error,
      environment: {
        DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
        VERCEL: process.env.VERCEL ? 'True' : 'False',
        NODE_ENV: process.env.NODE_ENV
      }
    })
    
    // Return comprehensive error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ 
      error: 'Failed to create demo user', 
      details: errorMessage,
      timestamp: new Date().toISOString(),
      debug: {
        hasDatabase: !!process.env.DATABASE_URL,
        isVercel: !!process.env.VERCEL,
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 500 })
  }
}