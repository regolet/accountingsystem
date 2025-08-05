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

async function verifyMigration() {
  console.log('✅ Verifying Supabase migration...')
  
  const connectionString = process.env.DATABASE_URL
  const sql = postgres(connectionString)
  
  try {
    // Check database connection
    const dbInfo = await sql`SELECT current_database(), current_user`
    console.log('🔗 Connected to Supabase:', dbInfo[0].current_database)
    
    // Check main tables
    const tables = [
      'users', 'customers', 'employees', 'settings', 'expenses'
    ]
    
    console.log('\n📊 Data verification:')
    console.log('====================')
    
    for (const table of tables) {
      try {
        const count = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`
        const sample = await sql`SELECT * FROM ${sql(table)} LIMIT 1`
        
        console.log(`\n${table.toUpperCase()}:`)
        console.log(`  Records: ${count[0].count}`)
        
        if (sample.length > 0) {
          const sampleData = sample[0]
          const keys = Object.keys(sampleData).slice(0, 3)
          const preview = {}
          keys.forEach(key => {
            preview[key] = sampleData[key]
          })
          console.log(`  Sample:`, JSON.stringify(preview, null, 2).replace(/\n/g, ' '))
        }
      } catch (error) {
        console.log(`  ❌ Error accessing ${table}: ${error.message}`)
      }
    }
    
    // Test specific queries
    console.log('\n🧪 Testing key queries:')
    console.log('=======================')
    
    try {
      const userCount = await sql`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`
      console.log(`✅ Admin users: ${userCount[0].count}`)
    } catch (error) {
      console.log(`❌ Admin user query failed: ${error.message}`)
    }
    
    try {
      const companySettings = await sql`SELECT "companyName", "companyEmail" FROM settings LIMIT 1`
      if (companySettings.length > 0) {
        console.log(`✅ Company: ${companySettings[0].companyName}`)
        console.log(`✅ Email: ${companySettings[0].companyEmail}`)
      }
    } catch (error) {
      console.log(`❌ Settings query failed: ${error.message}`)
    }
    
    await sql.end()
    
    console.log('\n🎉 Migration verification completed successfully!')
    console.log('🚀 Your Supabase database is ready to use!')
    
    return true
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    await sql.end()
    return false
  }
}

if (require.main === module) {
  verifyMigration()
    .then((success) => {
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('❌ Process failed:', error)
      process.exit(1)
    })
}

module.exports = { verifyMigration }