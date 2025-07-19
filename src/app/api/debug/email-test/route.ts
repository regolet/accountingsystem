import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { simpleEncrypt, simpleDecrypt } from '@/lib/encryption'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { password } = await request.json()
    
    const encrypted = simpleEncrypt(password)
    const decrypted = simpleDecrypt(encrypted)
    const matches = password === decrypted

    return NextResponse.json({
      original: password,
      encrypted: encrypted,
      decrypted: decrypted,
      success: matches
    })
  } catch (error) {
    console.error('Debug test error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'An error occurred' }, { status: 500 })
  }
}