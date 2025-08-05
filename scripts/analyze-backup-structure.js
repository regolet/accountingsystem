const fs = require('fs')
const path = require('path')

function analyzeBackupStructure() {
  console.log('🔍 Analyzing backup data structure...')
  
  // Find the correct backup file
  const backupDir = path.join(__dirname, '../backups')
  const files = fs.readdirSync(backupDir)
  const correctBackupFile = files.find(f => f.includes('CORRECT-neon-db-backup'))
  
  if (!correctBackupFile) {
    console.error('❌ Could not find correct backup file!')
    return false
  }
  
  console.log(`📁 Analyzing: ${correctBackupFile}`)
  
  // Load backup data
  const backupPath = path.join(backupDir, correctBackupFile)
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
  
  console.log('\n📊 Table structures found in backup:')
  console.log('=====================================')
  
  for (const [tableName, tableData] of Object.entries(backup.data)) {
    if (tableData.length === 0) {
      console.log(`\n${tableName}: (empty)`)
      continue
    }
    
    console.log(`\n${tableName}: ${tableData.length} records`)
    const firstRecord = tableData[0]
    const columns = Object.keys(firstRecord)
    
    console.log('  Columns:', columns.join(', '))
    
    // Show sample data for key columns
    const sampleData = {}
    columns.slice(0, 5).forEach(col => { // Show first 5 columns
      sampleData[col] = firstRecord[col]
    })
    console.log('  Sample:', JSON.stringify(sampleData, null, 2).replace(/\n/g, ' '))
  }
  
  return true
}

if (require.main === module) {
  analyzeBackupStructure()
}