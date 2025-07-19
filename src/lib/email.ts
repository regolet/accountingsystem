import nodemailer from 'nodemailer'
import { prisma } from './prisma'
import { simpleDecrypt } from './encryption'

// Template replacement function
const replaceTemplateVariables = (template: string, variables: Record<string, string>): string => {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
  }
  return result
}

// Email configuration interface
interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  fromName?: string
}

// User email settings interface
interface UserEmailSettings {
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPass: string
  smtpFromName: string
}

// Email template interface
interface EmailTemplate {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
}

// Get user email settings from database
const getUserEmailSettings = async (userId: string): Promise<UserEmailSettings | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPass: true,
        smtpFromName: true,
        smtpEnabled: true,
      },
    })

    if (!user || !user.smtpEnabled || !user.smtpUser || !user.smtpPass) {
      return null
    }

    const decryptedPassword = simpleDecrypt(user.smtpPass)

    return {
      smtpHost: user.smtpHost || 'smtp.gmail.com',
      smtpPort: user.smtpPort || 587,
      smtpUser: user.smtpUser,
      smtpPass: decryptedPassword,
      smtpFromName: user.smtpFromName || 'AccountingPro',
    }
  } catch (error) {
    console.error('Error fetching user email settings:', error)
    return null
  }
}

// Create transporter with user-specific database configuration (required)
const createEmailTransporter = async (userId?: string) => {
  // Always require user-specific settings from database
  if (!userId) {
    throw new Error('User ID is required for email sending. Environment variables are no longer used.')
  }

  const userSettings = await getUserEmailSettings(userId)
  if (!userSettings) {
    throw new Error('Email settings not configured for this user. Please configure SMTP settings in your account.')
  }

  const config: EmailConfig = {
    host: userSettings.smtpHost,
    port: userSettings.smtpPort,
    secure: false, // false for 587 with STARTTLS
    auth: {
      user: userSettings.smtpUser,
      pass: userSettings.smtpPass,
    },
    fromName: userSettings.smtpFromName,
  }


  const transporter = nodemailer.createTransport(config)
  
  // Test the connection
  try {
    await transporter.verify()
  } catch (verifyError) {
    console.error('SMTP connection verification failed:', verifyError)
    throw verifyError
  }

  return transporter
}

// Send single email (requires user ID for database settings)
export const sendEmail = async (emailData: EmailTemplate, userId: string): Promise<boolean> => {
  try {
    // Get user settings from database
    const userSettings = await getUserEmailSettings(userId)
    if (!userSettings) {
      console.error('Email settings not configured for user:', userId)
      return false
    }


    const transporter = await createEmailTransporter(userId)
    
    const mailOptions = {
      from: `"${userSettings.smtpFromName}" <${userSettings.smtpUser}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      attachments: emailData.attachments || [],
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Failed to send email - detailed error:', {
      message: error.message,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode,
      command: error.command
    })
    return false
  }
}

// Send batch emails with delay to avoid rate limiting (requires user ID)
export const sendBatchEmails = async (
  emails: EmailTemplate[],
  delayMs: number = 1000,
  userId: string
): Promise<{ sent: number; failed: number }> => {
  let sent = 0
  let failed = 0

  for (const email of emails) {
    try {
      const success = await sendEmail(email, userId)
      if (success) {
        sent++
      } else {
        failed++
      }
      
      // Add delay between emails to avoid rate limiting
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    } catch (error) {
      console.error('Batch email error:', error)
      failed++
    }
  }

  return { sent, failed }
}

// Generate reimbursement email from custom templates
export const generateReimbursementEmailFromTemplate = async (
  customerName: string,
  reimbursementNumber: string,
  amount: string,
  dueDate: string,
  companyName: string = 'AccountingPro'
): Promise<{ subject: string; html: string }> => {
  try {
    // Get email templates from settings
    const settings = await prisma.settings.findFirst()
    
    const variables = {
      customerName,
      reimbursementNumber,
      amount,
      dueDate,
      companyName
    }

    let subject = 'Reimbursement Request {reimbursementNumber} - {amount}'
    let message = 'Dear {customerName},\n\nWe are pleased to inform you about your reimbursement request for approved expenses.\n\nReimbursement Number: {reimbursementNumber}\nTotal Amount: {amount}\n{dueDate}\n\nPlease review the details. If you have any questions regarding this reimbursement, please don\'t hesitate to contact us.\n\nThank you for your business!\n\nBest regards,\n{companyName}'

    if (settings) {
      subject = settings.reimbursementEmailSubject
      message = settings.reimbursementEmailMessage
    }

    const processedSubject = replaceTemplateVariables(subject, variables)
    const processedMessage = replaceTemplateVariables(message, variables)

    // Convert message to HTML (preserve line breaks)
    const htmlMessage = processedMessage.replace(/\n/g, '<br>')

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${processedSubject}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #1e40af;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: #f8f9fa;
            padding: 30px;
            border: 1px solid #e9ecef;
            white-space: pre-line;
          }
          .footer {
            background: #6c757d;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 0 0 8px 8px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${companyName}</h1>
          <h2>Reimbursement Request</h2>
        </div>
        
        <div class="content">
          ${htmlMessage}
        </div>
        
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `

    return { subject: processedSubject, html }
  } catch (error) {
    console.error('Error generating reimbursement email from template:', error)
    // Fallback to default template
    return {
      subject: `Reimbursement Request ${reimbursementNumber} - ${amount}`,
      html: generateReimbursementEmailHTML(customerName, reimbursementNumber, amount, dueDate, companyName)
    }
  }
}

// Generate reimbursement email HTML template (fallback)
export const generateReimbursementEmailHTML = (
  customerName: string,
  reimbursementNumber: string,
  amount: string,
  dueDate: string,
  companyName: string = 'AccountingPro'
): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reimbursement Request ${reimbursementNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: #1e40af;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f8f9fa;
          padding: 30px;
          border: 1px solid #e9ecef;
        }
        .reimbursement-details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #1e40af;
        }
        .amount {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
        }
        .footer {
          background: #6c757d;
          color: white;
          padding: 15px;
          text-align: center;
          border-radius: 0 0 8px 8px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${companyName}</h1>
        <h2>Reimbursement Request</h2>
      </div>
      
      <div class="content">
        <h3>Dear ${customerName},</h3>
        
        <p>We are pleased to inform you about your reimbursement request for approved expenses.</p>
        
        <div class="reimbursement-details">
          <h4>Reimbursement Details:</h4>
          <p><strong>Reimbursement Number:</strong> ${reimbursementNumber}</p>
          <p><strong>Total Amount:</strong> <span class="amount">${amount}</span></p>
          ${dueDate ? `<p><strong>Payment Due:</strong> ${dueDate}</p>` : ''}
        </div>
        
        <p>Please review the details. If you have any questions regarding this reimbursement, please don't hesitate to contact us.</p>
        
        <p>Thank you for your business!</p>
        
        <p>Best regards,<br>
        <strong>${companyName} Team</strong></p>
      </div>
      
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

// Generate invoice email from custom templates
export const generateInvoiceEmailFromTemplate = async (
  customerName: string,
  invoiceNumber: string,
  amount: string,
  dueDate: string,
  companyName: string = 'AccountingPro'
): Promise<{ subject: string; html: string }> => {
  try {
    // Get email templates from settings
    const settings = await prisma.settings.findFirst()
    
    const variables = {
      customerName,
      invoiceNumber,
      amount,
      dueDate,
      companyName
    }

    let subject = 'Invoice {invoiceNumber} - {amount}'
    let message = 'Dear {customerName},\n\nPlease find attached your invoice {invoiceNumber} for {amount}.\n\nDue date: {dueDate}\n\nThank you for your business!\n\nBest regards,\n{companyName}'

    if (settings) {
      subject = settings.invoiceEmailSubject
      message = settings.invoiceEmailMessage
    }

    const processedSubject = replaceTemplateVariables(subject, variables)
    const processedMessage = replaceTemplateVariables(message, variables)

    // Convert message to HTML (preserve line breaks)
    const htmlMessage = processedMessage.replace(/\n/g, '<br>')

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${processedSubject}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #1e40af;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: #f8f9fa;
            padding: 30px;
            border: 1px solid #e9ecef;
            white-space: pre-line;
          }
          .footer {
            background: #6c757d;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 0 0 8px 8px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${companyName}</h1>
          <h2>Invoice Notification</h2>
        </div>
        
        <div class="content">
          ${htmlMessage}
        </div>
        
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `

    return { subject: processedSubject, html }
  } catch (error) {
    console.error('Error generating email from template:', error)
    // Fallback to default template
    return {
      subject: `Invoice ${invoiceNumber} - ${amount}`,
      html: generateInvoiceEmailHTML(customerName, invoiceNumber, amount, dueDate, companyName)
    }
  }
}

// Generate invoice email HTML template (fallback)
export const generateInvoiceEmailHTML = (
  customerName: string,
  invoiceNumber: string,
  amount: string,
  dueDate: string,
  companyName: string = 'AccountingPro'
): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoiceNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: #1e40af;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f8f9fa;
          padding: 30px;
          border: 1px solid #e9ecef;
        }
        .invoice-details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #1e40af;
        }
        .amount {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
        }
        .footer {
          background: #6c757d;
          color: white;
          padding: 15px;
          text-align: center;
          border-radius: 0 0 8px 8px;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          background: #1e40af;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${companyName}</h1>
        <h2>Invoice Notification</h2>
      </div>
      
      <div class="content">
        <h3>Dear ${customerName},</h3>
        
        <p>We hope this email finds you well. This is to notify you that a new invoice has been generated for your account.</p>
        
        <div class="invoice-details">
          <h4>Invoice Details:</h4>
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p><strong>Amount Due:</strong> <span class="amount">${amount}</span></p>
          <p><strong>Due Date:</strong> ${dueDate}</p>
        </div>
        
        <p>Please find the invoice attached to this email. You can also view and download your invoice from your customer portal.</p>
        
        <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
        
        <p>Thank you for your business!</p>
        
        <p>Best regards,<br>
        <strong>${companyName} Team</strong></p>
      </div>
      
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

// Generate balance reminder email HTML template
export const generateBalanceReminderHTML = (
  customerName: string,
  invoices: Array<{
    invoiceNumber: string
    amount: string
    dueDate: string
    daysOverdue?: number
  }>,
  totalAmount: string,
  companyName: string = 'AccountingPro'
): string => {
  const invoiceList = invoices.map(inv => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${inv.invoiceNumber}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${inv.amount}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${inv.dueDate}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; color: ${inv.daysOverdue && inv.daysOverdue > 0 ? '#dc3545' : '#28a745'};">
        ${inv.daysOverdue && inv.daysOverdue > 0 ? `${inv.daysOverdue} days overdue` : 'Current'}
      </td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Outstanding Balance Reminder</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: #dc3545;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f8f9fa;
          padding: 30px;
          border: 1px solid #e9ecef;
        }
        .balance-summary {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #dc3545;
        }
        .total-amount {
          font-size: 28px;
          font-weight: bold;
          color: #dc3545;
          text-align: center;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }
        th {
          background: #1e40af;
          color: white;
          padding: 12px 8px;
          text-align: left;
        }
        .footer {
          background: #6c757d;
          color: white;
          padding: 15px;
          text-align: center;
          border-radius: 0 0 8px 8px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${companyName}</h1>
        <h2>Outstanding Balance Reminder</h2>
      </div>
      
      <div class="content">
        <h3>Dear ${customerName},</h3>
        
        <p>This is a friendly reminder that you have outstanding invoices with a total balance due.</p>
        
        <div class="balance-summary">
          <h4>Total Outstanding Balance:</h4>
          <div class="total-amount">${totalAmount}</div>
        </div>
        
        <h4>Outstanding Invoices:</h4>
        <table>
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceList}
          </tbody>
        </table>
        
        <p>Please arrange payment at your earliest convenience. If you have already made payment, please disregard this notice.</p>
        
        <p>If you have any questions or need to discuss payment arrangements, please contact us immediately.</p>
        
        <p>Thank you for your prompt attention to this matter.</p>
        
        <p>Best regards,<br>
        <strong>${companyName} Accounts Receivable</strong></p>
      </div>
      
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}