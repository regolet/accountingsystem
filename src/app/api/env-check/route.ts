import { NextResponse } from 'next/server'

export async function GET() {
  // Basic environment check without database operations
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL ? 'true' : 'false',
    VERCEL_ENV: process.env.VERCEL_ENV || 'not-vercel',
    VERCEL_REGION: process.env.VERCEL_REGION || 'unknown',
    
    // Database
    HAS_DATABASE_URL: process.env.DATABASE_URL ? 'true' : 'false',
    DATABASE_URL_START: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) : 'not-set',
    
    // Auth
    HAS_NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'true' : 'false',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not-set',
    
    // Runtime
    NODE_VERSION: process.version,
    PLATFORM: process.platform,
    TIMESTAMP: new Date().toISOString(),
  }

  console.log('Environment Check:', env)

  return NextResponse.json({
    message: 'Environment check completed',
    environment: env,
    isVercel: !!process.env.VERCEL,
    isProduction: process.env.NODE_ENV === 'production'
  })
}