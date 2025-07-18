import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('PHP'),
  description: z.string(),
  date: z.string().transform(str => new Date(str)),
  invoiceId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Prisma.TransactionWhereInput = {}
    if (type) where.type = type as Prisma.TransactionWhereInput['type']

    // If customerId is provided, find transactions related to that customer's invoices
    if (customerId) {
      where.invoice = {
        customerId: customerId
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { date: 'desc' },
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              customerId: true,
            }
          }
        },
      }),
      prisma.transaction.count({ where }),
    ])

    return NextResponse.json({
      transactions,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createTransactionSchema.parse(body)

    const transaction = await prisma.transaction.create({
      data: {
        type: validatedData.type,
        category: validatedData.category,
        amount: new Prisma.Decimal(validatedData.amount),
        currency: validatedData.currency,
        description: validatedData.description,
        date: validatedData.date,
        invoiceId: validatedData.invoiceId,
      },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            customerId: true,
          }
        }
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}