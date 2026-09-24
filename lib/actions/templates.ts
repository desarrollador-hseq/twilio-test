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
import {
  schemaFromPreset,
  schemaHasMediaVariable,
  serializeVariableSchema,
  TEMPLATE_VARIABLE_PRESETS,
  type TemplateVariablePreset,
} from "@/lib/messaging/template-variable-schema"
import {
  fetchTwilioContentTemplate,
  suggestTemplateSchemaFromTwilioContent,
} from "@/lib/messaging/twilio-content-schema"
import { isTwilioConfigured } from "@/lib/env"

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

  const variablePresetRaw =
    formData.get("variablePreset")?.toString().trim() || "image_greeting"
  const variablePreset = TEMPLATE_VARIABLE_PRESETS.includes(
    variablePresetRaw as TemplateVariablePreset
  )
    ? (variablePresetRaw as TemplateVariablePreset)
    : "image_greeting"

  const customVariableSchemaJson =
    formData.get("variableSchemaJson")?.toString() ?? ""

  const { schema, error: schemaError } = schemaFromPreset(
    variablePreset,
    customVariableSchemaJson
  )

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
    variableSchema: schemaError
      ? null
      : serializeVariableSchema(schema),
    variablePreset,
    schemaError,
    companyId: companyId && !Number.isNaN(companyId) ? companyId : null,
  }
}

function validateTemplateInput(input: ReturnType<typeof parseTemplateForm>) {
  if (!input.contentSid || !input.friendlyName) {
    return "Content SID y nombre son obligatorios."
  }

  if (input.schemaError) {
    return input.schemaError
  }

  if (!input.variableSchema) {
    return "Define un esquema de variables válido."
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

function templateDataFromForm(input: ReturnType<typeof parseTemplateForm>) {
  const schema = schemaFromPreset(
    input.variablePreset,
    input.variablePreset === "custom" ? input.variableSchema : null
  ).schema
  const hasMedia = schemaHasMediaVariable(schema)

  return {
    contentSid: input.contentSid,
    friendlyName: input.friendlyName,
    language: input.language,
    category: input.category,
    type: input.type,
    status: input.status,
    variableSchema: input.variableSchema,
    mediaBaseUrl: hasMedia ? input.mediaBaseUrl : null,
    mediaFileName: hasMedia ? input.mediaFileName : null,
    companyId: input.companyId,
  }
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
    const template = await prisma.template.create({
      data: templateDataFromForm(input),
    })
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
      data: templateDataFromForm(input),
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

export type ImportTwilioSchemaResult = {
  error?: string
  preset?: TemplateVariablePreset
  variableSchemaJson?: string
  friendlyName?: string
  language?: string
  hint?: string
}

export async function importTemplateSchemaFromTwilio(
  contentSid: string
): Promise<ImportTwilioSchemaResult> {
  if (!isTwilioConfigured()) {
    return {
      error: "Twilio no está configurado. Revisa las variables de entorno.",
    }
  }

  const sid = contentSid.trim()
  if (!sid) {
    return { error: "Indica un Content SID." }
  }

  try {
    const content = await fetchTwilioContentTemplate(sid)
    const suggestion = suggestTemplateSchemaFromTwilioContent(content)
    return {
      preset: suggestion.preset,
      variableSchemaJson: suggestion.variableSchemaJson,
      friendlyName: suggestion.friendlyName,
      language: suggestion.language,
      hint: suggestion.hint,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo consultar la plantilla en Twilio.",
    }
  }
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
