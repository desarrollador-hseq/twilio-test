import bcrypt from "bcryptjs"

import { prisma } from "@/lib/prisma"

export async function verifyUserCredentials(
  email: string,
  password: string
) {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return null
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)

  if (!passwordMatches) {
    return null
  }

  return {
    id: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
  }
}
