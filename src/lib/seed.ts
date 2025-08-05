import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export async function createDemoUser() {
  let connectionAttempts = 0
  const maxAttempts = 5
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME
  
  // Validate environment
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  while (connectionAttempts < maxAttempts) {
    try {
      connectionAttempts++
      console.log(`Demo user creation attempt ${connectionAttempts}/${maxAttempts}`)
      
      // For serverless, ensure Prisma is connected
      if (isServerless) {
        console.log('Serverless environment detected, ensuring database connection...')
        await prisma.$connect()
      }
      
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
        
        // Enhanced error detection for various connection issues
        const isConnectionError = errorMessage.includes('prepared statement') || 
                                 errorMessage.includes('42P05') || 
                                 errorMessage.includes('connection') ||
                                 errorMessage.includes('timeout') ||
                                 errorMessage.includes('ECONNRESET') ||
                                 errorMessage.includes('ENOTFOUND') ||
                                 errorMessage.includes('connect ETIMEDOUT')
        
        if (isConnectionError && connectionAttempts < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, connectionAttempts - 1), 5000) // Exponential backoff, max 5s
          console.log(`Connection issue detected, retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
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
      
      // For serverless environments, disconnect after operation
      if (isServerless) {
        await prisma.$disconnect()
      }
      
      return user
      
    } catch (error) {
      console.error(`Error creating demo user (attempt ${connectionAttempts}):`, error)
      
      // Enhanced error detection and handling
      const errorMessage = error instanceof Error ? error.message : ''
      const isConnectionError = errorMessage.includes('prepared statement') || 
                               errorMessage.includes('42P05') || 
                               errorMessage.includes('connection') ||
                               errorMessage.includes('timeout') ||
                               errorMessage.includes('ECONNRESET') ||
                               errorMessage.includes('ENOTFOUND') ||
                               errorMessage.includes('connect ETIMEDOUT') ||
                               errorMessage.includes('ECONNREFUSED')
      
      if (isConnectionError && connectionAttempts < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, connectionAttempts - 1), 5000) // Exponential backoff
        console.log(`Connection issue detected, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // If we've exhausted retries, provide detailed error information
      if (connectionAttempts >= maxAttempts) {
        console.error('Max connection attempts reached. Final error details:', {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : 'No stack trace',
          isConnectionError,
          environment: {
            DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
            VERCEL: process.env.VERCEL ? 'True' : 'False',
            NODE_ENV: process.env.NODE_ENV
          }
        })
        
        // Throw a more descriptive error
        throw new Error(`Failed to create demo user after ${maxAttempts} attempts. Last error: ${errorMessage}`)
      }
      
      // For non-connection errors, throw immediately
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