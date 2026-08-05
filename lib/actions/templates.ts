"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { Prisma } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import type { ActionState } from "@/lib/actions/types"
import { TEMPLATE_STATUSES, TEMPLATE_TYPES } from "@/lib/messaging/constants"
import {
  normalizeMediaBaseUrl,
  normalizeMediaFileName,
} from "@/lib/messaging/content-variables"

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
}

function parseTemplateForm(formData: FormData) {
  const companyIdRaw = formData.get("companyId")?.toString().trim()
  const companyId =
    companyIdRaw && companyIdRaw !== "none" ? Number(companyIdRaw) : null

  const mediaBaseUrl = (() => {
    const raw = formData.get("mediaBaseUrl")?.toString().trim()
    return raw ? normalizeMediaBaseUrl(raw) : null
  })()

  const mediaFileNameRaw =
    formData.get("mediaFileName")?.toString().trim() || null

  return {
    contentSid: formData.get("contentSid")?.toString().trim() ?? "",
    friendlyName: formData.get("friendlyName")?.toString().trim() ?? "",
    language: formData.get("language")?.toString().trim() || "es",
    category: formData.get("category")?.toString().trim() || null,
    type: formData.get("type")?.toString().trim() || "whatsapp",
    status: formData.get("status")?.toString().trim() || "approved",
    mediaBaseUrl,
    mediaFileName: mediaFileNameRaw
      ? normalizeMediaFileName(mediaFileNameRaw, mediaBaseUrl)
      : null,
    companyId: companyId && !Number.isNaN(companyId) ? companyId : null,
  }
}

function validateTemplateInput(input: ReturnType<typeof parseTemplateForm>) {
  if (!input.contentSid || !input.friendlyName) {
    return "Content SID y nombre son obligatorios."
  }

  if (!TEMPLATE_TYPES.includes(input.type as (typeof TEMPLATE_TYPES)[number])) {
    return "Tipo de plantilla inválido."
  }

  if (
    !TEMPLATE_STATUSES.includes(
      input.status as (typeof TEMPLATE_STATUSES)[number]
    )
  ) {
    return "Estado de plantilla inválido."
  }

  return null
}

export async function getTemplates() {
  return prisma.template.findMany({
    where: { deletedAt: null },
    orderBy: { friendlyName: "asc" },
    include: {
      company: true,
      _count: {
        select: {
          campaigns: { where: { deletedAt: null } },
        },
      },
    },
  })
}

export async function getApprovedTemplates(companyId?: number) {
  return prisma.template.findMany({
    where: {
      deletedAt: null,
      status: "approved",
      type: "whatsapp",
      ...(companyId
        ? { OR: [{ companyId: null }, { companyId }] }
        : {}),
    },
    orderBy: { friendlyName: "asc" },
  })
}

export async function getTemplate(id: number) {
  return prisma.template.findFirst({
    where: { id, deletedAt: null },
    include: { company: true },
  })
}

export async function createTemplate(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const input = parseTemplateForm(formData)
  const validationError = validateTemplateInput(input)
  if (validationError) {
    return { error: validationError }
  }

  let templateId: number

  try {
    const template = await prisma.template.create({ data: input })
    templateId = template.id
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Ya existe una plantilla con ese Content SID." }
    }
    return { error: "No se pudo registrar la plantilla." }
  }

  revalidatePath("/plantillas")
  redirect(`/plantillas/${templateId}`)
}

export async function updateTemplate(
  templateId: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const existing = await getTemplate(templateId)
  if (!existing) {
    return { error: "La plantilla no existe o fue eliminada." }
  }

  const input = parseTemplateForm(formData)
  const validationError = validateTemplateInput(input)
  if (validationError) {
    return { error: validationError }
  }

  try {
    await prisma.template.update({
      where: { id: templateId },
      data: input,
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Ya existe otra plantilla con ese Content SID." }
    }
    return { error: "No se pudo actualizar la plantilla." }
  }

  revalidatePath("/plantillas")
  revalidatePath(`/plantillas/${templateId}`)
  redirect(`/plantillas/${templateId}`)
}

export async function deleteTemplate(templateId: number) {
  const existing = await getTemplate(templateId)
  if (!existing) {
    return { error: "La plantilla no existe o ya fue eliminada." }
  }

  await prisma.template.update({
    where: { id: templateId },
    data: { deletedAt: new Date() },
  })

  revalidatePath("/plantillas")
  redirect("/plantillas")
}
