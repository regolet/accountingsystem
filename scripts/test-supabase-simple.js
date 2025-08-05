const { createClient } = require('@supabase/supabase-js')

// Test with Supabase client instead of direct postgres
const supabaseUrl = 'https://awyialxihfqfwdukxphx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eWlhbHhpaGZxZndkdWt4cGh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTEyODcsImV4cCI6MjA2OTk4NzI4N30.KhX_tDSmDEJp3DXAEexY-P1mTBN_Rfd4j2BoDehxhz4'

async function testSupabaseAPI() {
  console.log('🔌 Testing Supabase REST API connection...')
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    if (error) {
      console.log('⚠️ API Error (expected for empty DB):', error.message)
      if (error.message.includes('relation "users" does not exist')) {
        console.log('✅ Connection works! Database is empty (no tables yet)')
        return true
      }
      return false
    } else {
      console.log('✅ Connection successful! Found data:', data)
      return true
    }
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    return false
  }
}

if (require.main === module) {
  testSupabaseAPI()
    .then((success) => {
      console.log(success ? '🎉 Supabase is accessible!' : '❌ Supabase is not accessible')
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('❌ Test failed:', error)
      process.exit(1)
    })
}