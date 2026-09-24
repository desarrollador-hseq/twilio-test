import { getSpacesCdnUrl } from "@/lib/env"
import type { TemplateVariableDef } from "@/lib/messaging/template-variable-schema"
import {
  enrichSchemaWithLegacyTemplateMedia,
  resolveTemplateVariableSchema,
} from "@/lib/messaging/template-variable-schema"

/** Carpeta en el CDN usada en la Media URL de Twilio (prefijo + {{n}}). */
export const DEFAULT_MEDIA_CDN_FOLDER = "ws"

export const DEFAULT_MEDIA_BASE_URL = `${getSpacesCdnUrl().replace(/\/$/, "")}/${DEFAULT_MEDIA_CDN_FOLDER}/`

function isAbsoluteMediaUrl(value: string) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:")
  )
}

/** @deprecated Usa DEFAULT_MEDIA_BASE_URL */
export const MEDIA_CDN_BASE_URL = DEFAULT_MEDIA_BASE_URL

export type MessageRecipientContext = {
  firstName: string
  lastName: string
  email: string
  areaName?: string | null
  companyLegalName: string
}

export type MediaSource = "campaign" | "template"

export function normalizeMediaBaseUrl(baseUrl?: string | null) {
  const value = baseUrl?.trim() || DEFAULT_MEDIA_BASE_URL
  return value.endsWith("/") ? value : `${value}/`
}

export function resolveMediaBaseUrl(templateMediaBaseUrl?: string | null) {
  const value = templateMediaBaseUrl?.trim()
  return normalizeMediaBaseUrl(value || DEFAULT_MEDIA_BASE_URL)
}

export function normalizeMediaFileName(
  fileName?: string | null,
  mediaBaseUrl?: string | null
) {
  const value = fileName?.trim()
  if (!value) {
    return null
  }

  const baseUrl = resolveMediaBaseUrl(mediaBaseUrl)

  if (value.startsWith("http://") || value.startsWith("https://")) {
    if (value.startsWith(baseUrl)) {
      return value.slice(baseUrl.length)
    }

    try {
      const url = new URL(value)
      const base = new URL(baseUrl)

      if (url.origin === base.origin) {
        const basePath = base.pathname.replace(/\/$/, "")
        if (basePath && url.pathname.startsWith(`${basePath}/`)) {
          return url.pathname.slice(basePath.length + 1)
        }
      }

      const segments = url.pathname.split("/").filter(Boolean)
      return segments.at(-1) ?? value
    } catch {
      return value
    }
  }

  if (value.startsWith(baseUrl)) {
    return value.slice(baseUrl.length)
  }

  return value
}

export function buildMediaUrl(
  mediaFileName?: string | null,
  mediaBaseUrl?: string | null
) {
  const value = mediaFileName?.trim()
  if (!value) {
    return null
  }

  if (isAbsoluteMediaUrl(value)) {
    return value
  }

  const fileName = normalizeMediaFileName(value, mediaBaseUrl)
  if (!fileName) {
    return null
  }

  return `${resolveMediaBaseUrl(mediaBaseUrl)}${fileName}`
}

export function resolveMediaSource(
  campaignMediaFileName?: string | null,
  templateMediaFileName?: string | null,
  mediaBaseUrl?: string | null
): { fileName: string | null; source: MediaSource | null } {
  const campaignValue = campaignMediaFileName?.trim()
  if (campaignValue) {
    if (isAbsoluteMediaUrl(campaignValue)) {
      return { fileName: campaignValue, source: "campaign" }
    }

    const campaignFileName = normalizeMediaFileName(
      campaignMediaFileName,
      mediaBaseUrl
    )
    if (campaignFileName) {
      return { fileName: campaignFileName, source: "campaign" }
    }
  }

  const templateFileName = normalizeMediaFileName(
    templateMediaFileName,
    mediaBaseUrl
  )
  if (templateFileName) {
    return { fileName: templateFileName, source: "template" }
  }

  return { fileName: null, source: null }
}

export type BuildContentVariablesContext = {
  campaignStaticVars?: Record<string, string> | null
  /** Archivo subido en campaña; aplica a variables media del esquema */
  campaignMediaFileName?: string | null
  templateMediaBaseUrl?: string | null
  templateMediaFileName?: string | null
}

export function resolveMediaFileName(
  campaignMediaFileName?: string | null,
  templateMediaFileName?: string | null,
  mediaBaseUrl?: string | null
) {
  return (
    normalizeMediaFileName(campaignMediaFileName, mediaBaseUrl) ||
    normalizeMediaFileName(templateMediaFileName, mediaBaseUrl)
  )
}

/** Valor de media listo para contentVariables de Twilio. */
export function resolveTwilioMediaValue(
  def: Pick<
    TemplateVariableDef,
    "mediaBaseUrl" | "mediaFileName" | "mediaTwilioFormat"
  >,
  context: BuildContentVariablesContext
): string | null {
  const mediaBaseUrl =
    def.mediaBaseUrl ??
    context.templateMediaBaseUrl ??
    DEFAULT_MEDIA_BASE_URL
  const format = def.mediaTwilioFormat ?? "fullUrl"
  const campaignMedia = context.campaignMediaFileName?.trim()

  const resolvedFileName = resolveMediaFileName(
    context.campaignMediaFileName,
    def.mediaFileName ?? context.templateMediaFileName,
    mediaBaseUrl
  )

  if (format === "fullUrl") {
    if (campaignMedia && isAbsoluteMediaUrl(campaignMedia)) {
      return campaignMedia
    }
    return buildMediaUrl(resolvedFileName, mediaBaseUrl)
  }

  if (!resolvedFileName) {
    return null
  }

  const twilioMediaPath = normalizeMediaFileName(
    resolvedFileName,
    mediaBaseUrl
  )
  return twilioMediaPath
}

export function recipientFromEmployeeRecord(employee: {
  firstName: string
  lastName: string
  email: string
  company: { legalName: string }
  area?: { name: string } | null
}): MessageRecipientContext {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    areaName: employee.area?.name ?? null,
    companyLegalName: employee.company.legalName,
  }
}

function resolveDynamicVariableValue(
  recipient: MessageRecipientContext,
  def: TemplateVariableDef
): string {
  if (def.kind === "employee") {
    switch (def.source) {
      case "lastName":
        return recipient.lastName.trim()
      case "fullName":
        return [recipient.firstName, recipient.lastName]
          .filter(Boolean)
          .join(" ")
          .trim()
      case "email":
        return recipient.email.trim()
      case "areaName":
        return recipient.areaName?.trim() ?? ""
      case "firstName":
      default:
        return recipient.firstName.trim()
    }
  }

  if (def.kind === "company") {
    if (def.source === "legalName" || !def.source) {
      return recipient.companyLegalName.trim()
    }
  }

  return ""
}

export function validateBuiltContentVariables(
  schema: TemplateVariableDef[],
  variables: Record<string, string>
): string | null {
  for (const def of schema) {
    if (!def.required) {
      continue
    }
    const value = variables[def.key]?.trim()
    if (!value) {
      return `Falta la variable requerida {{${def.key}}} (${def.label}).`
    }
  }
  return null
}

export function buildContentVariables(
  schema: TemplateVariableDef[],
  recipient: MessageRecipientContext,
  context: BuildContentVariablesContext = {}
): Record<string, string> | undefined {
  const variables: Record<string, string> = {}
  const staticVars = context.campaignStaticVars ?? {}

  for (const def of schema) {
    if (def.kind === "static") {
      const value = staticVars[def.key]?.trim()
      if (value) {
        variables[def.key] = value
      }
      continue
    }

    if (def.kind === "employee" || def.kind === "company") {
      const value = resolveDynamicVariableValue(recipient, def)
      if (value) {
        variables[def.key] = value
      }
      continue
    }

    if (def.kind === "media") {
      const twilioValue = resolveTwilioMediaValue(def, context)
      if (twilioValue) {
        variables[def.key] = twilioValue
      }
    }
  }

  return Object.keys(variables).length > 0 ? variables : undefined
}

export type BuildContentVariablesResult = {
  variables?: Record<string, string>
  error: string | null
}

export function buildContentVariablesForTemplate(
  variableSchema: string | null | undefined,
  recipient: MessageRecipientContext,
  context: BuildContentVariablesContext = {}
): BuildContentVariablesResult {
  const schema = enrichSchemaWithLegacyTemplateMedia(
    resolveTemplateVariableSchema(variableSchema),
    context.templateMediaBaseUrl,
    context.templateMediaFileName
  )
  const variables = buildContentVariables(schema, recipient, context)
  if (!variables) {
    return {
      error: "No hay variables de contenido para enviar.",
      variables: undefined,
    }
  }
  const validationError = validateBuiltContentVariables(schema, variables)
  if (validationError) {
    return { error: validationError, variables: undefined }
  }
  return { variables, error: null }
}
