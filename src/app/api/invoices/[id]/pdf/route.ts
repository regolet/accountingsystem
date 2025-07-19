import { NextRequest, NextResponse } from 'next/server'
import { generateInvoicePDF } from '@/lib/pdf-generator'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      select: { invoiceNumber: true }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Generate PDF using the new PDF generator
    const pdfBuffer = await generateInvoicePDF(params.id)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    
    // Return more specific error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}