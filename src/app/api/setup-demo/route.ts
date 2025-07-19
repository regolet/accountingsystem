import { NextResponse } from 'next/server'
import { setupDemoData } from '@/lib/seed'

export async function POST() {
  try {
    const result = await setupDemoData()
    
    return NextResponse.json({
      message: 'Demo data setup complete',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role
      },
      settings: {
        id: result.settings.id,
        companyName: result.settings.companyName
      }
    })
  } catch (error) {
    console.error('Setup demo data error:', error)
    return NextResponse.json(
      { error: 'Failed to setup demo data' },
      { status: 500 }
    )
  }
}