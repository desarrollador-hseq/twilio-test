import path from "node:path"

const prismaDir = path.join(process.cwd(), "prisma")

export function getDatabaseUrl() {
  const configured = process.env.DATABASE_URL ?? "file:./dev.db"

  if (!configured.startsWith("file:")) {
    return configured
  }

  const relativePath = configured.slice("file:".length)
  // SQLite paths in schema.prisma are relative to the prisma/ folder.
  return `file:${path.resolve(prismaDir, relativePath)}`
}
