import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        customPermissions: true,
      }
    })

    if (!user) {
      return NextResponse.json({ 
        found: false, 
        message: 'User not found',
        email 
      })
    }

    // Test password
    const isPasswordValid = user.password ? await bcrypt.compare(password, user.password) : false
    
    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hasPassword: !!user.password,
        passwordValid: isPasswordValid,
        customPermissions: user.customPermissions
      }
    })
  } catch (error) {
    console.error('Debug user error:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}