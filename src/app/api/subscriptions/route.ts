import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const createSubscriptionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  customerId: z.string(),
  billingType: z.enum(['RETAINER', 'RECURRING_SERVICE', 'SUBSCRIPTION', 'MAINTENANCE']),
  amount: z.number().positive(),
  currency: z.string().default('PHP'),
  billingInterval: z.number().int().positive(),
  intervalType: z.enum(['DAYS', 'WEEKS', 'MONTHS', 'YEARS']),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not available, returning empty subscriptions list')
      return NextResponse.json({
        subscriptions: [],
        total: 0,
        limit: 10,
        offset: 0,
      })
    }

    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    const billingType = searchParams.get('billingType')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Prisma.SubscriptionWhereInput = {}
    if (customerId) where.customerId = customerId
    if (status) where.status = status as Prisma.SubscriptionWhereInput['status']
    if (billingType) where.billingType = billingType as Prisma.SubscriptionWhereInput['billingType']

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          _count: {
            select: { invoices: true },
          },
        },
      }),
      prisma.subscription.count({ where }),
    ])

    return NextResponse.json({
      subscriptions,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'No stack',
      elapsed: Date.now() - startTime
    })
    
    // Return empty array instead of 500 to prevent frontend crashes
    return NextResponse.json({
      subscriptions: [],
      total: 0,
      limit: 10,
      offset: 0,
      error: 'Failed to fetch subscriptions'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createSubscriptionSchema.parse(body)

    // Calculate next billing date
    const calculateNextBillingDate = (startDate: Date, interval: number, type: string) => {
      const nextDate = new Date(startDate)
      switch (type) {
        case 'DAYS':
          nextDate.setDate(nextDate.getDate() + interval)
          break
        case 'WEEKS':
          nextDate.setDate(nextDate.getDate() + (interval * 7))
          break
        case 'MONTHS':
          nextDate.setMonth(nextDate.getMonth() + interval)
          break
        case 'YEARS':
          nextDate.setFullYear(nextDate.getFullYear() + interval)
          break
      }
      return nextDate
    }

    const nextBillingDate = calculateNextBillingDate(
      validatedData.startDate,
      validatedData.billingInterval,
      validatedData.intervalType
    )

    const subscription = await prisma.subscription.create({
      data: {
        ...validatedData,
        amount: new Prisma.Decimal(validatedData.amount),
        nextBillingDate,
      },
      include: {
        customer: true,
      },
    })

    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}