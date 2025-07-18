import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function POST() {
  try {
    // Find all subscriptions that are due for billing
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today

    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextBillingDate: {
          lte: today,
        },
      },
      include: {
        customer: true,
      },
    })

    const results = []

    for (const subscription of dueSubscriptions) {
      try {
        // Generate invoice number
        const count = await prisma.invoice.count()
        const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`

        // Calculate due date (30 days from now)
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 30)

        // Create invoice
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
            status: 'SENT', // Auto-send subscription invoices
            notes: `Auto-generated from subscription: ${subscription.name}`,
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
        })

        // Calculate next billing date
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

        // Update subscription
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            lastBilledDate: new Date(),
            nextBillingDate,
            totalBilled: subscription.totalBilled.add(subscription.amount),
            invoiceCount: subscription.invoiceCount + 1,
          },
        })

        results.push({
          subscriptionId: subscription.id,
          subscriptionName: subscription.name,
          customerName: subscription.customer.name,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: subscription.amount.toString(),
          status: 'success',
        })
      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error)
        results.push({
          subscriptionId: subscription.id,
          subscriptionName: subscription.name,
          customerName: subscription.customer.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      processed: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      results,
    })
  } catch (error) {
    console.error('Error in recurring billing:', error)
    return NextResponse.json(
      { error: 'Failed to process recurring billing' },
      { status: 500 }
    )
  }
}