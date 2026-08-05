import { PrismaClient } from "@/lib/generated/prisma/client"
import { getDatabaseUrl } from "@/lib/database-url"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    datasourceUrl: getDatabaseUrl(),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma

  if (cached && typeof cached.user?.findUnique === "function") {
    return cached
  }

  const client = createPrismaClient()
  globalForPrisma.prisma = client
  return client
}

export const prisma = getPrismaClient()
