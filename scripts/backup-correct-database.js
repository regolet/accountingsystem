const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

// Use the correct Neon database connection from environment
const correctDatabaseUrl = process.env.BACKUP_DATABASE_URL || "postgresql://username:password@host:port/database"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: correctDatabaseUrl
    }
  }
})

async function createCorrectBackup() {
  try {
    console.log('🗄️ Starting backup of CORRECT production database...')
    console.log('🔗 Database: [CONFIGURED_DATABASE]')
    
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      source: 'production-database-backup',
      connection: '[CONFIGURED_DATABASE]',
      data: {}
    }

    // First, let's see what tables exist in this database
    console.log('🔍 Discovering database schema...')
    
    // Try to get table names from information_schema
    const tableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `
    
    const tables = await prisma.$queryRawUnsafe(tableQuery)
    console.log(`📊 Found ${tables.length} tables:`, tables.map(t => t.table_name).join(', '))

    // Export data from each discovered table
    for (const tableInfo of tables) {
      const tableName = tableInfo.table_name
      try {
        console.log(`📊 Backing up ${tableName}...`)
        
        const data = await prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}"`)
        backup.data[tableName] = data
        console.log(`✅ ${tableName}: ${data.length} records`)
      } catch (error) {
        console.log(`⚠️ ${tableName}: Error - ${error.message}`)
        backup.data[tableName] = []
      }
    }

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '../backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // Save backup to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `CORRECT-neon-db-backup-${timestamp}.json`
    const filepath = path.join(backupDir, filename)
    
    // Custom JSON stringifier to handle BigInt
    const jsonString = JSON.stringify(backup, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString()
      }
      return value
    }, 2)
    
    fs.writeFileSync(filepath, jsonString)
    
    console.log(`\n🎉 CORRECT database backup completed successfully!`)
    console.log(`📁 File: ${filepath}`)
    console.log(`📊 Total tables backed up: ${Object.keys(backup.data).length}`)
    
    // Calculate total records
    const totalRecords = Object.values(backup.data).reduce((sum, tableData) => sum + tableData.length, 0)
    console.log(`📈 Total records: ${totalRecords}`)

    return filepath
  } catch (error) {
    console.error('❌ Backup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run backup if called directly
if (require.main === module) {
  createCorrectBackup()
    .then((filepath) => {
      console.log(`\n🔐 Your CORRECT database backup is ready: ${filepath}`)
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Backup failed:', error)
      process.exit(1)
    })
}

module.exports = { createCorrectBackup }