import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }).optional(),
})

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check if database is available (prevent errors during build/deployment)
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not available, returning empty customers list')
      return NextResponse.json({
        customers: [],
        total: 0,
        limit: 10,
        offset: 0,
      })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { invoices: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({
      customers,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching customers:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'No stack',
      elapsed: Date.now() - startTime
    })
    
    // Return empty array instead of 500 to prevent frontend crashes
    return NextResponse.json({
      customers: [],
      total: 0,
      limit: 10,
      offset: 0,
      error: 'Failed to fetch customers'
    })
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const validatedData = createCustomerSchema.parse(body)

    const customer = await prisma.customer.create({
      data: validatedData,
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating customer:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'No stack',
      elapsed: Date.now() - startTime
    })
    
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}