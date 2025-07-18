import puppeteer, { Browser } from 'puppeteer'
import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

interface InvoiceWithRelations {
  id: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  subtotal: Prisma.Decimal;
  tax: Prisma.Decimal;
  total: Prisma.Decimal;
  currency: string;
  notes: string | null;
  customer: {
    name: string;
    email: string;
    phone: string | null;
    address?: string | {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    taxId?: string | null;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    total: Prisma.Decimal;
  }>;
}

interface ReimbursementWithRelations {
  id: string;
  reimbursementNumber: string;
  title: string;
  description: string | null;
  issueDate: Date;
  dueDate: Date | null;
  status: string;
  subtotal: Prisma.Decimal;
  tax: Prisma.Decimal;
  total: Prisma.Decimal;
  customer: {
    name: string;
    email: string;
    phone: string | null;
    address?: string | {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    taxId?: string | null;
  };
  items: Array<{
    description: string;
    amount: Prisma.Decimal;
    date: Date;
    category: string;
    receipt: string | null;
    notes: string | null;
    expense?: {
      title: string;
      category: string;
    } | null;
  }>;
}

interface Settings {
  companyName: string;
  companyEmail: string;
  companyPhone: string | null;
  companyAddress: string | null;
  companyTaxId: string | null;
  companyLogo: string | null;
}

export async function generateInvoicePDF(invoiceId: string): Promise<Buffer> {
  let browser: Browser | null = null
  
  try {
    // Get invoice data
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        items: true,
      },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    // Get company settings
    const settings = await prisma.settings.findFirst()

    // Generate HTML content
    const html = generateInvoiceHTML(invoice as InvoiceWithRelations, settings)

    // Launch puppeteer browser with Windows-compatible settings
    browser = await puppeteer.launch({
      headless: true,  // Use headless mode
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      executablePath: process.platform === 'win32' 
        ? undefined  // Let Puppeteer find Chrome on Windows
        : puppeteer.executablePath()
    })

    const page = await browser.newPage()
    
    // Set content and wait for load
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    // Generate PDF with compact margins
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      printBackground: true,
      preferCSSPageSize: true
    })

    return Buffer.from(pdfBuffer)
  } catch (error) {
    console.error('PDF Generation Error:', error)
    
    // If Puppeteer fails, try a simpler approach
    if (error instanceof Error && (error.message?.includes('Failed to launch') || error.message?.includes('spawn'))) {
      throw new Error('PDF generation failed. Please ensure Chrome or Chromium is installed on your system.')
    }
    
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

export async function generateReimbursementPDF(reimbursementId: string): Promise<Buffer> {
  let browser: Browser | null = null
  
  try {
    // Get reimbursement data
    const reimbursement = await prisma.reimbursement.findUnique({
      where: { id: reimbursementId },
      include: {
        customer: true,
        items: {
          include: {
            expense: true
          }
        },
      },
    })

    if (!reimbursement) {
      throw new Error('Reimbursement not found')
    }

    // Get company settings
    const settings = await prisma.settings.findFirst()

    // Generate HTML content
    const html = generateReimbursementHTML(reimbursement as ReimbursementWithRelations, settings)

    // Launch puppeteer browser with Windows-compatible settings
    browser = await puppeteer.launch({
      headless: true,  // Use headless mode
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      executablePath: process.platform === 'win32' 
        ? undefined  // Let Puppeteer find Chrome on Windows
        : puppeteer.executablePath()
    })

    const page = await browser.newPage()
    
    // Set content and wait for load
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    // Generate PDF with compact margins
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      printBackground: true,
      preferCSSPageSize: true
    })

    return Buffer.from(pdfBuffer)
  } catch (error) {
    console.error('PDF Generation Error:', error)
    
    // If Puppeteer fails, try a simpler approach
    if (error instanceof Error && (error.message?.includes('Failed to launch') || error.message?.includes('spawn'))) {
      throw new Error('PDF generation failed. Please ensure Chrome or Chromium is installed on your system.')
    }
    
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

function generateReimbursementHTML(reimbursement: ReimbursementWithRelations, settings: Settings | null): string {
  const formatCurrency = (amount: string | Prisma.Decimal) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(parseFloat(amount.toString()))
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString()
  }

  const formatAddress = (address: string | {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }) => {
    if (typeof address === 'string') {
      return address
    }
    
    if (!address) return ''
    
    const parts: string[] = []
    if (address.street) parts.push(address.street)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.postalCode) parts.push(address.postalCode)
    if (address.country) parts.push(address.country)
    
    return parts.join(', ')
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reimbursement ${reimbursement.reimbursementNumber}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0;
          padding: 10px;
          color: #333;
          line-height: 1.3;
          font-size: 11px;
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 15px;
          border-bottom: 2px solid #1e40af;
          padding-bottom: 10px;
        }
        .company-info { 
          text-align: left;
          flex: 1;
        }
        .company-info h2 {
          margin: 0 0 5px 0;
          color: #1e40af;
          font-size: 16px;
        }
        .company-info p {
          margin: 2px 0;
          color: #666;
          font-size: 9px;
        }
        .reimbursement-info { 
          text-align: right;
          flex: 1;
        }
        .reimbursement-info h1 {
          margin: 0 0 5px 0;
          color: #1e40af;
          font-size: 20px;
        }
        .reimbursement-info p {
          margin: 2px 0;
          font-size: 10px;
        }
        .bill-to { 
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
        }
        .bill-section {
          flex: 1;
          margin-right: 15px;
          font-size: 10px;
        }
        .bill-section:last-child {
          margin-right: 0;
        }
        .bill-section h3 {
          margin: 0 0 8px 0;
          color: #1e40af;
          font-size: 12px;
        }
        .bill-section p {
          margin: 2px 0;
          font-size: 10px;
        }
        .description-section {
          margin-bottom: 15px;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }
        .description-section h3 {
          margin: 0 0 8px 0;
          color: #1e40af;
          font-size: 12px;
        }
        .description-section p {
          margin: 0;
          font-size: 10px;
        }
        .items-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 15px;
        }
        .items-table th, .items-table td { 
          border: 1px solid #ddd; 
          padding: 6px; 
          text-align: left;
          font-size: 10px;
        }
        .items-table th { 
          background-color: #1e40af; 
          color: white;
          font-weight: bold;
          font-size: 10px;
        }
        .items-table th:nth-child(1),
        .items-table td:nth-child(1) {
          width: 12%;
        }
        .items-table th:nth-child(2),
        .items-table td:nth-child(2) {
          width: 15%;
        }
        .items-table th:nth-child(3),
        .items-table td:nth-child(3) {
          width: 15%;
        }
        .items-table th:nth-child(4),
        .items-table td:nth-child(4) {
          width: 28%;
        }
        .items-table th:nth-child(5),
        .items-table td:nth-child(5) {
          width: 15%;
          text-align: right;
        }
        .items-table th:nth-child(6),
        .items-table td:nth-child(6) {
          width: 15%;
          text-align: right;
        }
        .items-table td.text-right,
        .items-table th.text-right {
          text-align: right;
        }
        .items-table td.text-center,
        .items-table th.text-center {
          text-align: center;
        }
        .totals { 
          margin-top: 15px;
          display: flex;
          justify-content: flex-end;
        }
        .totals-content {
          width: 200px;
        }
        .total-row { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 4px;
          padding: 2px 0;
          font-size: 10px;
        }
        .total-final { 
          font-weight: bold; 
          border-top: 2px solid #333; 
          padding-top: 5px;
          font-size: 12px;
        }
        .notes {
          margin-top: 20px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        .notes h3 {
          margin: 0 0 8px 0;
          color: #1e40af;
          font-size: 11px;
        }
        .notes p {
          font-size: 10px;
        }
        .status {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status.draft { background-color: #f3f4f6; color: #6b7280; }
        .status.sent { background-color: #dbeafe; color: #1d4ed8; }
        .status.approved { background-color: #d1fae5; color: #059669; }
        .status.paid { background-color: #dcfce7; color: #16a34a; }
        .status.rejected { background-color: #fee2e2; color: #dc2626; }
        .status.cancelled { background-color: #f3f4f6; color: #9ca3af; }
        .linked-expense {
          font-size: 9px;
          color: #1e40af;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          ${settings?.companyLogo ? `
            <img 
              src="${settings.companyLogo}" 
              alt="${settings.companyName || 'Company'} Logo" 
              style="width: 96px; height: 96px; object-fit: contain; margin-bottom: 10px;"
            />
          ` : `
            <div class="logo-placeholder">
              <div style="width: 96px; height: 96px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; font-size: 9px; color: #999;">
                LOGO
              </div>
            </div>
          `}
          <h2>${settings?.companyName || 'Your Company'}</h2>
        </div>
        <div class="reimbursement-info">
          <h1>REIMBURSEMENT</h1>
          <p><strong>Reimbursement #:</strong> ${reimbursement.reimbursementNumber}</p>
          <p><strong>Date:</strong> ${formatDate(reimbursement.issueDate)}</p>
          ${reimbursement.dueDate ? `<p><strong>Due Date:</strong> ${formatDate(reimbursement.dueDate)}</p>` : ''}
          <p><strong>Status:</strong> <span class="status ${reimbursement.status.toLowerCase()}">${reimbursement.status}</span></p>
        </div>
      </div>

      <div class="bill-to">
        <div class="bill-section">
          <h3>From:</h3>
          <p><strong>${settings?.companyName || 'Your Company'}</strong></p>
          <p>${settings?.companyEmail || 'contact@company.com'}</p>
          ${settings?.companyPhone ? `<p>${settings.companyPhone}</p>` : ''}
          ${settings?.companyAddress ? `<p>${settings.companyAddress}</p>` : ''}
          ${settings?.companyTaxId ? `<p>Tax ID: ${settings.companyTaxId}</p>` : ''}
        </div>
        <div class="bill-section">
          <h3>To:</h3>
          <p><strong>${reimbursement.customer.name}</strong></p>
          <p>${reimbursement.customer.email}</p>
          ${reimbursement.customer.phone ? `<p>${reimbursement.customer.phone}</p>` : ''}
          ${reimbursement.customer.address ? `<p>${formatAddress(reimbursement.customer.address)}</p>` : ''}
          ${reimbursement.customer.taxId ? `<p>Tax ID: ${reimbursement.customer.taxId}</p>` : ''}
        </div>
      </div>

      ${reimbursement.description ? `
        <div class="description-section">
          <h3>${reimbursement.title}</h3>
          <p>${reimbursement.description}</p>
        </div>
      ` : `
        <div class="description-section">
          <h3>${reimbursement.title}</h3>
        </div>
      `}

      <table class="items-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Receipt</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${reimbursement.items.map((item) => `
            <tr>
              <td>${formatDate(item.date)}</td>
              <td>${item.category}</td>
              <td>${item.receipt || '-'}</td>
              <td>${item.description}</td>
              <td>${formatCurrency(item.amount)}</td>
              <td>${formatCurrency(item.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-content">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(reimbursement.subtotal)}</span>
          </div>
          <div class="total-row">
            <span>Tax:</span>
            <span>${formatCurrency(reimbursement.tax)}</span>
          </div>
          <div class="total-row total-final">
            <span>Total:</span>
            <span>${formatCurrency(reimbursement.total)}</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateInvoiceHTML(invoice: InvoiceWithRelations, settings: Settings | null): string {
  const formatCurrency = (amount: string | Prisma.Decimal) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: invoice.currency || 'PHP',
    }).format(parseFloat(amount.toString()))
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString()
  }

  const formatAddress = (address: string | {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }) => {
    if (typeof address === 'string') {
      return address
    }
    
    if (!address) return ''
    
    const parts: string[] = []
    if (address.street) parts.push(address.street)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.postalCode) parts.push(address.postalCode)
    if (address.country) parts.push(address.country)
    
    return parts.join(', ')
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0;
          padding: 10px;
          color: #333;
          line-height: 1.3;
          font-size: 11px;
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 15px;
          border-bottom: 2px solid #1e40af;
          padding-bottom: 10px;
        }
        .company-info { 
          text-align: left;
          flex: 1;
        }
        .company-info h2 {
          margin: 0 0 5px 0;
          color: #1e40af;
          font-size: 16px;
        }
        .company-info p {
          margin: 2px 0;
          color: #666;
          font-size: 9px;
        }
        .invoice-info { 
          text-align: right;
          flex: 1;
        }
        .invoice-info h1 {
          margin: 0 0 5px 0;
          color: #1e40af;
          font-size: 20px;
        }
        .invoice-info p {
          margin: 2px 0;
          font-size: 10px;
        }
        .bill-to { 
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
        }
        .bill-section {
          flex: 1;
          margin-right: 15px;
          font-size: 10px;
        }
        .bill-section:last-child {
          margin-right: 0;
        }
        .bill-section h3 {
          margin: 0 0 8px 0;
          color: #1e40af;
          font-size: 12px;
        }
        .bill-section p {
          margin: 2px 0;
          font-size: 10px;
        }
        .items-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 15px;
        }
        .items-table th, .items-table td { 
          border: 1px solid #ddd; 
          padding: 6px; 
          text-align: left;
          font-size: 10px;
        }
        .items-table th { 
          background-color: #1e40af; 
          color: white;
          font-weight: bold;
          font-size: 10px;
        }
        .items-table th:nth-child(1),
        .items-table td:nth-child(1) {
          width: 50%;
        }
        .items-table th:nth-child(2),
        .items-table td:nth-child(2) {
          width: 10%;
          text-align: center;
        }
        .items-table th:nth-child(3),
        .items-table td:nth-child(3) {
          width: 20%;
          text-align: right;
        }
        .items-table th:nth-child(4),
        .items-table td:nth-child(4) {
          width: 20%;
          text-align: right;
        }
        .items-table td.text-right,
        .items-table th.text-right {
          text-align: right;
        }
        .items-table td.text-center,
        .items-table th.text-center {
          text-align: center;
        }
        .totals { 
          margin-top: 15px;
          display: flex;
          justify-content: flex-end;
        }
        .totals-content {
          width: 200px;
        }
        .total-row { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 4px;
          padding: 2px 0;
          font-size: 10px;
        }
        .total-final { 
          font-weight: bold; 
          border-top: 2px solid #333; 
          padding-top: 5px;
          font-size: 12px;
        }
        .notes {
          margin-top: 20px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        .notes h3 {
          margin: 0 0 8px 0;
          color: #1e40af;
          font-size: 11px;
        }
        .notes p {
          font-size: 10px;
        }
        .status {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status.draft { background-color: #f3f4f6; color: #6b7280; }
        .status.sent { background-color: #dbeafe; color: #1d4ed8; }
        .status.paid { background-color: #d1fae5; color: #059669; }
        .status.overdue { background-color: #fee2e2; color: #dc2626; }
        .status.cancelled { background-color: #f3f4f6; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          ${settings?.companyLogo ? `
            <img 
              src="${settings.companyLogo}" 
              alt="${settings.companyName || 'Company'} Logo" 
              style="width: 96px; height: 96px; object-fit: contain; margin-bottom: 10px;"
            />
          ` : `
            <div class="logo-placeholder">
              <!-- Logo placeholder 1x1 inch (96px at 96dpi) -->
              <div style="width: 96px; height: 96px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; font-size: 9px; color: #999;">
                LOGO
              </div>
            </div>
          `}
          <h2>${settings?.companyName || 'Your Company'}</h2>
          <!-- Company details commented out
          <p>${settings?.companyEmail || 'contact@company.com'}</p>
          ${settings?.companyPhone ? `<p>${settings.companyPhone}</p>` : ''}
          ${settings?.companyAddress ? `<p>${settings.companyAddress}</p>` : ''}
          ${settings?.companyTaxId ? `<p>Tax ID: ${settings.companyTaxId}</p>` : ''}
          -->
        </div>
        <div class="invoice-info">
          <h1>INVOICE</h1>
          <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Date:</strong> ${formatDate(invoice.issueDate)}</p>
          <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
          <p><strong>Status:</strong> <span class="status ${invoice.status.toLowerCase()}">${invoice.status}</span></p>
        </div>
      </div>

      <div class="bill-to">
        <div class="bill-section">
          <h3>Bill From:</h3>
          <p><strong>${settings?.companyName || 'Your Company'}</strong></p>
          <p>${settings?.companyEmail || 'contact@company.com'}</p>
          ${settings?.companyPhone ? `<p>${settings.companyPhone}</p>` : ''}
          ${settings?.companyAddress ? `<p>${settings.companyAddress}</p>` : ''}
          ${settings?.companyTaxId ? `<p>Tax ID: ${settings.companyTaxId}</p>` : ''}
        </div>
        <div class="bill-section">
          <h3>Bill To:</h3>
          <p><strong>${invoice.customer.name}</strong></p>
          <p>${invoice.customer.email}</p>
          ${invoice.customer.phone ? `<p>${invoice.customer.phone}</p>` : ''}
          ${invoice.customer.address ? `<p>${formatAddress(invoice.customer.address)}</p>` : ''}
          ${invoice.customer.taxId ? `<p>Tax ID: ${invoice.customer.taxId}</p>` : ''}
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
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
        <div class="totals-content">
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
      </div>

      ${invoice.notes ? `
        <div class="notes">
          <h3>Notes:</h3>
          <p>${invoice.notes}</p>
        </div>
      ` : ''}
    </body>
    </html>
  `
}