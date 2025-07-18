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
  return prisma.transaction.findMany({
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
}

export async function getDashboardMetrics() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    totalRevenue,
    totalExpenses,
    outstandingInvoices,
    overdueInvoices,
    customerCount,
    recentTransactions,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { type: 'INCOME' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: 'EXPENSE' },
      _sum: { amount: true },
    }),
    prisma.invoice.count({
      where: { status: { in: ['SENT', 'OVERDUE'] } },
    }),
    prisma.invoice.count({
      where: { status: 'OVERDUE' },
    }),
    prisma.customer.count(),
    getRecentTransactions(5),
  ])

  const revenue = totalRevenue._sum.amount || new Prisma.Decimal(0)
  const expenses = totalExpenses._sum.amount || new Prisma.Decimal(0)

  return {
    totalRevenue: revenue.toNumber(),
    totalExpenses: expenses.toNumber(),
    netIncome: revenue.sub(expenses).toNumber(),
    outstandingInvoices,
    overdueInvoices,
    customerCount,
    recentTransactions,
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