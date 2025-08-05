import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    console.log('Starting simple demo user creation...')
    
    // Basic environment check
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        error: 'Database not configured',
        details: 'DATABASE_URL environment variable is missing'
      }, { status: 500 })
    }

    // Try to connect to database with shorter timeout
    await prisma.$connect()
    
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@demo.com' }
    })

    if (existingUser) {
      console.log('Demo user already exists')
      return NextResponse.json({ 
        message: 'Demo user verified', 
        user: { id: existingUser.id, email: existingUser.email },
        existed: true
      })
    }

    // Create new demo user with minimal fields
    console.log('Creating new demo user...')
    const hashedPassword = await bcrypt.hash('password123', 10) // Reduced rounds for speed
    
    const user = await prisma.user.create({
      data: {
        name: 'Demo Admin',
        email: 'admin@demo.com',
        password: hashedPassword,
        role: 'ADMIN',
      }
    })

    console.log('Demo user created successfully:', user.email)
    return NextResponse.json({ 
      message: 'Demo user created', 
      user: { id: user.id, email: user.email },
      existed: false
    })

  } catch (error) {
    console.error('Simple seed error:', error)
    return NextResponse.json({ 
      error: 'Failed to create demo user', 
      details: error instanceof Error ? error.message : 'Unknown error',
      simple: true
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}