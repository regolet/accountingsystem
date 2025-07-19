import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batch = await prisma.payrollBatch.findUnique({
      where: { id: params.id }
    })

    if (!batch) {
      return NextResponse.json({ error: 'Payroll batch not found' }, { status: 404 })
    }

    return NextResponse.json(batch)
  } catch (error) {
    console.error('Error fetching payroll batch:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { batchName, payDate, status } = body

    const batch = await prisma.payrollBatch.findUnique({
      where: { id: params.id }
    })

    if (!batch) {
      return NextResponse.json({ error: 'Payroll batch not found' }, { status: 404 })
    }

    // Only allow editing certain fields
    const updateData: any = {}
    if (batchName !== undefined) updateData.batchName = batchName
    if (payDate !== undefined) updateData.payDate = payDate ? new Date(payDate) : null
    if (status !== undefined) updateData.status = status

    const updatedBatch = await prisma.payrollBatch.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json(updatedBatch)
  } catch (error) {
    console.error('Error updating payroll batch:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batch = await prisma.payrollBatch.findUnique({
      where: { id: params.id }
    })

    if (!batch) {
      return NextResponse.json({ error: 'Payroll batch not found' }, { status: 404 })
    }

    // Don't allow deletion of paid batches
    if (batch.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot delete paid payroll batches' },
        { status: 400 }
      )
    }

    // Delete all associated payroll records first
    await prisma.payroll.deleteMany({
      where: {
        payPeriodStart: batch.payPeriodStart,
        payPeriodEnd: batch.payPeriodEnd
      }
    })

    // Delete the batch
    await prisma.payrollBatch.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Payroll batch deleted successfully' })
  } catch (error) {
    console.error('Error deleting payroll batch:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}