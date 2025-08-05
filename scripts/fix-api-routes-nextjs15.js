const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Find all API route files that need fixing
const apiRoutesWithParams = [
  'src/app/api/reimbursements/[id]/send-email/route.ts',
  'src/app/api/reimbursements/[id]/route.ts',
  'src/app/api/payroll/batch/[id]/route.ts',
  'src/app/api/payroll/[id]/route.ts',
  'src/app/api/invoices/[id]/send-email/route.ts',
  'src/app/api/expenses/[id]/route.ts',
  'src/app/api/users/[id]/email-settings/route.ts',
  'src/app/api/employees/[id]/earnings/route.ts',
  'src/app/api/employees/[id]/deductions/route.ts',
  'src/app/api/employees/[id]/deductions/[deductionId]/route.ts',
  'src/app/api/employees/[id]/earnings/[earningId]/route.ts',
  'src/app/api/employees/[id]/route.ts',
  'src/app/api/invoices/[id]/pdf/route.ts',
  'src/app/api/invoices/[id]/route.ts',
  'src/app/api/users/[id]/route.ts',
  'src/app/api/users/[id]/permissions/route.ts',
  'src/app/api/subscriptions/[id]/generate-invoice/route.ts',
  'src/app/api/subscriptions/[id]/route.ts',
  'src/app/api/customers/[id]/route.ts'
]

function fixApiRoute(filePath) {
  console.log(`🔧 Fixing ${filePath}...`)
  
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false
  
  // Pattern 1: Single parameter { params: { id: string } }
  const singleParamPattern = /{ params }: { params: { (\w+): string } }/g
  if (content.match(singleParamPattern)) {
    content = content.replace(singleParamPattern, '{ params }: { params: Promise<{ $1: string }> }')
    modified = true
  }
  
  // Pattern 2: Multiple parameters { params: { id: string, otherId: string } }
  const multiParamPattern = /{ params }: { params: { ([^}]+) } }/g
  if (content.match(multiParamPattern)) {
    content = content.replace(multiParamPattern, (match, paramTypes) => {
      return `{ params }: { params: Promise<{ ${paramTypes} }> }`
    })
    modified = true
  }
  
  // Add await params destructuring after each function signature
  const functionPatterns = [
    /export async function (GET|POST|PUT|DELETE|PATCH)\s*\([^)]*{ params }[^)]*\)\s*{/g
  ]
  
  functionPatterns.forEach(pattern => {
    content = content.replace(pattern, (match, method, offset, string) => {
      // Check if we already have an await params line
      const nextLines = string.substring(offset + match.length, offset + match.length + 200)
      if (nextLines.includes('await params')) {
        return match // Already fixed
      }
      
      // Find what parameters we need to destructure
      const paramsMatch = match.match(/{ params }: { params: Promise<{ ([^}]+) }> }/)
      if (paramsMatch) {
        const paramTypes = paramsMatch[1]
        const paramNames = paramTypes.split(',').map(p => p.split(':')[0].trim()).join(', ')
        
        return match + `\n  try {\n    const { ${paramNames} } = await params\n`
      }
      
      return match
    })
  })
  
  // Replace direct params.id usage with destructured variables
  content = content.replace(/params\.(\w+)/g, '$1')
  
  if (modified) {
    fs.writeFileSync(filePath, content)
    console.log(`✅ Fixed ${filePath}`)
    return true
  } else {
    console.log(`⏭️ ${filePath} - no changes needed`)
    return false
  }
}

function fixAllApiRoutes() {
  console.log('🚀 Fixing all API routes for Next.js 15 compatibility...\n')
  
  let fixedCount = 0
  
  apiRoutesWithParams.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath)
    
    if (fs.existsSync(fullPath)) {
      if (fixApiRoute(fullPath)) {
        fixedCount++
      }
    } else {
      console.log(`⚠️ File not found: ${filePath}`)
    }
  })
  
  console.log(`\n🎉 Fixed ${fixedCount} API route files`)
  
  return fixedCount > 0
}

if (require.main === module) {
  const hasChanges = fixAllApiRoutes()
  
  if (hasChanges) {
    console.log('\n📝 Note: You may need to manually adjust some complex parameter destructuring')
    console.log('🔍 Please review the changes and test the build')
  }
  
  process.exit(0)
}

module.exports = { fixAllApiRoutes }