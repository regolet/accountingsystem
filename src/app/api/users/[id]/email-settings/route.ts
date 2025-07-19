import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { simpleEncrypt, simpleDecrypt } from '@/lib/encryption'
import { z } from 'zod'


// Add a simple test endpoint
export async function OPTIONS() {
  return NextResponse.json({ message: 'OPTIONS working' })
}

// Simple debug POST endpoint
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ message: 'PATCH working', id: params.id })
}

const emailSettingsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.number().min(1).max(65535).optional(),
  smtpUser: z.string().email().optional(),
  smtpPass: z.string().optional(),
  smtpFromName: z.string().optional(),
  smtpEnabled: z.boolean().optional(),
})

// GET user email settings
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Users can only access their own settings, or admins can access any
    if (session.user.id !== id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPass: true,
        smtpFromName: true,
        smtpEnabled: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      emailSettings: {
        smtpHost: user.smtpHost,
        smtpPort: user.smtpPort,
        smtpUser: user.smtpUser,
        smtpFromName: user.smtpFromName,
        smtpEnabled: user.smtpEnabled,
        hasPassword: !!user.smtpPass, // Indicate if password is set without revealing it
      }
    })
  } catch (error) {
    console.error('Error fetching email settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT update user email settings
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Users can only update their own settings, or admins can update any
    if (session.user.id !== id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = emailSettingsSchema.parse(body)

    // Prepare update data
    const updateData: {
      smtpHost?: string;
      smtpPort?: number;
      smtpUser?: string;
      smtpFromName?: string;
      smtpEnabled?: boolean;
      smtpPass?: string;
    } = {}

    if (validatedData.smtpHost !== undefined) {
      updateData.smtpHost = validatedData.smtpHost
    }

    if (validatedData.smtpPort !== undefined) {
      updateData.smtpPort = validatedData.smtpPort
    }

    if (validatedData.smtpUser !== undefined) {
      updateData.smtpUser = validatedData.smtpUser
    }

    if (validatedData.smtpFromName !== undefined) {
      updateData.smtpFromName = validatedData.smtpFromName
    }

    if (validatedData.smtpEnabled !== undefined) {
      updateData.smtpEnabled = validatedData.smtpEnabled
    }

    // Encrypt password if provided
    if (validatedData.smtpPass) {
      updateData.smtpPass = simpleEncrypt(validatedData.smtpPass)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPass: true,
        smtpFromName: true,
        smtpEnabled: true,
      },
    })

    return NextResponse.json({
      message: 'Email settings updated successfully',
      emailSettings: {
        smtpHost: user.smtpHost,
        smtpPort: user.smtpPort,
        smtpUser: user.smtpUser,
        smtpFromName: user.smtpFromName,
        smtpEnabled: user.smtpEnabled,
        hasPassword: !!updateData.smtpPass || !!user.smtpPass,
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating email settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Test email settings
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Users can only test their own settings, or admins can test any
    if (session.user.id !== id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if user has email settings configured
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        email: true, // Get user email from database
        smtpEnabled: true,
        smtpUser: true,
        smtpPass: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.smtpEnabled) {
      return NextResponse.json({ 
        error: 'Email sending is not enabled. Please enable email sending in your account settings first.',
        code: 'EMAIL_NOT_ENABLED'
      }, { status: 400 })
    }

    if (!user.smtpUser || !user.smtpPass) {
      return NextResponse.json({ 
        error: 'Email settings are incomplete. Please configure your Gmail email and app password in account settings.',
        code: 'EMAIL_NOT_CONFIGURED'
      }, { status: 400 })
    }

    // Use database email as primary, fallback to session email
    const recipientEmail = user.email || session.user.email
    if (!recipientEmail) {
      return NextResponse.json({ 
        error: 'No email address found to send test email to' 
      }, { status: 400 })
    }

    const { sendEmail } = await import('@/lib/email')


    try {
      // Send test email
      const success = await sendEmail({
        to: recipientEmail,
        subject: 'Test Email - SMTP Configuration',
        html: `
          <h2>SMTP Configuration Test</h2>
          <p>This is a test email to verify your SMTP settings are working correctly.</p>
          <p>If you received this email, your configuration is successful!</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        `,
      }, id)

      if (success) {
        return NextResponse.json({ 
          message: 'Test email sent successfully',
          recipient: recipientEmail 
        })
      } else {
        return NextResponse.json({ 
          error: 'Failed to send test email. Common issues: incorrect Gmail app password, invalid SMTP settings, or email blocked by provider. Please verify your Gmail app password is correct.',
          code: 'EMAIL_SEND_FAILED'
        }, { status: 400 })
      }
    } catch (emailError) {
      console.error('Test email error:', emailError)
      return NextResponse.json({ 
        error: `Email test failed: ${(emailError as Error).message}. Please check your Gmail app password and SMTP settings.`,
        code: 'EMAIL_TEST_ERROR'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json({ 
      error: 'Email test failed due to server error. Please try again.',
      code: 'SERVER_ERROR'
    }, { status: 500 })
  }
}