export interface AuthUser {
  id: string
  email: string
  name?: string
  role: string
  organizationId?: string
  status: string
  lastLoginAt?: Date
  createdAt: Date
}

export interface SessionData {
  userId: string
  token: string
  refreshToken?: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
}

export interface PasswordHash {
  salt: string
  hash: string
}