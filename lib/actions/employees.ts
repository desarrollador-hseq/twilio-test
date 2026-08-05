"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { Prisma } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import type { ActionState } from "@/lib/actions/types"
import { isValidE164Phone, normalizePhoneToE164 } from "@/lib/phone"

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
}

function parseEmployeeForm(formData: FormData) {
  return {
    firstName: formData.get("firstName")?.toString().trim() ?? "",
    lastName: formData.get("lastName")?.toString().trim() ?? "",
    nationalId: formData.get("nationalId")?.toString().trim() ?? "",
    mobilePhone: normalizePhoneToE164(
      formData.get("mobilePhone")?.toString().trim() ?? ""
    ),
    email: formData.get("email")?.toString().trim() ?? "",
    active: formData.get("active") === "on",
    canSendWhatsapp: formData.get("canSendWhatsapp") === "on",
    canSendEmail: formData.get("canSendEmail") === "on",
  }
}

function validateEmployeeInput(input: ReturnType<typeof parseEmployeeForm>) {
  if (
    !input.firstName ||
    !input.lastName ||
    !input.nationalId ||
    !input.mobilePhone ||
    !input.email
  ) {
    return "Todos los campos del empleado son obligatorios."
  }

  if (!input.email.includes("@")) {
    return "Ingresa un correo válido."
  }

  if (!isValidE164Phone(input.mobilePhone)) {
    return "Ingresa un teléfono válido con código de país, ej: +573001234567."
  }

  return null
}

async function ensureCompanyExists(companyId: number) {
  return prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
  })
}

export async function getEmployee(companyId: number, employeeId: number) {
  return prisma.employee.findFirst({
    where: {
      id: employeeId,
      companyId,
      deletedAt: null,
      company: { deletedAt: null },
    },
  })
}

export async function createEmployee(
  companyId: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const company = await ensureCompanyExists(companyId)
  if (!company) {
    return { error: "La empresa no existe o fue eliminada." }
  }

  const input = parseEmployeeForm(formData)
  const validationError = validateEmployeeInput(input)
  if (validationError) {
    return { error: validationError }
  }

  try {
    await prisma.employee.create({
      data: {
        companyId,
        ...input,
      },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Ya existe un empleado con esa cédula en esta empresa." }
    }
    return { error: "No se pudo registrar el empleado." }
  }

  revalidatePath(`/empresas/${companyId}`)
  redirect(`/empresas/${companyId}`)
}

export async function updateEmployee(
  companyId: number,
  employeeId: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const employee = await getEmployee(companyId, employeeId)
  if (!employee) {
    return { error: "El empleado no existe o fue eliminado." }
  }

  const input = parseEmployeeForm(formData)
  const validationError = validateEmployeeInput(input)
  if (validationError) {
    return { error: validationError }
  }

  const unsubscribeData =
    !input.canSendWhatsapp && employee.canSendWhatsapp
      ? { unsubscribedAt: new Date(), unsubscribeReason: "admin" }
      : input.canSendWhatsapp && !employee.canSendWhatsapp
        ? { unsubscribedAt: null, unsubscribeReason: null }
        : {}

  try {
    await prisma.employee.update({
      where: { id: employeeId },
      data: { ...input, ...unsubscribeData },
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Ya existe otro empleado con esa cédula en esta empresa." }
    }
    return { error: "No se pudo actualizar el empleado." }
  }

  revalidatePath(`/empresas/${companyId}`)
  redirect(`/empresas/${companyId}`)
}

export async function toggleEmployeeActive(
  companyId: number,
  employeeId: number,
  active: boolean
) {
  const employee = await getEmployee(companyId, employeeId)
  if (!employee) {
    return { error: "El empleado no existe o fue eliminado." }
  }

  await prisma.employee.update({
    where: { id: employeeId },
    data: { active },
  })

  revalidatePath(`/empresas/${companyId}`)
  return { success: true }
}

export async function deleteEmployee(companyId: number, employeeId: number) {
  const employee = await getEmployee(companyId, employeeId)
  if (!employee) {
    return { error: "El empleado no existe o fue eliminado." }
  }

  await prisma.employee.update({
    where: { id: employeeId },
    data: { deletedAt: new Date() },
  })

  revalidatePath(`/empresas/${companyId}`)
  return { success: true }
}
