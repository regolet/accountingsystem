import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGranularPermission } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    requireGranularPermission(
      session.user.role,
      'viewExpenses',
      session.user.customPermissions
    )

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (category) {
      where.category = category
    }

    if (status) {
      where.status = status
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
  } catch (error: any) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch expenses' },
      { status: 500 }
    )
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
  } catch (error: any) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create expense' },
      { status: 500 }
    )
  }
}