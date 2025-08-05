const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function fixDemoUser() {
  try {
    console.log('🔗 Connecting to Supabase...')
    
    // Check existing users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true }
    })
    console.log('👥 Existing users:', users)
    
    // Check if demo user exists
    const demoUser = await prisma.user.findUnique({
      where: { email: 'admin@demo.com' }
    })
    
    if (demoUser) {
      console.log('✅ Demo user already exists:', demoUser.email)
      return demoUser
    }
    
    console.log('🚀 Creating demo user...')
    
    // Create demo admin user
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    const user = await prisma.user.create({
      data: {
        name: 'Demo Admin',
        email: 'admin@demo.com',
        password: hashedPassword,
        role: 'ADMIN',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpEnabled: false,
        smtpFromName: 'AccountingPro Demo',
      }
    })
    
    console.log('✅ Demo user created successfully:', user.email)
    
    // Create settings if they don't exist
    try {
      const settings = await prisma.settings.findFirst()
      if (!settings) {
        console.log('🚀 Creating demo settings...')
        await prisma.settings.create({
          data: {
            companyName: 'Demo Company',
            companyEmail: 'admin@demo.com',
            defaultCurrency: 'PHP',
            defaultTaxRate: 12.0,
          }
        })
        console.log('✅ Demo settings created')
      } else {
        console.log('✅ Settings already exist')
      }
    } catch (settingsError) {
      console.log('⚠️ Settings creation skipped:', settingsError.message)
    }
    
    return user
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixDemoUser()
  .then(() => {
    console.log('🎉 Demo user setup completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Demo user setup failed:', error)
    process.exit(1)
  })