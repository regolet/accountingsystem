const postgres = require('postgres')
const path = require('path')
const fs = require('fs')

// Load environment variables from .env file
const envPath = path.join(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, '')
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

async function testSupabaseConnection() {
  console.log('🔌 Testing Supabase connection...')
  
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables')
    return false
  }
  
  console.log('🔗 Connection string:', connectionString.replace(/:[^:]*@/, ':****@'))
  
  try {
    const sql = postgres(connectionString, {
      ssl: 'require',
      max: 1,
      idle_timeout: 5,
    })
    
    // Test basic connection
    console.log('🔍 Testing basic connection...')
    const result = await sql`SELECT version(), current_database(), current_user`
    console.log('✅ Connection successful!')
    console.log('📊 Database info:', {
      version: result[0].version.split(' ')[0] + ' ' + result[0].version.split(' ')[1],
      database: result[0].current_database,
      user: result[0].current_user
    })
    
    // Test if we can create tables (check permissions)
    console.log('🔧 Testing table creation permissions...')
    try {
      await sql`CREATE TABLE IF NOT EXISTS test_connection (id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT NOW())`
      await sql`DROP TABLE IF EXISTS test_connection`
      console.log('✅ Table creation permissions: OK')
    } catch (error) {
      console.log('⚠️ Table creation test failed:', error.message)
    }
    
    // Close connection
    await sql.end()
    console.log('🎉 Supabase connection test completed successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    return false
  }
}

// Run test if called directly
if (require.main === module) {
  testSupabaseConnection()
    .then((success) => {
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('❌ Test failed:', error)
      process.exit(1)
    })
}

module.exports = { testSupabaseConnection }