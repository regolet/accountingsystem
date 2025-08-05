import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, generateReimbursementEmailFromTemplate } from '@/lib/email'
import { generateReimbursementPDF } from '@/lib/pdf-generator'

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

    // Get reimbursement with customer details and items
    const reimbursement = await prisma.reimbursement.findUnique({
      where: { id },
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
      return NextResponse.json({ error: 'Reimbursement not found' }, { status: 404 })
    }

    if (!reimbursement.customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (!reimbursement.customer.email) {
      return NextResponse.json({ error: 'Customer email not available' }, { status: 400 })
    }

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
      }).format(amount)
    }

    // Get company settings
    const settings = await prisma.settings.findFirst()
    const companyName = settings?.companyName || process.env.COMPANY_NAME || 'AccountingPro'

    // Generate PDF attachment
    const attachments: { filename: string; content: Buffer; contentType: string }[] = []
    
    try {
      const pdfBuffer = await generateReimbursementPDF(reimbursement.id)
      attachments.push({
        filename: `reimbursement-${reimbursement.reimbursementNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      })
    } catch (pdfError) {
      console.error('Failed to generate PDF attachment:', pdfError)
      // Continue without PDF attachment if generation fails
    }

    // Generate email using custom template
    const emailContent = await generateReimbursementEmailFromTemplate(
      reimbursement.customer.name,
      reimbursement.reimbursementNumber,
      formatCurrency(Number(reimbursement.total)),
      reimbursement.dueDate ? new Date(reimbursement.dueDate).toLocaleDateString() : '',
      companyName
    )

    // Send email using the current user's SMTP settings
    const emailSent = await sendEmail({
      to: reimbursement.customer.email,
      subject: emailContent.subject,
      html: emailContent.html,
      attachments,
    }, session.user.id)

    if (emailSent) {
      // Update reimbursement status to SENT if it was DRAFT
      if (reimbursement.status === 'DRAFT') {
        await prisma.reimbursement.update({
          where: { id },
          data: { status: 'SENT' }
        })
      }

      return NextResponse.json({ 
        message: 'Reimbursement email sent successfully',
        recipient: reimbursement.customer.email 
      })
    } else {
      return NextResponse.json({ 
        error: 'Failed to send email. Please check your email settings and try again.',
        code: 'EMAIL_SEND_FAILED'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Send reimbursement email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}