"use server"

import { revalidatePath } from "next/cache"

import type { ActionState } from "@/lib/actions/types"
import {
  apiApplicationTokenPrefix,
  generateApiApplicationToken,
  hashApiApplicationToken,
} from "@/lib/api/api-application-token"
import { assertAdminAction } from "@/lib/auth/require-admin"
import { prisma } from "@/lib/prisma"

export async function getApiApplications() {
  const admin = await assertAdminAction()
  if ("error" in admin) {
    return []
  }

  return prisma.apiApplication.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      description: true,
      tokenPrefix: true,
      active: true,
      lastUsedAt: true,
      revokedAt: true,
      createdAt: true,
    },
  })
}

export type CreateApiApplicationState = ActionState & {
  token?: string
  tokenPrefix?: string
}

export async function createApiApplication(
  _prevState: CreateApiApplicationState,
  formData: FormData
): Promise<CreateApiApplicationState> {
  const admin = await assertAdminAction()
  if ("error" in admin) {
    return { error: admin.error }
  }

  const name = formData.get("name")?.toString().trim() ?? ""
  const description = formData.get("description")?.toString().trim() || null

  if (!name) {
    return { error: "El nombre de la aplicación es obligatorio." }
  }

  const token = generateApiApplicationToken()
  const tokenHash = hashApiApplicationToken(token)
  const tokenPrefix = apiApplicationTokenPrefix(token)

  await prisma.apiApplication.create({
    data: {
      name,
      description,
      tokenPrefix,
      tokenHash,
      active: true,
    },
  })

  revalidatePath("/integraciones")

  return {
    success: true,
    token,
    tokenPrefix,
  }
}

export async function revokeApiApplication(applicationId: number) {
  const admin = await assertAdminAction()
  if ("error" in admin) {
    return admin
  }

  const existing = await prisma.apiApplication.findUnique({
    where: { id: applicationId },
  })

  if (!existing) {
    return { error: "Aplicación no encontrada." }
  }

  if (existing.revokedAt) {
    return { error: "Esta aplicación ya está revocada." }
  }

  await prisma.apiApplication.update({
    where: { id: applicationId },
    data: {
      active: false,
      revokedAt: new Date(),
    },
  })

  revalidatePath("/integraciones")
  return { success: true }
}

export type RotateApiApplicationTokenState = ActionState & {
  token?: string
  tokenPrefix?: string
}

export async function rotateApiApplicationToken(
  applicationId: number
): Promise<RotateApiApplicationTokenState> {
  const admin = await assertAdminAction()
  if ("error" in admin) {
    return { error: admin.error }
  }

  const existing = await prisma.apiApplication.findUnique({
    where: { id: applicationId },
  })

  if (!existing || existing.revokedAt) {
    return { error: "Aplicación no encontrada o revocada." }
  }

  const token = generateApiApplicationToken()
  const tokenHash = hashApiApplicationToken(token)
  const tokenPrefix = apiApplicationTokenPrefix(token)

  await prisma.apiApplication.update({
    where: { id: applicationId },
    data: {
      tokenHash,
      tokenPrefix,
      active: true,
    },
  })

  revalidatePath("/integraciones")

  return {
    success: true,
    token,
    tokenPrefix,
  }
}
