"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { Prisma } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import type { ActionState } from "@/lib/actions/types"

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
}

export async function getCompanies() {
  return prisma.company.findMany({
    where: { deletedAt: null },
    orderBy: { legalName: "asc" },
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

export async function getCompany(id: number) {
  return prisma.company.findFirst({
    where: { id, deletedAt: null },
    include: {
      employees: {
        where: { deletedAt: null },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        include: {
          area: true,
        },
      },
      areas: {
        where: { deletedAt: null },
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
      },
    },
  })
}

export async function createCompany(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const legalName = formData.get("legalName")?.toString().trim()
  const taxId = formData.get("taxId")?.toString().trim()

  if (!legalName || !taxId) {
    return { error: "Razón social y NIT son obligatorios." }
  }

  let companyId: number

  try {
    const company = await prisma.company.create({
      data: { legalName, taxId },
    })
    companyId = company.id
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Ya existe una empresa con ese NIT." }
    }
    return { error: "No se pudo crear la empresa." }
  }

  revalidatePath("/empresas")
  redirect(`/empresas/${companyId}`)
}

export async function updateCompany(
  companyId: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const legalName = formData.get("legalName")?.toString().trim()
  const taxId = formData.get("taxId")?.toString().trim()

  if (!legalName || !taxId) {
    return { error: "Razón social y NIT son obligatorios." }
  }

  const existing = await prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
  })

  if (!existing) {
    return { error: "La empresa no existe o fue eliminada." }
  }

  try {
    await prisma.company.update({
      where: { id: companyId },
      data: { legalName, taxId },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Ya existe otra empresa con ese NIT." }
    }
    return { error: "No se pudo actualizar la empresa." }
  }

  revalidatePath("/empresas")
  revalidatePath(`/empresas/${companyId}`)
  redirect(`/empresas/${companyId}`)
}

export async function deleteCompany(companyId: number) {
  const existing = await prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
  })

  if (!existing) {
    return { error: "La empresa no existe o ya fue eliminada." }
  }

  const now = new Date()

  await prisma.$transaction([
    prisma.company.update({
      where: { id: companyId },
      data: { deletedAt: now },
    }),
    prisma.employee.updateMany({
      where: { companyId, deletedAt: null },
      data: { deletedAt: now },
    }),
    prisma.area.updateMany({
      where: { companyId, deletedAt: null },
      data: { deletedAt: now },
    }),
  ])

  revalidatePath("/empresas")
  redirect("/empresas")
}
