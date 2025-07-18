import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createInvoiceWithItems } from '@/lib/db-utils'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const createInvoiceSchema = z.object({
  customerId: z.string(),
  dueDate: z.string().transform(str => new Date(str)),
  currency: z.string().default('PHP'),
  notes: z.string().optional(),
  tax: z.number().default(0),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })).min(1),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (status) where.status = status
    if (customerId) where.customerId = customerId
    
    // Add search functionality
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          items: true,
        },
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({
      invoices,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createInvoiceSchema.parse(body)

    // Generate invoice number
    const count = await prisma.invoice.count()
    const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`

    const invoice = await createInvoiceWithItems(
      {
        invoiceNumber,
        customer: { connect: { id: validatedData.customerId } },
        dueDate: validatedData.dueDate,
        currency: validatedData.currency,
        notes: validatedData.notes,
        tax: new Prisma.Decimal(validatedData.tax),
        status: 'DRAFT',
      },
      validatedData.items
    )

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}