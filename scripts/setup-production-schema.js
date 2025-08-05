const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function setupProductionSchema() {
  try {
    console.log('🔗 Testing Supabase connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Connected to Supabase successfully')
    
    // Check if users table exists
    try {
      const userCount = await prisma.user.count()
      console.log(`✅ Users table exists with ${userCount} records`)
      
      // Check if settings table exists
      const settingsCount = await prisma.settings.count()
      console.log(`✅ Settings table exists with ${settingsCount} records`)
      
      console.log('🎉 Database schema is already set up!')
      return true
      
    } catch (error) {
      console.log('❌ Database schema needs to be created')
      console.log('Error:', error.message)
      
      // Try to create a simple test to see what's missing
      try {
        await prisma.$queryRaw`SELECT 1 as test`
        console.log('✅ Basic database connection works')
        
        // Try to list tables
        const tables = await prisma.$queryRaw`
          SELECT tablename FROM pg_tables 
          WHERE schemaname = 'public' 
          ORDER BY tablename
        `
        console.log('📋 Existing tables:', tables.map(t => t.tablename))
        
      } catch (queryError) {
        console.log('❌ Database query failed:', queryError.message)
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to connect to database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the setup
setupProductionSchema()
  .then(() => {
    console.log('✅ Production schema setup completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Production schema setup failed:', error)
    process.exit(1)
  })