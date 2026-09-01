import bcrypt from 'bcrypt'

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12

export const hashPassword = async (plainPassword: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  return bcrypt.hash(plainPassword, salt)
}

export const verifyPassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword)
}