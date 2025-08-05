const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function createBackup() {
  try {
    console.log('🗄️ Starting database backup...')
    
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {}
    }

    // Get all table names from your schema
    const tables = [
      'users',
      'asset_collections',
      'asset_subitems', 
      'assets',
      'billings',
      'client_plans',
      'clients',
      'company_info',
      'interface_stats',
      'inventory_assignments',
      'inventory_categories',
      'inventory_items',
      'inventory_movements',
      'inventory_suppliers',
      'mikrotik_settings',
      'monitoring_accounts',
      'monitoring_categories',
      'monitoring_groups',
      'monitoring_routers',
      'network_summary',
      'payments',
      'plans',
      'scheduler_settings',
      'stock_movements',
      'suppliers',
      'ticket_attachments',
      'ticket_comments',
      'ticket_history',
      'tickets'
    ]

    // Export data from each table
    for (const table of tables) {
      try {
        console.log(`📊 Backing up ${table}...`)
        
        // Use raw query to get all data from each table
        const data = await prisma.$queryRawUnsafe(`SELECT * FROM ${table}`)
        backup.data[table] = data
        console.log(`✅ ${table}: ${data.length} records`)
      } catch (error) {
        console.log(`⚠️ ${table}: Table might not exist or empty - ${error.message}`)
        backup.data[table] = []
      }
    }

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '../backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // Save backup to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `database-backup-${timestamp}.json`
    const filepath = path.join(backupDir, filename)
    
    // Custom JSON stringifier to handle BigInt
    const jsonString = JSON.stringify(backup, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString()
      }
      return value
    }, 2)
    
    fs.writeFileSync(filepath, jsonString)
    
    console.log(`\n🎉 Backup completed successfully!`)
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
  createBackup()
    .then((filepath) => {
      console.log(`\n🔐 Your database backup is ready: ${filepath}`)
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Backup failed:', error)
      process.exit(1)
    })
}

module.exports = { createBackup }