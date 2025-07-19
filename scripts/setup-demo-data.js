const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setupDemoData() {
  try {
    console.log('Checking existing data...')
    
    // Check if demo user exists
    const existingUser = await prisma.user.findFirst({
      where: { email: 'demo@example.com' }
    })
    
    if (!existingUser) {
      console.log('Creating demo user...')
      const hashedPassword = await bcrypt.hash('demo123', 12)
      
      await prisma.user.create({
        data: {
          name: 'Demo User',
          email: 'demo@example.com',
          password: hashedPassword,
          role: 'ADMIN',
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpFromName: 'AccountingPro',
          smtpEnabled: false,
        }
      })
      console.log('Demo user created successfully!')
    } else {
      console.log('Demo user already exists')
    }
    
    // Check if settings exist
    const existingSettings = await prisma.settings.findFirst()
    
    if (!existingSettings) {
      console.log('Creating default settings...')
      await prisma.settings.create({
        data: {
          companyName: 'Your Company Name',
          companyEmail: 'admin@company.com',
          defaultPaymentTerms: 'Net 30',
          defaultCurrency: 'PHP',
          defaultTaxRate: 12.0,
          invoicePrefix: 'INV-',
        }
      })
      console.log('Default settings created successfully!')
    } else {
      console.log('Settings already exist')
    }
    
    console.log('Setup completed!')
    
  } catch (error) {
    console.error('Error setting up demo data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupDemoData()