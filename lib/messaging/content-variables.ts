import { getSpacesCdnUrl } from "@/lib/env"
import type { TemplateVariableDef } from "@/lib/messaging/template-variable-schema"
import { resolveTemplateVariableSchema } from "@/lib/messaging/template-variable-schema"

export const DEFAULT_MEDIA_BASE_URL = `${getSpacesCdnUrl().replace(/\/$/, "")}/ccomercial/`

function isAbsoluteMediaUrl(value: string) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:")
  )
}

/** @deprecated Usa DEFAULT_MEDIA_BASE_URL */
export const MEDIA_CDN_BASE_URL = DEFAULT_MEDIA_BASE_URL

type EmployeeNameSource = {
  firstName: string
  lastName?: string
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
  mediaFileName?: string | null
  mediaBaseUrl?: string | null
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

function employeeNameForDef(
  employee: EmployeeNameSource,
  def: TemplateVariableDef
): string {
  const useFullName = def.source === "fullName"
  return useFullName
    ? [employee.firstName, employee.lastName].filter(Boolean).join(" ").trim()
    : employee.firstName.trim()
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
  employee: EmployeeNameSource,
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

    if (def.kind === "employee") {
      const name = employeeNameForDef(employee, def)
      if (name) {
        variables[def.key] = name
      }
      continue
    }

    if (def.kind === "media") {
      const mediaValue = context.mediaFileName?.trim()
      if (mediaValue) {
        const twilioMediaPath = normalizeMediaFileName(
          mediaValue,
          context.mediaBaseUrl
        )
        if (twilioMediaPath) {
          // La plantilla de Twilio ya concatena mediaBaseUrl + {{n}}.
          variables[def.key] = twilioMediaPath
        }
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
  employee: EmployeeNameSource,
  context: BuildContentVariablesContext = {}
): BuildContentVariablesResult {
  const schema = resolveTemplateVariableSchema(variableSchema)
  const variables = buildContentVariables(schema, employee, context)
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
