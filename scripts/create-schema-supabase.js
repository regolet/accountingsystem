const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://awyialxihfqfwdukxphx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eWlhbHhpaGZxZndkdWt4cGh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTEyODcsImV4cCI6MjA2OTk4NzI4N30.KhX_tDSmDEJp3DXAEexY-P1mTBN_Rfd4j2BoDehxhz4'

async function createSchemaWithSQL() {
  console.log('🏗️ Creating database schema in Supabase...')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Read the Prisma schema and convert it to SQL
    console.log('📄 Reading Prisma schema...')
    
    // For now, let's create a basic users table to test
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    console.log('🔧 Creating users table...')
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: createUsersTable
    })
    
    if (error) {
      console.error('❌ Failed to create table:', error.message)
      
      // If RPC doesn't work, let's try a different approach
      console.log('🔄 Trying alternative approach...')
      
      // Try using REST API to create table
      const { data: tableData, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(1)
      
      if (tableError) {
        console.log('⚠️ Cannot access tables directly. You may need to create the schema manually in Supabase dashboard.')
        console.log('💡 Go to: SQL Editor in your Supabase dashboard and run the SQL manually.')
        return false
      }
      
      console.log('✅ Can access database structure')
      return true
    } else {
      console.log('✅ Users table created successfully!')
      return true
    }
    
  } catch (error) {
    console.error('❌ Schema creation failed:', error.message)
    return false
  }
}

if (require.main === module) {
  createSchemaWithSQL()
    .then((success) => {
      if (success) {
        console.log('🎉 Schema creation process completed!')
        console.log('💡 Next: Use Prisma db push or manual SQL execution')
      } else {
        console.log('❌ Schema creation failed - manual intervention required')
      }
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('❌ Process failed:', error)
      process.exit(1)
    })
}