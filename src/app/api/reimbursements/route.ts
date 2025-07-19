import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGranularPermission } from '@/lib/permissions'
import { ReimbursementStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    requireGranularPermission(
      session.user.role,
      'viewReimbursements',
      session.user.customPermissions
    )

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: {
      customerId?: string;
      status?: ReimbursementStatus;
      issueDate?: {
        gte?: Date;
        lte?: Date;
      };
    } = {}

    if (customerId) {
      where.customerId = customerId
    }

    if (status) {
      where.status = status as ReimbursementStatus
    }

    if (startDate && endDate) {
      where.issueDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } else if (startDate) {
      where.issueDate = {
        gte: new Date(startDate)
      }
    } else if (endDate) {
      where.issueDate = {
        lte: new Date(endDate)
      }
    }

    const skip = (page - 1) * limit

    const [reimbursements, total] = await Promise.all([
      prisma.reimbursement.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              expense: {
                select: {
                  id: true,
                  title: true,
                  category: true
                }
              }
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.reimbursement.count({ where })
    ])

    return NextResponse.json({
      reimbursements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: unknown) {
    console.error('Error fetching reimbursements:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch reimbursements' },
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
      'createReimbursements',
      session.user.customPermissions
    )

    const body = await request.json()
    const {
      customerId,
      title,
      description,
      dueDate,
      items,
      tax = 0
    } = body

    // Validate required fields
    if (!customerId || !title || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, title, items' },
        { status: 400 }
      )
    }

    // Generate reimbursement number
    const count = await prisma.reimbursement.count()
    const reimbursementNumber = `REIMB-${String(count + 1).padStart(4, '0')}`

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: { amount: string | number }) => sum + parseFloat(String(item.amount)), 0)
    const total = subtotal + parseFloat(tax)

    const reimbursement = await prisma.reimbursement.create({
      data: {
        reimbursementNumber,
        customerId,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        subtotal,
        tax: parseFloat(tax),
        total,
        createdBy: session.user.id,
        items: {
          create: items.map((item: {
            expenseId?: string;
            description: string;
            amount: string | number;
            date: string;
            category: string;
            receipt?: string;
            notes?: string;
          }) => ({
            expenseId: item.expenseId || null,
            description: item.description,
            amount: parseFloat(String(item.amount)),
            date: new Date(item.date),
            category: item.category,
            receipt: item.receipt || null,
            notes: item.notes || null
          }))
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            expense: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ reimbursement }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating reimbursement:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create reimbursement' },
      { status: 500 }
    )
  }
}