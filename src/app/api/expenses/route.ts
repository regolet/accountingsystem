import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGranularPermission } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not available, returning empty expenses list')
      return NextResponse.json({
        expenses: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          pages: 0
        }
      })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Wrapped permission check with error handling
    try {
      requireGranularPermission(
        session.user.role,
        'viewExpenses',
        session.user.customPermissions
      )
    } catch (permissionError) {
      console.error('Permission denied for viewExpenses:', permissionError)
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: {
      category?: string;
      status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = {}

    if (category) {
      where.category = category
    }

    if (status) {
      where.status = status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } else if (startDate) {
      where.date = {
        gte: new Date(startDate)
      }
    } else if (endDate) {
      where.date = {
        lte: new Date(endDate)
      }
    }

    const skip = (page - 1) * limit

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where })
    ])

    return NextResponse.json({
      expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: unknown) {
    console.error('Error fetching expenses:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'No stack',
      elapsed: Date.now() - startTime
    })
    
    // Return empty array structure to prevent frontend crashes
    return NextResponse.json({
      expenses: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
      },
      error: 'Failed to fetch expenses'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    requireGranularPermission(
      session.user.role,
      'createExpenses',
      session.user.customPermissions
    )

    const body = await request.json()
    const {
      title,
      description,
      amount,
      currency = 'PHP',
      category,
      date,
      paymentMethod,
      vendor,
      receipt,
      status = 'PENDING'
    } = body

    // Validate required fields
    if (!title || !amount || !category || !date || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: title, amount, category, date, paymentMethod' },
        { status: 400 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        description,
        amount: parseFloat(amount),
        currency,
        category,
        date: new Date(date),
        paymentMethod,
        vendor,
        receipt,
        status,
        submittedBy: session.user.id,
      }
    })

    return NextResponse.json({ expense }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create expense' },
      { status: 500 }
    )
  }
}