"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { Prisma } from "@/lib/generated/prisma/client"
import { findOrCreateArea } from "@/lib/actions/areas"
import type { ActionState } from "@/lib/actions/types"
import { normalizeAreaName } from "@/lib/areas"
import { parseEmployeesExcel } from "@/lib/employees/excel-import"
import { isValidE164Phone, normalizePhoneToE164 } from "@/lib/phone"
import { prisma } from "@/lib/prisma"

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
}

function parseEmployeeForm(formData: FormData) {
  const areaIdRaw = formData.get("areaId")?.toString().trim() ?? ""
  const areaName = formData.get("areaName")?.toString().trim() ?? ""

  return {
    firstName: formData.get("firstName")?.toString().trim() ?? "",
    lastName: formData.get("lastName")?.toString().trim() ?? "",
    nationalId: formData.get("nationalId")?.toString().trim() ?? "",
    mobilePhone: normalizePhoneToE164(
      formData.get("mobilePhone")?.toString().trim() ?? ""
    ),
    email: formData.get("email")?.toString().trim() ?? "",
    areaId: areaIdRaw ? Number(areaIdRaw) : null,
    areaName,
    active: formData.get("active") === "on",
    canSendWhatsapp: formData.get("canSendWhatsapp") === "on",
    canSendEmail: formData.get("canSendEmail") === "on",
  }
}

function validateEmployeeInput(input: ReturnType<typeof parseEmployeeForm>) {
  if (!input.firstName || !input.lastName || !input.nationalId || !input.email) {
    return "Nombres, apellidos, cédula y correo son obligatorios."
  }

  if (!input.areaId && !input.areaName) {
    return "Selecciona o escribe un área para el empleado."
  }

  if (input.areaId != null && Number.isNaN(input.areaId)) {
    return "El área seleccionada no es válida."
  }

  if (!input.email.includes("@")) {
    return "Ingresa un correo válido."
  }

  if (input.mobilePhone && !isValidE164Phone(input.mobilePhone)) {
    return "Ingresa un teléfono válido con código de país, ej: +573001234567."
  }

  if (input.canSendWhatsapp && !input.mobilePhone) {
    return "Para permitir WhatsApp debes ingresar un teléfono celular."
  }

  return null
}

async function resolveEmployeeArea(
  companyId: number,
  input: ReturnType<typeof parseEmployeeForm>
): Promise<{ areaId: number | null; error?: string }> {
  if (input.areaName) {
    const area = await findOrCreateArea(companyId, input.areaName)
    if (!area) {
      return { areaId: null, error: "No se pudo crear el área." }
    }
    return { areaId: area.id }
  }

  if (input.areaId != null) {
    const area = await prisma.area.findFirst({
      where: {
        id: input.areaId,
        companyId,
        deletedAt: null,
      },
    })
    if (!area) {
      return {
        areaId: null,
        error: "El área seleccionada no existe en esta empresa.",
      }
    }
    return { areaId: area.id }
  }

  return { areaId: null }
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
    include: {
      area: true,
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

  const areaResult = await resolveEmployeeArea(companyId, input)
  if (areaResult.error) {
    return { error: areaResult.error }
  }

  const canSendWhatsapp = Boolean(input.mobilePhone) && input.canSendWhatsapp

  try {
    await prisma.employee.create({
      data: {
        companyId,
        areaId: areaResult.areaId,
        firstName: input.firstName,
        lastName: input.lastName,
        nationalId: input.nationalId,
        mobilePhone: input.mobilePhone,
        email: input.email,
        active: input.active,
        canSendWhatsapp,
        canSendEmail: input.canSendEmail,
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

  const areaResult = await resolveEmployeeArea(companyId, input)
  if (areaResult.error) {
    return { error: areaResult.error }
  }

  const canSendWhatsapp = Boolean(input.mobilePhone) && input.canSendWhatsapp

  const unsubscribeData =
    !canSendWhatsapp && employee.canSendWhatsapp
      ? { unsubscribedAt: new Date(), unsubscribeReason: "admin" }
      : canSendWhatsapp && !employee.canSendWhatsapp
        ? { unsubscribedAt: null, unsubscribeReason: null }
        : {}

  try {
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        nationalId: input.nationalId,
        mobilePhone: input.mobilePhone,
        email: input.email,
        active: input.active,
        canSendWhatsapp,
        canSendEmail: input.canSendEmail,
        areaId: areaResult.areaId,
        ...unsubscribeData,
      },
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

export type BulkImportState = {
  error?: string
  success?: boolean
  created?: number
  skipped?: number
  areasCreated?: number
  rowErrors?: { rowNumber: number; message: string }[]
}

export async function importEmployeesFromExcel(
  companyId: number,
  _prevState: BulkImportState,
  formData: FormData
): Promise<BulkImportState> {
  const company = await ensureCompanyExists(companyId)
  if (!company) {
    return { error: "La empresa no existe o fue eliminada." }
  }

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona un archivo Excel (.xlsx)." }
  }

  const fileName = file.name.toLowerCase()
  if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
    return { error: "El archivo debe ser Excel (.xlsx o .xls)." }
  }

  const maxBytes = 5 * 1024 * 1024
  if (file.size > maxBytes) {
    return { error: "El archivo no puede superar 5 MB." }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { rows, errors: parseErrors } = parseEmployeesExcel(buffer)

  if (rows.length === 0 && parseErrors.length > 0) {
    return {
      error: parseErrors[0]?.message ?? "No se pudieron leer empleados del archivo.",
      rowErrors: parseErrors,
      created: 0,
      skipped: parseErrors.length,
      areasCreated: 0,
    }
  }

  if (rows.length === 0) {
    return { error: "No se encontraron empleados válidos en el archivo." }
  }

  const existingEmployees = await prisma.employee.findMany({
    where: { companyId, deletedAt: null },
    select: { nationalId: true },
  })
  const existingNationalIds = new Set(
    existingEmployees.map((employee) => employee.nationalId)
  )

  const existingAreas = await prisma.area.findMany({
    where: { companyId },
    select: { id: true, nameNormalized: true, deletedAt: true },
  })
  const areaCache = new Map(
    existingAreas.map((area) => [area.nameNormalized, area])
  )

  let created = 0
  let areasCreated = 0
  const rowErrors = [...parseErrors]

  for (const row of rows) {
    if (existingNationalIds.has(row.nationalId)) {
      rowErrors.push({
        rowNumber: row.rowNumber,
        message: `Ya existe un empleado con cédula ${row.nationalId}.`,
      })
      continue
    }

    try {
      const nameNormalized = normalizeAreaName(row.areaName)
      const cachedBefore = areaCache.get(nameNormalized)
      const areaExisted = Boolean(cachedBefore && !cachedBefore.deletedAt)

      const area = await findOrCreateArea(companyId, row.areaName)
      if (!area) {
        rowErrors.push({
          rowNumber: row.rowNumber,
          message: "No se pudo resolver el área.",
        })
        continue
      }

      if (!areaExisted) {
        areasCreated += 1
      }
      areaCache.set(area.nameNormalized, {
        id: area.id,
        nameNormalized: area.nameNormalized,
        deletedAt: null,
      })

      await prisma.employee.create({
        data: {
          companyId,
          areaId: area.id,
          firstName: row.firstName,
          lastName: row.lastName,
          nationalId: row.nationalId,
          mobilePhone: row.mobilePhone,
          email: row.email,
          active: true,
          canSendWhatsapp: row.canSendWhatsapp,
          canSendEmail: row.canSendEmail,
        },
      })

      existingNationalIds.add(row.nationalId)
      created += 1
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        rowErrors.push({
          rowNumber: row.rowNumber,
          message: `Ya existe un empleado con cédula ${row.nationalId}.`,
        })
        continue
      }
      rowErrors.push({
        rowNumber: row.rowNumber,
        message: "No se pudo crear el empleado.",
      })
    }
  }

  revalidatePath(`/empresas/${companyId}`)

  if (created === 0) {
    return {
      error: "No se importó ningún empleado. Revisa los errores por fila.",
      created: 0,
      skipped: rowErrors.length,
      areasCreated: 0,
      rowErrors,
    }
  }

  return {
    success: true,
    created,
    skipped: rowErrors.length,
    areasCreated,
    rowErrors: rowErrors.length > 0 ? rowErrors : undefined,
  }
}
