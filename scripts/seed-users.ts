import "dotenv/config"
import bcrypt from "bcryptjs"

import { PrismaClient } from "@/lib/generated/prisma/client"
import { getDatabaseUrl } from "@/lib/database-url"

const prisma = new PrismaClient({
  datasourceUrl: getDatabaseUrl(),
})

const defaultUsers = [
  {
    email: "desarrollador@grupohseq.com",
    name: "Administrador",
    password: "desarrollador123.",
    role: "ADMIN" as const,
  },
  {
    email: "consultor@grupohseq.com",
    name: "Consultor",
    password: "consultor123",
    role: "USER" as const,
  },
]

async function main() {
  for (const user of defaultUsers) {
    const passwordHash = await bcrypt.hash(user.password, 12)

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
      },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        role: user.role,
      },
    })

    console.log(`Usuario listo: ${user.email} (${user.role})`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
