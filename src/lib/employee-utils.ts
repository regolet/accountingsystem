import { prisma } from '@/lib/prisma'

export async function generateNextEmployeeId(): Promise<string> {
  try {
    // Get the settings for employee ID configuration
    const settings = await prisma.settings.findFirst()
    
    if (!settings) {
      // Fallback to defaults if no settings exist
      const prefix = 'EMP-'
      const length = 4
      const startNumber = 1
      return `${prefix}${String(startNumber).padStart(length, '0')}`
    }

    // Get the highest existing employee number
    const employees = await prisma.employee.findMany({
      where: {
        employeeId: {
          startsWith: settings.employeePrefix
        }
      },
      select: {
        employeeId: true
      },
      orderBy: {
        employeeId: 'desc'
      }
    })

    let nextNumber = settings.employeeStartNumber

    if (employees.length > 0) {
      // Extract the numeric part from the latest employee ID
      const latestId = employees[0].employeeId
      const numericPart = latestId.replace(settings.employeePrefix, '')
      const latestNumber = parseInt(numericPart, 10)
      
      if (!isNaN(latestNumber)) {
        nextNumber = latestNumber + 1
      }
    }

    // Generate the new employee ID
    const paddedNumber = String(nextNumber).padStart(settings.employeeIdLength, '0')
    return `${settings.employeePrefix}${paddedNumber}`
    
  } catch (error) {
    console.error('Error generating employee ID:', error)
    // Fallback to a simple format if there's an error
    const timestamp = Date.now().toString().slice(-4)
    return `EMP-${timestamp}`
  }
}

export async function validateEmployeeId(employeeId: string, excludeId?: string): Promise<boolean> {
  try {
    const existing = await prisma.employee.findUnique({
      where: { employeeId },
      select: { id: true }
    })

    if (!existing) {
      return true // ID is available
    }

    // If we're excluding a specific employee (for updates), check if it's the same one
    if (excludeId && existing.id === excludeId) {
      return true
    }

    return false // ID is already taken
  } catch (error) {
    console.error('Error validating employee ID:', error)
    return false
  }
}