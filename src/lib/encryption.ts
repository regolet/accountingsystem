import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.NEXTAUTH_SECRET || 'fallback-encryption-key-32-chars-long'
const ALGORITHM = 'aes-256-gcm'

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Encryption error:', error)
    return text // Return unencrypted if encryption fails
  }
}

export function decrypt(encryptedText: string): string {
  try {
    if (!encryptedText.includes(':')) {
      // Not encrypted, return as-is
      return encryptedText
    }
    
    const parts = encryptedText.split(':')
    if (parts.length !== 2) {
      return encryptedText
    }
    
    const encrypted = parts[1]
    
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    return encryptedText // Return as-is if decryption fails
  }
}

// Simple encryption for production use
export function simpleEncrypt(text: string): string {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Simple encryption error:', error)
    return Buffer.from(text).toString('base64') // Fallback to base64
  }
}

export function simpleDecrypt(encryptedText: string): string {
  try {
    if (!encryptedText.includes(':')) {
      // Try base64 decode as fallback
      try {
        return Buffer.from(encryptedText, 'base64').toString('utf8')
      } catch {
        return encryptedText
      }
    }
    
    const parts = encryptedText.split(':')
    if (parts.length !== 2) {
      return encryptedText
    }
    
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Simple decryption error:', error)
    return encryptedText
  }
}