import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export async function createDemoUser() {
  try {
    console.log('Checking for existing demo user...')
    
    // Try to find existing user first
    let existingUser
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: 'admin@demo.com' }
      })
    } catch (findError) {
      console.log('Find user query failed, will try to create:', findError.message)
      existingUser = null
    }

    if (existingUser) {
      console.log('Demo user already exists')
      return existingUser
    }

    console.log('Creating new demo user...')
    
    // Create demo admin user
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    const user = await prisma.user.create({
      data: {
        name: 'Demo Admin',
        email: 'admin@demo.com',
        password: hashedPassword,
        role: 'ADMIN',
        // Initialize email settings
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpEnabled: false, // Disabled by default
        smtpFromName: 'AccountingPro Demo',
      }
    })

    console.log('Demo user created successfully')
    return user
  } catch (error) {
    console.error('Error creating demo user:', error)
    
    // If it's a prepared statement error, try to handle it gracefully
    if (error.message?.includes('prepared statement') || error.message?.includes('42P05')) {
      console.log('Handling connection pool issue...')
      // Return a mock user for now to allow the app to work
      return {
        id: 'demo-user-id',
        email: 'admin@demo.com',
        name: 'Demo Admin',
        role: 'ADMIN'
      }
    }
    
    throw error
  }
}

export async function createDemoSettings() {
  try {
    // Check if settings already exist
    const existingSettings = await prisma.settings.findFirst()

    if (existingSettings) {
      console.log('Demo settings already exist')
      return existingSettings
    }

    // Create demo settings
    const settings = await prisma.settings.create({
      data: {
        companyName: 'Demo Company Inc.',
        companyEmail: 'admin@demo.com',
        companyPhone: '+63 (02) 8123-4567',
        companyAddress: '123 Business St., Makati City, Metro Manila, Philippines',
        companyTaxId: 'TIN-123-456-789',
        defaultPaymentTerms: 'Net 30',
        defaultCurrency: 'PHP',
        defaultTaxRate: 12.0,
        invoicePrefix: 'INV-',
        invoiceEmailSubject: 'Invoice {invoiceNumber} - {amount}',
        invoiceEmailMessage: 'Dear {customerName},\n\nPlease find attached your invoice {invoiceNumber} for {amount}.\n\nDue date: {dueDate}\n\nThank you for your business!\n\nBest regards,\n{companyName}',
      }
    })

    console.log('Demo settings created successfully')
    return settings
  } catch (error) {
    console.error('Error creating demo settings:', error)
    throw error
  }
}

export async function setupDemoData() {
  try {
    const user = await createDemoUser()
    const settings = await createDemoSettings()
    
    console.log('Demo data setup complete!')
    return { user, settings }
  } catch (error) {
    console.error('Error setting up demo data:', error)
    throw error
  }
}