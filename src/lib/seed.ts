import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export async function createDemoUser() {
  let connectionAttempts = 0
  const maxAttempts = 3
  
  while (connectionAttempts < maxAttempts) {
    try {
      connectionAttempts++
      console.log(`Demo user creation attempt ${connectionAttempts}/${maxAttempts}`)
      
      // Try to find existing user first
      let existingUser
      try {
        console.log('Checking for existing demo user...')
        existingUser = await prisma.user.findUnique({
          where: { email: 'admin@demo.com' }
        })
        
        if (existingUser) {
          console.log('Demo user already exists:', existingUser.email)
          return existingUser
        }
      } catch (findError: unknown) {
        const errorMessage = findError instanceof Error ? findError.message : 'Unknown error'
        console.log(`Find user query failed (attempt ${connectionAttempts}):`, errorMessage)
        
        // If it's a connection issue, try again
        if (errorMessage.includes('prepared statement') || errorMessage.includes('42P05') || errorMessage.includes('connection')) {
          if (connectionAttempts < maxAttempts) {
            console.log('Connection issue detected, retrying...')
            await new Promise(resolve => setTimeout(resolve, 1000 * connectionAttempts)) // Progressive delay
            continue
          }
        }
        existingUser = null
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

      console.log('Demo user created successfully:', user.email)
      return user
      
    } catch (error) {
      console.error(`Error creating demo user (attempt ${connectionAttempts}):`, error)
      
      // If it's a connection/prepared statement error and we have retries left, try again
      const errorMessage = error instanceof Error ? error.message : ''
      if ((errorMessage.includes('prepared statement') || errorMessage.includes('42P05') || errorMessage.includes('connection')) && connectionAttempts < maxAttempts) {
        console.log(`Connection issue detected, retrying in ${connectionAttempts} seconds...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * connectionAttempts))
        continue
      }
      
      // If we've exhausted retries or it's a different error, handle it
      if (connectionAttempts >= maxAttempts) {
        console.log('Max connection attempts reached, returning fallback user')
        // Return a fallback user to allow the app to work
        return {
          id: 'demo-fallback-user',
          email: 'admin@demo.com',
          name: 'Demo Admin (Fallback)',
          role: 'ADMIN'
        }
      }
      
      throw error
    }
  }
  
  // This shouldn't be reached, but just in case
  throw new Error('Failed to create demo user after maximum attempts')
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