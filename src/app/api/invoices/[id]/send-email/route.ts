import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, generateInvoiceEmailFromTemplate } from '@/lib/email'
import { generateInvoicePDF } from '@/lib/pdf-generator'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has email enabled and configured
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        smtpEnabled: true,
        smtpHost: true,
        smtpUser: true,
        smtpPass: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.smtpEnabled) {
      return NextResponse.json({ 
        error: 'Email sending is not enabled. Please enable email sending in your account settings.',
        code: 'EMAIL_NOT_ENABLED'
      }, { status: 400 })
    }

    if (!user.smtpUser || !user.smtpPass || !user.smtpHost) {
      return NextResponse.json({ 
        error: 'Email settings are incomplete. Please configure your SMTP settings in account settings.',
        code: 'EMAIL_NOT_CONFIGURED'
      }, { status: 400 })
    }


    // Get invoice with customer details
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (!invoice.customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (!invoice.customer.email) {
      return NextResponse.json({ error: 'Customer email not available' }, { status: 400 })
    }

    // Format currency
    const formatCurrency = (amount: string | number) => {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: invoice.currency,
      }).format(typeof amount === 'string' ? parseFloat(amount) : amount)
    }

    // Generate PDF attachment
    let attachments: { filename: string; content: Buffer; contentType: string }[] = []
    
    try {
      const pdfBuffer = await generateInvoicePDF(invoice.id)
      attachments = [{
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    } catch (pdfError) {
      console.error('Failed to generate PDF attachment:', pdfError)
      // Continue without PDF attachment if generation fails
    }
    
    // Get company settings for email template
    const settings = await prisma.settings.findFirst()
    const companyName = settings?.companyName || process.env.COMPANY_NAME || 'AccountingPro'

    // Generate email using custom template
    const emailContent = await generateInvoiceEmailFromTemplate(
      invoice.customer.name,
      invoice.invoiceNumber,
      formatCurrency(parseFloat(invoice.total.toString())),
      new Date(invoice.dueDate).toLocaleDateString(),
      companyName
    )

    // Send email using the current user's SMTP settings
    const emailSent = await sendEmail({
      to: invoice.customer.email,
      subject: emailContent.subject,
      html: emailContent.html,
      attachments,
    }, session.user.id)

    if (emailSent) {
      // Log the email sending activity
      await prisma.transaction.create({
        data: {
          type: 'INCOME',
          category: 'Email',
          amount: '0',
          currency: invoice.currency,
          description: `Email sent for invoice ${invoice.invoiceNumber} to ${invoice.customer.email}`,
          date: new Date(),
          invoiceId: invoice.id,
        },
      })

      return NextResponse.json({ 
        message: 'Invoice email sent successfully',
        recipient: invoice.customer.email 
      })
    } else {
      return NextResponse.json({ 
        error: 'Failed to send email. Please check your email settings and try again. Common issues: incorrect Gmail app password, invalid SMTP settings, or recipient email address.',
        code: 'EMAIL_SEND_FAILED'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Send invoice email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}