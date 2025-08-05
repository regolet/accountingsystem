import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { customer: true },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    if (subscription.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cannot generate invoice for inactive subscription' },
        { status: 400 }
      )
    }

    // Generate invoice number
    const count = await prisma.invoice.count()
    const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`

    // Calculate due date (30 days from now)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: subscription.customerId,
        subscriptionId: subscription.id,
        dueDate,
        subtotal: subscription.amount,
        tax: new Prisma.Decimal(0),
        total: subscription.amount,
        currency: subscription.currency,
        status: 'DRAFT',
        notes: `Generated from subscription: ${subscription.name}`,
        items: {
          create: [
            {
              description: subscription.name,
              quantity: 1,
              unitPrice: subscription.amount,
              total: subscription.amount,
            },
          ],
        },
      },
      include: {
        customer: true,
        items: true,
        subscription: true,
      },
    })

    // Update subscription billing info
    const calculateNextBillingDate = (currentDate: Date, interval: number, type: string) => {
      const nextDate = new Date(currentDate)
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
      subscription.nextBillingDate,
      subscription.billingInterval,
      subscription.intervalType
    )

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        lastBilledDate: new Date(),
        nextBillingDate,
        totalBilled: subscription.totalBilled.add(subscription.amount),
        invoiceCount: subscription.invoiceCount + 1,
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error generating invoice from subscription:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}