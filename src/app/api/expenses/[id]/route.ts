import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGranularPermission } from '@/lib/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const expense = await prisma.expense.findUnique({
      where: { id: params.id }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({ expense })
  } catch (error: unknown) {
    console.error('Error fetching expense:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch expense' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    requireGranularPermission(
      session.user.role,
      'editExpenses',
      session.user.customPermissions
    )

    const body = await request.json()
    const {
      title,
      description,
      amount,
      currency,
      category,
      date,
      paymentMethod,
      vendor,
      receipt,
      status
    } = body

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id: params.id }
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const updateData: {
      title?: string;
      description?: string;
      amount?: number;
      currency?: string;
      category?: string;
      date?: Date;
      paymentMethod?: string;
      vendor?: string;
      receipt?: string;
      status?: string;
      approvedBy?: string;
    } = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (currency !== undefined) updateData.currency = currency
    if (category !== undefined) updateData.category = category
    if (date !== undefined) updateData.date = new Date(date)
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod
    if (vendor !== undefined) updateData.vendor = vendor
    if (receipt !== undefined) updateData.receipt = receipt
    if (status !== undefined) {
      updateData.status = status
      // Set approvedBy when status changes to APPROVED
      if (status === 'APPROVED') {
        updateData.approvedBy = session.user.id
      }
    }

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({ expense })
  } catch (error: unknown) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update expense' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    requireGranularPermission(
      session.user.role,
      'deleteExpenses',
      session.user.customPermissions
    )

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id: params.id }
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    await prisma.expense.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error: unknown) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete expense' },
      { status: 500 }
    )
  }
}