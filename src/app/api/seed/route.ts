import { NextResponse } from 'next/server'
import { createDemoUser } from '@/lib/seed'

export async function POST() {
  try {
    console.log('Starting demo user creation...')
    const user = await createDemoUser()
    console.log('Demo user created successfully:', user.email)
    return NextResponse.json({ message: 'Demo user created', user: { id: user.id, email: user.email } })
  } catch (error) {
    console.error('Seed error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      error: error
    })
    
    // Return more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ 
      error: 'Failed to create demo user', 
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}