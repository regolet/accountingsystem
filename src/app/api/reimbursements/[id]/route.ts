import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireGranularPermission } from '@/lib/permissions'
import { ReimbursementStatus } from '@prisma/client'

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
      'viewReimbursements',
      session.user.customPermissions
    )

    const reimbursement = await prisma.reimbursement.findUnique({
      where: { id: params.id },
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
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!reimbursement) {
      return NextResponse.json({ error: 'Reimbursement not found' }, { status: 404 })
    }

    return NextResponse.json({ reimbursement })
  } catch (error: unknown) {
    console.error('Error fetching reimbursement:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch reimbursement' },
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
      'editReimbursements',
      session.user.customPermissions
    )

    const body = await request.json()
    const {
      title,
      description,
      dueDate,
      status,
      items,
      tax
    } = body

    // Check if reimbursement exists
    const existingReimbursement = await prisma.reimbursement.findUnique({
      where: { id: params.id },
      include: { items: true }
    })

    if (!existingReimbursement) {
      return NextResponse.json({ error: 'Reimbursement not found' }, { status: 404 })
    }

    const updateData: {
      title?: string;
      description?: string;
      dueDate?: Date | null;
      status?: ReimbursementStatus;
      approvedBy?: string;
      subtotal?: number;
      total?: number;
      tax?: number;
      items?: {
        create: {
          expenseId?: string | null;
          description: string;
          amount: number;
          date: Date;
          category: string;
          receipt?: string | null;
          notes?: string | null;
        }[];
      };
    } = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (status !== undefined) {
      updateData.status = status as ReimbursementStatus
      // Set approvedBy when status changes to APPROVED
      if (status === 'APPROVED') {
        updateData.approvedBy = session.user.id
      }
    }

    // Update items if provided
    if (items !== undefined) {
      // Calculate new totals
      const subtotal = items.reduce((sum: number, item: { amount: string | number }) => sum + parseFloat(String(item.amount)), 0)
      const taxAmount = tax !== undefined ? parseFloat(tax) : Number(existingReimbursement.tax)
      const total = subtotal + taxAmount

      updateData.subtotal = subtotal
      updateData.total = total
      if (tax !== undefined) updateData.tax = taxAmount

      // Delete existing items and create new ones
      await prisma.reimbursementItem.deleteMany({
        where: { reimbursementId: params.id }
      })

      updateData.items = {
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
    } else if (tax !== undefined) {
      updateData.tax = parseFloat(tax)
      updateData.total = existingReimbursement.subtotal.toNumber() + parseFloat(tax)
    }

    const reimbursement = await prisma.reimbursement.update({
      where: { id: params.id },
      data: updateData,
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
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ reimbursement })
  } catch (error: unknown) {
    console.error('Error updating reimbursement:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update reimbursement' },
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
      'deleteReimbursements',
      session.user.customPermissions
    )

    // Check if reimbursement exists
    const existingReimbursement = await prisma.reimbursement.findUnique({
      where: { id: params.id }
    })

    if (!existingReimbursement) {
      return NextResponse.json({ error: 'Reimbursement not found' }, { status: 404 })
    }

    await prisma.reimbursement.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Reimbursement deleted successfully' })
  } catch (error: unknown) {
    console.error('Error deleting reimbursement:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete reimbursement' },
      { status: 500 }
    )
  }
}