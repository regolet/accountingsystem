import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

export async function getCustomerWithInvoices(customerId: string) {
  return prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      invoices: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function getRecentTransactions(limit = 10) {
  try {
    return await prisma.transaction.findMany({
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        invoice: {
          include: {
            customer: true,
          },
        },
      },
    })
  } catch (error) {
    console.warn('getRecentTransactions failed:', error instanceof Error ? error.message : 'Unknown error')
    // Return empty array as fallback
    return []
  }
}

export async function getDashboardMetrics() {
  console.log('Getting dashboard metrics...')
  
  try {
    // Try to get basic customer count first (most likely to exist)
    const customerCount = await prisma.customer.count().catch(() => 0)
    console.log('Customer count:', customerCount)

    // Try to get invoice data
    let outstandingInvoices = 0
    let overdueInvoices = 0
    try {
      outstandingInvoices = await prisma.invoice.count({
        where: { status: { in: ['SENT', 'OVERDUE'] } },
      })
      overdueInvoices = await prisma.invoice.count({
        where: { status: 'OVERDUE' },
      })
      console.log('Invoice counts:', { outstandingInvoices, overdueInvoices })
    } catch (invoiceError) {
      console.warn('Invoice queries failed:', invoiceError instanceof Error ? invoiceError.message : 'Unknown error')
    }

    // Try to get transaction data (most likely to fail due to enum issues)
    let totalRevenue = new Prisma.Decimal(0)
    let totalExpenses = new Prisma.Decimal(0)
    let recentTransactions: any[] = []

    try {
      console.log('Attempting transaction queries...')
      const [revenueResult, expenseResult] = await Promise.all([
        prisma.transaction.aggregate({
          where: { type: 'INCOME' },
          _sum: { amount: true },
        }).catch((error) => {
          console.warn('Revenue query failed:', error instanceof Error ? error.message : 'Unknown error')
          return { _sum: { amount: null } }
        }),
        prisma.transaction.aggregate({
          where: { type: 'EXPENSE' },
          _sum: { amount: true },
        }).catch((error) => {
          console.warn('Expense query failed:', error instanceof Error ? error.message : 'Unknown error')
          return { _sum: { amount: null } }
        })
      ])

      totalRevenue = revenueResult._sum.amount || new Prisma.Decimal(0)
      totalExpenses = expenseResult._sum.amount || new Prisma.Decimal(0)
      console.log('Transaction aggregates successful')

      // Try to get recent transactions
      recentTransactions = await getRecentTransactions(5).catch((error) => {
        console.warn('Recent transactions query failed:', error instanceof Error ? error.message : 'Unknown error')
        return []
      })

    } catch (transactionError) {
      console.warn('Transaction queries failed entirely:', transactionError instanceof Error ? transactionError.message : 'Unknown error')
    }

    // Format recent transactions for dashboard
    const formattedTransactions = recentTransactions.map(transaction => ({
      id: transaction.id,
      description: transaction.description,
      date: transaction.date.toISOString(),
      type: transaction.type,
      amount: transaction.amount.toString(),
    }))

    const result = {
      totalRevenue: totalRevenue.toNumber(),
      totalExpenses: totalExpenses.toNumber(),
      netIncome: totalRevenue.sub(totalExpenses).toNumber(),
      outstandingInvoices,
      overdueInvoices,
      customerCount,
      recentTransactions: formattedTransactions,
    }

    console.log('Dashboard metrics completed:', result)
    return result

  } catch (error) {
    console.error('Dashboard metrics failed completely:', error)
    // Return safe fallback data
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0,
      outstandingInvoices: 0,
      overdueInvoices: 0,
      customerCount: 0,
      recentTransactions: [],
    }
  }
}

export async function createInvoiceWithItems(
  invoiceData: Omit<Prisma.InvoiceCreateInput, 'items' | 'subtotal' | 'total'>,
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
  }>
) {
  const invoiceItems = items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: new Prisma.Decimal(item.unitPrice),
    total: new Prisma.Decimal(item.quantity * item.unitPrice),
  }))

  const subtotal = invoiceItems.reduce(
    (sum, item) => sum.add(item.total),
    new Prisma.Decimal(0)
  )

  const taxAmount = invoiceData.tax ? new Prisma.Decimal(invoiceData.tax.toString()) : new Prisma.Decimal(0)
  const total = subtotal.add(taxAmount)

  return prisma.invoice.create({
    data: {
      ...invoiceData,
      subtotal,
      total,
      items: {
        create: invoiceItems,
      },
    },
    include: {
      customer: true,
      items: true,
    },
  })
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
) {
  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status },
  })

  if (status === 'PAID') {
    await prisma.transaction.create({
      data: {
        type: 'INCOME',
        category: 'Invoice Payment',
        amount: invoice.total,
        currency: invoice.currency,
        description: `Payment for invoice ${invoice.invoiceNumber}`,
        date: new Date(),
        invoiceId: invoice.id,
      },
    })
  }

  return invoice
}