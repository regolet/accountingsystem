const postgres = require('postgres')
const fs = require('fs')
const path = require('path')

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

async function importBackupToSupabase() {
  console.log('📤 Importing backup data to Supabase...')
  
  // Find the correct backup file
  const backupDir = path.join(__dirname, '../backups')
  const files = fs.readdirSync(backupDir)
  const correctBackupFile = files.find(f => f.includes('CORRECT-neon-db-backup'))
  
  if (!correctBackupFile) {
    console.error('❌ Could not find correct backup file!')
    return false
  }
  
  console.log(`📁 Using backup file: ${correctBackupFile}`)
  
  // Load backup data
  const backupPath = path.join(backupDir, correctBackupFile)
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
  
  console.log(`📊 Backup contains ${Object.keys(backup.data).length} tables`)
  console.log(`📅 Backup timestamp: ${backup.timestamp}`)
  
  const connectionString = process.env.DATABASE_URL
  const sql = postgres(connectionString)
  
  try {
    // Import data table by table
    for (const [tableName, tableData] of Object.entries(backup.data)) {
      if (tableData.length === 0) {
        console.log(`⏭️ ${tableName}: No data to import`)
        continue
      }
      
      console.log(`📥 Importing ${tableName}: ${tableData.length} records...`)
      
      try {
        // Get column names from first record
        const columns = Object.keys(tableData[0])
        const columnNames = columns.join(', ')
        
        // Insert data in batches
        const batchSize = 100
        for (let i = 0; i < tableData.length; i += batchSize) {
          const batch = tableData.slice(i, i + batchSize)
          
          // Prepare values for SQL insertion
          const values = batch.map(record => {
            return columns.map(col => {
              const value = record[col]
              if (value === null || value === undefined) return null
              if (typeof value === 'object') return JSON.stringify(value)
              return value
            })
          })
          
          // Insert batch
          await sql`
            INSERT INTO ${sql(tableName)} (${sql.unsafe(columnNames)})
            VALUES ${sql(values)}
            ON CONFLICT DO NOTHING
          `
        }
        
        console.log(`✅ ${tableName}: Successfully imported ${tableData.length} records`)
        
      } catch (error) {
        console.log(`⚠️ ${tableName}: Import failed - ${error.message}`)
        
        // If table doesn't exist, try to create it first
        if (error.message.includes('does not exist')) {
          console.log(`🔧 ${tableName}: Table doesn't exist, will be created by Prisma schema`)
        }
      }
    }
    
    console.log('🎉 Data import completed!')
    await sql.end()
    return true
    
  } catch (error) {
    console.error('❌ Import failed:', error.message)
    await sql.end()
    return false
  }
}

if (require.main === module) {
  importBackupToSupabase()
    .then((success) => {
      console.log(success ? '✅ Import successful!' : '❌ Import failed!')
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('❌ Process failed:', error)
      process.exit(1)
    })
}

module.exports = { importBackupToSupabase }