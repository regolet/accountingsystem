import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: true,
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Get company settings
    const settings = await prisma.settings.findFirst()

    // Generate HTML for PDF
    const html = generateInvoiceHTML(invoice, settings)

    // For now, we'll return the HTML as a simple PDF simulation
    // In a production app, you'd use a library like puppeteer or jsPDF
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .company-info { text-align: left; }
          .invoice-info { text-align: right; }
          .bill-to { margin-bottom: 30px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; }
          .items-table th { background-color: #f5f5f5; }
          .totals { text-align: right; margin-top: 20px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .total-final { font-weight: bold; border-top: 2px solid #333; padding-top: 5px; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `

    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.html"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

interface InvoiceWithRelations {
  id: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  subtotal: Prisma.Decimal;
  tax: Prisma.Decimal;
  total: Prisma.Decimal;
  notes: string | null;
  customer: {
    name: string;
    email: string;
    phone: string | null;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    total: Prisma.Decimal;
  }>;
}

interface Settings {
  companyName: string;
  companyEmail: string;
  companyPhone: string | null;
  companyAddress: string | null;
  companyTaxId: string | null;
}

function generateInvoiceHTML(invoice: InvoiceWithRelations, settings: Settings | null) {
  const formatCurrency = (amount: string | Prisma.Decimal) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(parseFloat(amount.toString()))
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString()
  }

  return `
    <div class="header">
      <div class="company-info">
        <h2>${settings?.companyName || 'Your Company'}</h2>
        <p>${settings?.companyEmail || 'contact@company.com'}</p>
        ${settings?.companyPhone ? `<p>${settings.companyPhone}</p>` : ''}
        ${settings?.companyAddress ? `<p>${settings.companyAddress}</p>` : ''}
        ${settings?.companyTaxId ? `<p>Tax ID: ${settings.companyTaxId}</p>` : ''}
      </div>
      <div class="invoice-info">
        <h1>INVOICE</h1>
        <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
        <p><strong>Date:</strong> ${formatDate(invoice.issueDate)}</p>
        <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
        <p><strong>Status:</strong> ${invoice.status}</p>
      </div>
    </div>

    <div class="bill-to">
      <h3>Bill To:</h3>
      <p><strong>${invoice.customer.name}</strong></p>
      <p>${invoice.customer.email}</p>
      ${invoice.customer.phone ? `<p>${invoice.customer.phone}</p>` : ''}
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map((item) => `
          <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.unitPrice)}</td>
            <td>${formatCurrency(item.total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>${formatCurrency(invoice.subtotal)}</span>
      </div>
      <div class="total-row">
        <span>Tax:</span>
        <span>${formatCurrency(invoice.tax)}</span>
      </div>
      <div class="total-row total-final">
        <span>Total:</span>
        <span>${formatCurrency(invoice.total)}</span>
      </div>
    </div>

    ${invoice.notes ? `
      <div style="margin-top: 30px;">
        <h3>Notes:</h3>
        <p>${invoice.notes}</p>
      </div>
    ` : ''}

    <script>
      // Auto-print when opened
      window.onload = function() {
        window.print();
      }
    </script>
  `
}