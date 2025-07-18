import { NextResponse } from 'next/server'
import { createDemoUser } from '@/lib/seed'

export async function POST() {
  try {
    const user = await createDemoUser()
    return NextResponse.json({ message: 'Demo user created', user: { id: user.id, email: user.email } })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to create demo user' }, { status: 500 })
  }
}