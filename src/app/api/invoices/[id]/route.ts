import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateInvoiceStatus } from '@/lib/db-utils'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const updateInvoiceSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  notes: z.string().optional(),
  customerId: z.string().optional(),
  dueDate: z.string().optional(),
  tax: z.number().optional(),
  items: z.array(z.object({
    id: z.string().optional(),
    description: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: id },
      include: {
        customer: true,
        items: true,
        transactions: true,
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const validatedData = updateInvoiceSchema.parse(body)

    let invoice
    if (validatedData.status) {
      // Simple status update
      invoice = await updateInvoiceStatus(id, validatedData.status)
    } else if (validatedData.items || validatedData.customerId || validatedData.dueDate || validatedData.tax !== undefined) {
      // Full invoice update
      await prisma.$transaction(async (tx) => {
        // Update invoice basic info
        const updateData: Prisma.InvoiceUpdateInput = {}
        if (validatedData.customerId) updateData.customer = { connect: { id: validatedData.customerId } }
        if (validatedData.dueDate) updateData.dueDate = new Date(validatedData.dueDate)
        if (validatedData.tax !== undefined) updateData.tax = new Prisma.Decimal(validatedData.tax)
        if (validatedData.notes !== undefined) updateData.notes = validatedData.notes

        // Update items if provided
        if (validatedData.items) {
          // Delete existing items
          await tx.invoiceItem.deleteMany({
            where: { invoiceId: id }
          })

          // Calculate totals
          const subtotal = validatedData.items.reduce((sum, item) => 
            sum + (item.quantity * item.unitPrice), 0
          )
          const tax = validatedData.tax || 0
          const total = subtotal + tax

          updateData.subtotal = new Prisma.Decimal(subtotal)
          updateData.total = new Prisma.Decimal(total)

          // Create new items
          const itemsData = validatedData.items.map(item => ({
            invoiceId: id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            total: new Prisma.Decimal(item.quantity * item.unitPrice),
          }))

          await tx.invoiceItem.createMany({
            data: itemsData
          })
        }

        // Update invoice
        invoice = await tx.invoice.update({
          where: { id: id },
          data: updateData,
          include: {
            customer: true,
            items: true,
            transactions: true,
          },
        })
      })
    } else {
      // Simple notes update
      invoice = await prisma.invoice.update({
        where: { id: id },
        data: { notes: validatedData.notes },
        include: {
          customer: true,
          items: true,
          transactions: true,
        },
      })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await prisma.invoice.delete({
      where: { id: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}