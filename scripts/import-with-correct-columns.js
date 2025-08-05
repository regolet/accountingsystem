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

async function importWithCorrectColumns() {
  console.log('📤 Importing backup data to Supabase with correct column mapping...')
  
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
  
  const connectionString = process.env.DATABASE_URL
  const sql = postgres(connectionString)
  
  try {
    // First, drop existing tables and recreate them with correct structure
    console.log('🔄 Recreating tables with correct column structure...')
    
    // Import users (2 records)
    if (backup.data.users && backup.data.users.length > 0) {
      console.log('👤 Recreating users table...')
      await sql`DROP TABLE IF EXISTS users CASCADE`
      await sql`
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT UNIQUE NOT NULL,
          "emailVerified" TIMESTAMP WITH TIME ZONE,
          image TEXT,
          password TEXT,
          role TEXT DEFAULT 'user',
          "customPermissions" TEXT,
          "smtpHost" TEXT,
          "smtpPort" INTEGER,
          "smtpUser" TEXT,
          "smtpPass" TEXT,
          "smtpFromName" TEXT,
          "smtpEnabled" BOOLEAN DEFAULT false,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
      
      // Insert users data
      for (const user of backup.data.users) {
        await sql`
          INSERT INTO users (
            id, name, email, "emailVerified", image, password, role, 
            "customPermissions", "smtpHost", "smtpPort", "smtpUser", 
            "smtpPass", "smtpFromName", "smtpEnabled", "createdAt", "updatedAt"
          ) VALUES (
            ${user.id}, ${user.name}, ${user.email}, ${user.emailVerified}, 
            ${user.image}, ${user.password}, ${user.role}, ${user.customPermissions},
            ${user.smtpHost}, ${user.smtpPort}, ${user.smtpUser}, ${user.smtpPass},
            ${user.smtpFromName}, ${user.smtpEnabled}, ${user.createdAt}, ${user.updatedAt}
          )
        `
      }
      console.log(`✅ users: ${backup.data.users.length} records imported`)
    }
    
    // Import customers (1 record)
    if (backup.data.customers && backup.data.customers.length > 0) {
      console.log('👥 Recreating customers table...')
      await sql`DROP TABLE IF EXISTS customers CASCADE`
      await sql`
        CREATE TABLE customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          "taxId" TEXT,
          address TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
      
      for (const customer of backup.data.customers) {
        await sql`
          INSERT INTO customers (id, name, email, phone, "taxId", address, "createdAt", "updatedAt")
          VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.phone}, 
                 ${customer.taxId}, ${customer.address}, ${customer.createdAt}, ${customer.updatedAt})
        `
      }
      console.log(`✅ customers: ${backup.data.customers.length} records imported`)
    }
    
    // Import employees (1 record)
    if (backup.data.employees && backup.data.employees.length > 0) {
      console.log('👷 Recreating employees table...')
      await sql`DROP TABLE IF EXISTS employees CASCADE`
      await sql`
        CREATE TABLE employees (
          id TEXT PRIMARY KEY,
          "employeeId" TEXT UNIQUE NOT NULL,
          "firstName" TEXT NOT NULL,
          "lastName" TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          "dateOfBirth" DATE,
          "hireDate" DATE,
          department TEXT,
          position TEXT,
          "employmentType" TEXT,
          status TEXT DEFAULT 'active',
          "baseSalary" DECIMAL(10,2),
          currency TEXT DEFAULT 'PHP',
          address TEXT,
          "emergencyContact" TEXT,
          documents TEXT,
          notes TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
      
      for (const employee of backup.data.employees) {
        await sql`
          INSERT INTO employees (
            id, "employeeId", "firstName", "lastName", email, phone,
            "dateOfBirth", "hireDate", department, position, "employmentType",
            status, "baseSalary", currency, address, "emergencyContact",
            documents, notes, "createdAt", "updatedAt"
          ) VALUES (
            ${employee.id}, ${employee.employeeId}, ${employee.firstName}, ${employee.lastName},
            ${employee.email}, ${employee.phone}, ${employee.dateOfBirth}, ${employee.hireDate},
            ${employee.department}, ${employee.position}, ${employee.employmentType}, ${employee.status},
            ${employee.baseSalary}, ${employee.currency}, ${employee.address}, ${employee.emergencyContact},
            ${employee.documents}, ${employee.notes}, ${employee.createdAt}, ${employee.updatedAt}
          )
        `
      }
      console.log(`✅ employees: ${backup.data.employees.length} records imported`)
    }
    
    // Import settings (1 record)
    if (backup.data.settings && backup.data.settings.length > 0) {
      console.log('⚙️ Recreating settings table...')
      await sql`DROP TABLE IF EXISTS settings CASCADE`
      await sql`
        CREATE TABLE settings (
          id TEXT PRIMARY KEY,
          "companyName" TEXT NOT NULL,
          "companyTaxId" TEXT,
          "companyEmail" TEXT NOT NULL,
          "companyPhone" TEXT,
          "companyAddress" TEXT,
          "companyLogo" TEXT,
          "defaultPaymentTerms" TEXT DEFAULT 'Net 30',
          "defaultCurrency" TEXT DEFAULT 'PHP',
          "defaultTaxRate" DECIMAL(5,2) DEFAULT 12.0,
          "invoicePrefix" TEXT DEFAULT 'INV-',
          "employeeIdLength" INTEGER DEFAULT 4,
          "employeePrefix" TEXT DEFAULT 'EMP-',
          "employeeStartNumber" INTEGER DEFAULT 1,
          "invoiceEmailSubject" TEXT,
          "invoiceEmailMessage" TEXT,
          "reimbursementEmailMessage" TEXT,
          "reimbursementEmailSubject" TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
      
      for (const setting of backup.data.settings) {
        await sql`
          INSERT INTO settings (
            id, "companyName", "companyTaxId", "companyEmail", "companyPhone",
            "companyAddress", "companyLogo", "defaultPaymentTerms", "defaultCurrency",
            "defaultTaxRate", "invoicePrefix", "employeeIdLength", "employeePrefix",
            "employeeStartNumber", "invoiceEmailSubject", "invoiceEmailMessage",
            "reimbursementEmailMessage", "reimbursementEmailSubject", "createdAt", "updatedAt"
          ) VALUES (
            ${setting.id}, ${setting.companyName}, ${setting.companyTaxId}, ${setting.companyEmail},
            ${setting.companyPhone}, ${setting.companyAddress}, ${setting.companyLogo},
            ${setting.defaultPaymentTerms}, ${setting.defaultCurrency}, ${setting.defaultTaxRate},
            ${setting.invoicePrefix}, ${setting.employeeIdLength}, ${setting.employeePrefix},
            ${setting.employeeStartNumber}, ${setting.invoiceEmailSubject}, ${setting.invoiceEmailMessage},
            ${setting.reimbursementEmailMessage}, ${setting.reimbursementEmailSubject},
            ${setting.createdAt}, ${setting.updatedAt}
          )
        `
      }
      console.log(`✅ settings: ${backup.data.settings.length} records imported`)
    }
    
    // Import expenses (2 records)
    if (backup.data.expenses && backup.data.expenses.length > 0) {
      console.log('💰 Recreating expenses table...')
      await sql`DROP TABLE IF EXISTS expenses CASCADE`
      await sql`
        CREATE TABLE expenses (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          amount DECIMAL(10,2) NOT NULL,
          currency TEXT DEFAULT 'PHP',
          category TEXT,
          date DATE NOT NULL,
          "paymentMethod" TEXT,
          vendor TEXT,
          receipt TEXT,
          status TEXT DEFAULT 'approved',
          "submittedBy" TEXT,
          "approvedBy" TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
      
      for (const expense of backup.data.expenses) {
        await sql`
          INSERT INTO expenses (
            id, title, description, amount, currency, category, date,
            "paymentMethod", vendor, receipt, status, "submittedBy", "approvedBy",
            "createdAt", "updatedAt"
          ) VALUES (
            ${expense.id}, ${expense.title}, ${expense.description}, ${expense.amount},
            ${expense.currency}, ${expense.category}, ${expense.date}, ${expense.paymentMethod},
            ${expense.vendor}, ${expense.receipt}, ${expense.status}, ${expense.submittedBy},
            ${expense.approvedBy}, ${expense.createdAt}, ${expense.updatedAt}
          )
        `
      }
      console.log(`✅ expenses: ${backup.data.expenses.length} records imported`)
    }
    
    console.log('🎉 Core data imported successfully!')
    console.log('📊 Import summary:')
    console.log(`  - Users: ${backup.data.users?.length || 0}`)
    console.log(`  - Customers: ${backup.data.customers?.length || 0}`)
    console.log(`  - Employees: ${backup.data.employees?.length || 0}`)
    console.log(`  - Settings: ${backup.data.settings?.length || 0}`)
    console.log(`  - Expenses: ${backup.data.expenses?.length || 0}`)
    
    await sql.end()
    return true
    
  } catch (error) {
    console.error('❌ Import failed:', error.message)
    console.error('Full error:', error)
    await sql.end()
    return false
  }
}

if (require.main === module) {
  importWithCorrectColumns()
    .then((success) => {
      console.log(success ? '✅ Import completed successfully!' : '❌ Import failed!')
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('❌ Process failed:', error)
      process.exit(1)
    })
}

module.exports = { importWithCorrectColumns }