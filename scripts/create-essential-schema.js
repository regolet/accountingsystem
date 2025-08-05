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

async function createEssentialSchema() {
  console.log('🏗️ Creating essential accounting schema in Supabase...')
  
  const connectionString = process.env.DATABASE_URL
  const sql = postgres(connectionString)
  
  try {
    // Create essential tables matching your backup data structure
    
    console.log('👤 Creating users table...')
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        role TEXT DEFAULT 'user',
        "customPermissions" TEXT,
        "emailVerified" TIMESTAMP WITH TIME ZONE,
        image TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    console.log('👥 Creating customers table...')
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        "taxId" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    console.log('👷 Creating employees table...')
    await sql`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        "employeeId" TEXT UNIQUE NOT NULL,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        position TEXT,
        department TEXT,
        "hireDate" DATE,
        "birthDate" DATE,
        "hourlyRate" DECIMAL(10,2),
        "monthlyRate" DECIMAL(10,2),
        status TEXT DEFAULT 'active',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    console.log('📄 Creating invoices table...')
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        "invoiceNumber" TEXT UNIQUE NOT NULL,
        "customerId" TEXT,
        amount DECIMAL(10,2) NOT NULL,
        "taxAmount" DECIMAL(10,2) DEFAULT 0,
        "totalAmount" DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'draft',
        "issueDate" DATE NOT NULL,
        "dueDate" DATE NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    console.log('🧾 Creating invoice_items table...')
    await sql`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id TEXT PRIMARY KEY,
        "invoiceId" TEXT NOT NULL,
        description TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        "unitPrice" DECIMAL(10,2) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    console.log('💰 Creating expenses table...')
    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category TEXT,
        date DATE NOT NULL,
        receipt TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    console.log('💼 Creating payroll_batches table...')  
    await sql`
      CREATE TABLE IF NOT EXISTS payroll_batches (
        id TEXT PRIMARY KEY,
        "batchNumber" TEXT UNIQUE NOT NULL,
        "payPeriodStart" DATE NOT NULL,
        "payPeriodEnd" DATE NOT NULL,
        "payDate" DATE NOT NULL,
        status TEXT DEFAULT 'draft',
        "totalAmount" DECIMAL(10,2) DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    console.log('💸 Creating payrolls table...')
    await sql`
      CREATE TABLE IF NOT EXISTS payrolls (
        id TEXT PRIMARY KEY,
        "employeeId" TEXT NOT NULL,
        "batchId" TEXT NOT NULL,
        "grossPay" DECIMAL(10,2) NOT NULL,
        "totalDeductions" DECIMAL(10,2) DEFAULT 0,
        "netPay" DECIMAL(10,2) NOT NULL,
        "hoursWorked" DECIMAL(5,2),
        "overtimeHours" DECIMAL(5,2) DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    console.log('🏦 Creating employee_earnings table...')
    await sql`
      CREATE TABLE IF NOT EXISTS employee_earnings (
        id TEXT PRIMARY KEY,
        "employeeId" TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        "isRecurring" BOOLEAN DEFAULT false,
        "effectiveDate" DATE,
        "endDate" DATE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    console.log('📋 Creating reimbursements table...')
    await sql`
      CREATE TABLE IF NOT EXISTS reimbursements (
        id TEXT PRIMARY KEY,
        "reimbursementNumber" TEXT UNIQUE NOT NULL,
        "customerId" TEXT,
        "totalAmount" DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'draft',
        "requestDate" DATE NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    console.log('📝 Creating reimbursement_items table...')
    await sql`
      CREATE TABLE IF NOT EXISTS reimbursement_items (
        id TEXT PRIMARY KEY,
        "reimbursementId" TEXT NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category TEXT,
        date DATE,
        receipt TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    console.log('⚙️ Creating settings table...')
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
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
        "employeePrefix" TEXT DEFAULT 'EMP-',
        "employeeIdLength" INTEGER DEFAULT 4,
        "employeeStartNumber" INTEGER DEFAULT 1,
        "invoiceEmailSubject" TEXT,
        "invoiceEmailMessage" TEXT,
        "reimbursementEmailSubject" TEXT,
        "reimbursementEmailMessage" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    console.log('📊 Creating transactions table...')
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        "referenceId" TEXT,
        "referenceType" TEXT,
        date DATE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    console.log('🔔 Creating subscriptions table...')
    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        "customerId" TEXT,
        plan TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        "billingCycle" TEXT DEFAULT 'monthly',
        status TEXT DEFAULT 'active',
        "startDate" DATE NOT NULL,
        "endDate" DATE,
        "nextBillingDate" DATE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    console.log('⏰ Creating attendances table...')
    await sql`
      CREATE TABLE IF NOT EXISTS attendances (
        id TEXT PRIMARY KEY,
        "employeeId" TEXT NOT NULL,
        date DATE NOT NULL,
        "clockIn" TIME,
        "clockOut" TIME,
        "breakStart" TIME,
        "breakEnd" TIME,
        "totalHours" DECIMAL(4,2),
        status TEXT DEFAULT 'present',
        notes TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    // Create NextAuth tables
    console.log('🔐 Creating NextAuth tables...')
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        UNIQUE(provider, "providerAccountId")
      )
    `
    
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        "sessionToken" TEXT UNIQUE NOT NULL,
        "userId" TEXT NOT NULL,
        expires TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `
    
    await sql`
      CREATE TABLE IF NOT EXISTS verificationtokens (
        identifier TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires TIMESTAMP WITH TIME ZONE NOT NULL,
        PRIMARY KEY (identifier, token)
      )
    `
    
    console.log('✅ Essential schema created successfully!')
    console.log('📋 Created 18 tables matching your backup data structure')
    
    await sql.end()
    return true
    
  } catch (error) {
    console.error('❌ Schema creation failed:', error.message)
    await sql.end()
    return false
  }
}

if (require.main === module) {
  createEssentialSchema()
    .then((success) => {
      console.log(success ? '🎉 Schema ready for data import!' : '❌ Schema creation failed!')
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('❌ Process failed:', error)
      process.exit(1)
    })
}

module.exports = { createEssentialSchema }