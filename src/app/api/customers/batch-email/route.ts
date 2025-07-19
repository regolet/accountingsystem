import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendBatchEmails, generateBalanceReminderHTML } from '@/lib/email'
import { z } from 'zod'

const batchEmailSchema = z.object({
  customerIds: z.array(z.string()).optional(),
  emailType: z.enum(['balance_reminder', 'overdue_notice']),
  includeOverdueOnly: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { customerIds, emailType, includeOverdueOnly } = batchEmailSchema.parse(body)

    // Build customer filter
    const customerFilter: {
      id?: { in: string[] };
    } = {}
    if (customerIds && customerIds.length > 0) {
      customerFilter.id = { in: customerIds }
    }

    // Get customers with outstanding invoices
    const customers = await prisma.customer.findMany({
      where: {
        ...customerFilter,
        email: { not: undefined },
        invoices: {
          some: {
            status: { in: ['SENT', 'OVERDUE'] }
          }
        }
      },
      include: {
        invoices: {
          where: {
            status: { in: ['SENT', 'OVERDUE'] }
          },
          orderBy: { dueDate: 'asc' }
        }
      }
    })

    if (customers.length === 0) {
      return NextResponse.json({ 
        message: 'No customers found with outstanding invoices',
        sent: 0,
        failed: 0 
      })
    }

    // Format currency helper
    const formatCurrency = (amount: string, currency: string = 'PHP') => {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: currency,
      }).format(parseFloat(amount))
    }

    // Calculate days overdue
    const calculateDaysOverdue = (dueDate: Date): number => {
      const today = new Date()
      const due = new Date(dueDate)
      const diffTime = today.getTime() - due.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 ? diffDays : 0
    }

    // Prepare emails
    const emails = []
    
    for (const customer of customers) {
      if (!customer.email) continue

      let relevantInvoices = customer.invoices

      // Filter for overdue only if requested
      if (includeOverdueOnly) {
        relevantInvoices = customer.invoices.filter(inv => 
          calculateDaysOverdue(inv.dueDate) > 0
        )
      }

      if (relevantInvoices.length === 0) continue

      // Calculate total outstanding balance
      const totalAmount = relevantInvoices.reduce((sum, inv) => 
        sum + parseFloat(inv.total.toString()), 0
      )

      // Prepare invoice data for email template
      const invoiceData = relevantInvoices.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        amount: formatCurrency(inv.total.toString(), inv.currency),
        dueDate: new Date(inv.dueDate).toLocaleDateString(),
        daysOverdue: calculateDaysOverdue(inv.dueDate)
      }))

      // Generate email content based on type
      let subject = ''
      let emailHTML = ''

      if (emailType === 'balance_reminder') {
        subject = `Outstanding Balance Reminder - ${formatCurrency(totalAmount.toString())}`
        emailHTML = generateBalanceReminderHTML(
          customer.name,
          invoiceData,
          formatCurrency(totalAmount.toString()),
          process.env.COMPANY_NAME || 'AccountingPro'
        )
      } else if (emailType === 'overdue_notice') {
        const overdueInvoices = invoiceData.filter(inv => inv.daysOverdue && inv.daysOverdue > 0)
        if (overdueInvoices.length === 0) continue

        subject = `URGENT: Overdue Payment Notice - ${formatCurrency(totalAmount.toString())}`
        emailHTML = generateBalanceReminderHTML(
          customer.name,
          overdueInvoices,
          formatCurrency(totalAmount.toString()),
          process.env.COMPANY_NAME || 'AccountingPro'
        )
      }

      emails.push({
        to: customer.email,
        subject,
        html: emailHTML,
      })
    }

    if (emails.length === 0) {
      return NextResponse.json({ 
        message: 'No eligible customers found for email sending',
        sent: 0,
        failed: 0 
      })
    }

    // Send batch emails with 2-second delay between emails using current user's SMTP settings
    const result = await sendBatchEmails(emails, 2000, session.user.id)

    // Log the batch email activity
    try {
      await prisma.transaction.create({
        data: {
          type: 'EXPENSE',
          category: 'Marketing',
          amount: '0',
          currency: 'PHP',
          description: `Batch ${emailType} emails sent: ${result.sent} successful, ${result.failed} failed`,
          date: new Date(),
        },
      })
    } catch (logError) {
      console.error('Failed to log batch email activity:', logError)
    }

    return NextResponse.json({
      message: `Batch email sending completed`,
      sent: result.sent,
      failed: result.failed,
      total: emails.length,
      emailType
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Batch email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}