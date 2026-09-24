"use server"

import { revalidatePath } from "next/cache"
import { Prisma } from "@/lib/generated/prisma/client"
import { displayAreaName, normalizeAreaName } from "@/lib/areas"
import type { ActionState } from "@/lib/actions/types"
import { prisma } from "@/lib/prisma"

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
}

async function ensureCompanyExists(companyId: number) {
  return prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
  })
}

export async function getCompanyAreas(companyId: number) {
  return prisma.area.findMany({
    where: {
      companyId,
      deletedAt: null,
      company: { deletedAt: null },
    },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          employees: {
            where: { deletedAt: null },
          },
        },
      },
    },
  })
}

/**
 * Busca un área por nombre (lowercase) en la empresa.
 * Si no existe, la crea. Si estaba soft-deleted, la restaura.
 */
export async function findOrCreateArea(companyId: number, rawName: string) {
  const name = displayAreaName(rawName)
  const nameNormalized = normalizeAreaName(rawName)

  if (!nameNormalized) {
    return null
  }

  const existing = await prisma.area.findUnique({
    where: {
      companyId_nameNormalized: { companyId, nameNormalized },
    },
  })

  if (existing) {
    if (existing.deletedAt) {
      return prisma.area.update({
        where: { id: existing.id },
        data: { deletedAt: null, name },
      })
    }
    return existing
  }

  return prisma.area.create({
    data: { companyId, name, nameNormalized },
  })
}

export async function createArea(
  companyId: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const company = await ensureCompanyExists(companyId)
  if (!company) {
    return { error: "La empresa no existe o fue eliminada." }
  }

  const rawName = formData.get("name")?.toString() ?? ""
  const name = displayAreaName(rawName)
  const nameNormalized = normalizeAreaName(rawName)

  if (!nameNormalized) {
    return { error: "El nombre del área es obligatorio." }
  }

  try {
    const existing = await prisma.area.findUnique({
      where: {
        companyId_nameNormalized: { companyId, nameNormalized },
      },
    })

    if (existing && !existing.deletedAt) {
      return { error: "Ya existe un área con ese nombre en esta empresa." }
    }

    if (existing?.deletedAt) {
      await prisma.area.update({
        where: { id: existing.id },
        data: { deletedAt: null, name },
      })
    } else {
      await prisma.area.create({
        data: { companyId, name, nameNormalized },
      })
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Ya existe un área con ese nombre en esta empresa." }
    }
    return { error: "No se pudo crear el área." }
  }

  revalidatePath(`/empresas/${companyId}`)
  revalidatePath(`/empresas/${companyId}/editar`)
  return { success: true }
}

export async function updateArea(
  companyId: number,
  areaId: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const area = await prisma.area.findFirst({
    where: {
      id: areaId,
      companyId,
      deletedAt: null,
      company: { deletedAt: null },
    },
  })

  if (!area) {
    return { error: "El área no existe o fue eliminada." }
  }

  const rawName = formData.get("name")?.toString() ?? ""
  const name = displayAreaName(rawName)
  const nameNormalized = normalizeAreaName(rawName)

  if (!nameNormalized) {
    return { error: "El nombre del área es obligatorio." }
  }

  try {
    await prisma.area.update({
      where: { id: areaId },
      data: { name, nameNormalized },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Ya existe otra área con ese nombre en esta empresa." }
    }
    return { error: "No se pudo actualizar el área." }
  }

  revalidatePath(`/empresas/${companyId}`)
  revalidatePath(`/empresas/${companyId}/editar`)
  return { success: true }
}

export async function deleteArea(companyId: number, areaId: number) {
  const area = await prisma.area.findFirst({
    where: {
      id: areaId,
      companyId,
      deletedAt: null,
      company: { deletedAt: null },
    },
    include: {
      _count: {
        select: {
          employees: {
            where: { deletedAt: null },
          },
        },
      },
    },
  })

  if (!area) {
    return { error: "El área no existe o ya fue eliminada." }
  }

  if (area._count.employees > 0) {
    return {
      error: `No se puede eliminar: tiene ${area._count.employees} empleado${area._count.employees === 1 ? "" : "s"} asignado${area._count.employees === 1 ? "" : "s"}.`,
    }
  }

  await prisma.area.update({
    where: { id: areaId },
    data: { deletedAt: new Date() },
  })

  revalidatePath(`/empresas/${companyId}`)
  revalidatePath(`/empresas/${companyId}/editar`)
  return { success: true }
}
