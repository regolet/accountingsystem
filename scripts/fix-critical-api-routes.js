const fs = require('fs')
const path = require('path')

// Critical API routes that are likely causing build failures
const criticalRoutes = [
  'src/app/api/customers/[id]/route.ts',
  'src/app/api/invoices/[id]/route.ts',
  'src/app/api/employees/[id]/route.ts',
  'src/app/api/users/[id]/route.ts',
  'src/app/api/expenses/[id]/route.ts'
]

function fixRoute(filePath) {
  console.log(`🔧 Fixing ${filePath}...`)
  
  const fullPath = path.join(__dirname, '..', filePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ File not found: ${filePath}`)
    return false
  }
  
  let content = fs.readFileSync(fullPath, 'utf8')
  let modified = false
  
  // Fix the params type from { id: string } to Promise<{ id: string }>
  const oldPattern = /{ params }: { params: { id: string } }/g
  if (content.includes('{ params }: { params: { id: string } }')) {
    content = content.replace(oldPattern, '{ params }: { params: Promise<{ id: string }> }')
    modified = true
  }
  
  // Add await params destructuring at the start of each function
  const functionStarts = [
    'export async function GET(',
    'export async function POST(',
    'export async function PUT(',
    'export async function DELETE(',
    'export async function PATCH('
  ]
  
  functionStarts.forEach(funcStart => {
    const funcIndex = content.indexOf(funcStart)
    if (funcIndex !== -1) {
      // Find the opening brace of the function
      const openBraceIndex = content.indexOf('{', funcIndex + funcStart.length)
      if (openBraceIndex !== -1) {
        // Find the first try block or first line of code
        const afterBrace = content.substring(openBraceIndex + 1)
        const tryIndex = afterBrace.indexOf('try {')
        
        if (tryIndex !== -1 && tryIndex < 50) { // Only if try is very close to function start
          // Insert await params before the try block
          const insertPoint = openBraceIndex + 1 + tryIndex
          if (!content.substring(insertPoint - 100, insertPoint + 100).includes('await params')) {
            const insertion = '\n  const { id } = await params\n\n  '
            content = content.substring(0, insertPoint) + insertion + content.substring(insertPoint)
            modified = true
          }
        }
      }
    }
  })
  
  // Replace params.id with just id throughout the file
  if (content.includes('params.id')) {
    content = content.replace(/params\.id/g, 'id')
    modified = true
  }
  
  if (modified) {
    fs.writeFileSync(fullPath, content)
    console.log(`✅ Fixed ${filePath}`)
    return true
  } else {
    console.log(`⏭️ ${filePath} - no changes needed`)
    return false
  }
}

function fixCriticalRoutes() {
  console.log('🚀 Fixing critical API routes for Next.js 15...\n')
  
  let fixedCount = 0
  
  criticalRoutes.forEach(route => {
    if (fixRoute(route)) {
      fixedCount++
    }
  })
  
  console.log(`\n🎉 Fixed ${fixedCount} critical API routes`)
  return fixedCount > 0
}

if (require.main === module) {
  fixCriticalRoutes()
}

module.exports = { fixCriticalRoutes }