import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export async function createDemoUser() {
  try {
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@demo.com' }
    })

    if (existingUser) {
      console.log('Demo user already exists')
      return existingUser
    }

    // Create demo admin user
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    const user = await prisma.user.create({
      data: {
        name: 'Demo Admin',
        email: 'admin@demo.com',
        password: hashedPassword,
        role: 'ADMIN',
      }
    })

    return user
  } catch (error) {
    console.error('Error creating demo user:', error)
    throw error
  }
}