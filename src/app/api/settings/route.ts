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
})

const invoiceSettingsSchema = z.object({
  defaultPaymentTerms: z.string(),
  defaultCurrency: z.string(),
  taxRate: z.number().min(0).max(100),
  invoicePrefix: z.string(),
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
        },
        invoiceSettings: {
          defaultPaymentTerms: 'Net 30',
          defaultCurrency: 'PHP',
          taxRate: 12.0,
          invoicePrefix: 'INV-',
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
      },
      invoiceSettings: {
        defaultPaymentTerms: settings.defaultPaymentTerms,
        defaultCurrency: settings.defaultCurrency,
        taxRate: parseFloat(settings.defaultTaxRate.toString()),
        invoicePrefix: settings.invoicePrefix,
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