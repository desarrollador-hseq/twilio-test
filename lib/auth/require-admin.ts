import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

export async function requireAdminSession() {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    redirect("/")
  }

  return session
}

export async function assertAdminAction() {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: "Solo administradores pueden realizar esta acción." } as const
  }

  return { session } as const
}
