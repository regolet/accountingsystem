import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const companyInfoSchema = z.object({
  companyName: z.string().min(1),
  taxId: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().nullable().optional(),
})

const invoiceSettingsSchema = z.object({
  defaultPaymentTerms: z.string(),
  defaultCurrency: z.string(),
  taxRate: z.number().min(0).max(100),
  invoicePrefix: z.string(),
})

const emailTemplateSchema = z.object({
  invoiceEmailSubject: z.string().min(1),
  invoiceEmailMessage: z.string().min(1),
  reimbursementEmailSubject: z.string().min(1),
  reimbursementEmailMessage: z.string().min(1),
})

const employeeSettingsSchema = z.object({
  employeePrefix: z.string().min(1),
  employeeIdLength: z.number().min(1).max(10),
  employeeStartNumber: z.number().min(1),
})

export async function GET() {
  try {
    // Check if DATABASE_URL is available (skip during build if not)
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        companyInfo: {
          companyName: 'Your Company Name',
          taxId: '',
          email: 'admin@company.com',
          phone: '',
          address: '',
          logo: null,
        },
        invoiceSettings: {
          defaultPaymentTerms: 'Net 30',
          defaultCurrency: 'PHP',
          taxRate: 12.0,
          invoicePrefix: 'INV-',
        },
        employeeSettings: {
          employeePrefix: 'EMP-',
          employeeIdLength: 4,
          employeeStartNumber: 1,
        },
        emailTemplates: {
          invoiceEmailSubject: 'Invoice {invoiceNumber} - {amount}',
          invoiceEmailMessage: 'Dear {customerName},\n\nPlease find attached your invoice {invoiceNumber} for {amount}.\n\nDue date: {dueDate}\n\nThank you for your business!\n\nBest regards,\n{companyName}',
          reimbursementEmailSubject: 'Reimbursement Request {reimbursementNumber} - {amount}',
          reimbursementEmailMessage: 'Dear {customerName},\n\nWe hope this email finds you well. Please find attached your reimbursement request for approved expenses.\n\nReimbursement Details:\n• Reimbursement Number: {reimbursementNumber}\n• Total Amount: {amount}\n• Due Date: {dueDate}\n\nThe attached PDF contains a detailed breakdown of all reimbursed expenses. Please review the details and let us know if you have any questions.\n\nWe appreciate your business and look forward to continuing our partnership.\n\nBest regards,\n{companyName} Team',
        }
      })
    }

    // Try to get existing settings, or create default ones
    let settings = await prisma.settings.findFirst()
    
    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.settings.create({
        data: {
          companyName: 'Your Company Name',
          companyTaxId: '',
          companyEmail: 'admin@company.com',
          companyPhone: '',
          companyAddress: '',
          defaultPaymentTerms: 'Net 30',
          defaultCurrency: 'PHP',
          defaultTaxRate: new Prisma.Decimal(12.0),
          invoicePrefix: 'INV-',
        }
      })
    }

    return NextResponse.json({
      companyInfo: {
        companyName: settings.companyName,
        taxId: settings.companyTaxId || '',
        email: settings.companyEmail,
        phone: settings.companyPhone || '',
        address: settings.companyAddress || '',
        logo: settings.companyLogo || null,
      },
      invoiceSettings: {
        defaultPaymentTerms: settings.defaultPaymentTerms,
        defaultCurrency: settings.defaultCurrency,
        taxRate: parseFloat(settings.defaultTaxRate.toString()),
        invoicePrefix: settings.invoicePrefix,
      },
      employeeSettings: {
        employeePrefix: settings.employeePrefix,
        employeeIdLength: settings.employeeIdLength,
        employeeStartNumber: settings.employeeStartNumber,
      },
      emailTemplates: {
        invoiceEmailSubject: settings.invoiceEmailSubject,
        invoiceEmailMessage: settings.invoiceEmailMessage,
        reimbursementEmailSubject: settings.reimbursementEmailSubject,
        reimbursementEmailMessage: settings.reimbursementEmailMessage,
      }
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if DATABASE_URL is available (skip during build if not)
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not available during build' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { type, data } = body

    // Get or create settings record
    let settings = await prisma.settings.findFirst()
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          companyName: 'Your Company Name',
          companyEmail: 'admin@company.com',
          defaultPaymentTerms: 'Net 30',
          defaultCurrency: 'PHP',
          defaultTaxRate: new Prisma.Decimal(12.0),
          invoicePrefix: 'INV-',
        }
      })
    }

    if (type === 'companyInfo') {
      const validatedData = companyInfoSchema.parse(data)
      
      const updatedSettings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          companyName: validatedData.companyName,
          companyTaxId: validatedData.taxId,
          companyEmail: validatedData.email,
          companyPhone: validatedData.phone,
          companyAddress: validatedData.address,
          companyLogo: validatedData.logo,
        }
      })

      return NextResponse.json({ 
        message: 'Company information updated successfully',
        data: {
          companyName: updatedSettings.companyName,
          taxId: updatedSettings.companyTaxId,
          email: updatedSettings.companyEmail,
          phone: updatedSettings.companyPhone,
          address: updatedSettings.companyAddress,
          logo: updatedSettings.companyLogo,
        }
      })
    }

    if (type === 'invoiceSettings') {
      const validatedData = invoiceSettingsSchema.parse(data)
      
      const updatedSettings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          defaultPaymentTerms: validatedData.defaultPaymentTerms,
          defaultCurrency: validatedData.defaultCurrency,
          defaultTaxRate: new Prisma.Decimal(validatedData.taxRate),
          invoicePrefix: validatedData.invoicePrefix,
        }
      })

      return NextResponse.json({ 
        message: 'Invoice settings updated successfully',
        data: {
          defaultPaymentTerms: updatedSettings.defaultPaymentTerms,
          defaultCurrency: updatedSettings.defaultCurrency,
          taxRate: parseFloat(updatedSettings.defaultTaxRate.toString()),
          invoicePrefix: updatedSettings.invoicePrefix,
        }
      })
    }

    if (type === 'employeeSettings') {
      const validatedData = employeeSettingsSchema.parse(data)
      
      const updatedSettings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          employeePrefix: validatedData.employeePrefix,
          employeeIdLength: validatedData.employeeIdLength,
          employeeStartNumber: validatedData.employeeStartNumber,
        }
      })

      return NextResponse.json({ 
        message: 'Employee settings updated successfully',
        data: {
          employeePrefix: updatedSettings.employeePrefix,
          employeeIdLength: updatedSettings.employeeIdLength,
          employeeStartNumber: updatedSettings.employeeStartNumber,
        }
      })
    }

    if (type === 'emailTemplates') {
      const validatedData = emailTemplateSchema.parse(data)
      
      const updatedSettings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          invoiceEmailSubject: validatedData.invoiceEmailSubject,
          invoiceEmailMessage: validatedData.invoiceEmailMessage,
          reimbursementEmailSubject: validatedData.reimbursementEmailSubject,
          reimbursementEmailMessage: validatedData.reimbursementEmailMessage,
        }
      })

      return NextResponse.json({ 
        message: 'Email templates updated successfully',
        data: {
          invoiceEmailSubject: updatedSettings.invoiceEmailSubject,
          invoiceEmailMessage: updatedSettings.invoiceEmailMessage,
          reimbursementEmailSubject: updatedSettings.reimbursementEmailSubject,
          reimbursementEmailMessage: updatedSettings.reimbursementEmailMessage,
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid settings type' },
      { status: 400 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}