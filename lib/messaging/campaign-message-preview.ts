import { prisma } from "@/lib/prisma"
import { isTwilioConfigured } from "@/lib/env"
import {
  buildContentVariablesForTemplate,
  buildMediaUrl,
  recipientFromEmployeeRecord,
} from "@/lib/messaging/content-variables"
import { fetchTwilioContentTemplate } from "@/lib/messaging/twilio-content-schema"
import {
  enrichSchemaWithLegacyTemplateMedia,
  parseStoredContentVariables,
  resolveTemplateVariableSchema,
} from "@/lib/messaging/template-variable-schema"

export type CampaignMessagePreview = {
  sampleRecipientLabel: string | null
  variables: Record<string, string>
  bodyLines: string[]
  mediaUrl: string | null
  usedTwilioTemplate: boolean
  notice?: string
}

function extractBodiesFromContentTypes(types: Record<string, unknown>): string[] {
  const bodies: string[] = []

  function walk(value: unknown) {
    if (value == null) {
      return
    }
    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }
    if (typeof value !== "object") {
      return
    }
    for (const [key, nested] of Object.entries(value)) {
      if (key === "body" && typeof nested === "string" && nested.trim()) {
        bodies.push(nested.trim())
      } else {
        walk(nested)
      }
    }
  }

  walk(types)
  return [...new Set(bodies)]
}

function interpolateTemplateText(
  text: string,
  variables: Record<string, string>
) {
  return text.replace(/\{\{(\d+)\}\}/g, (_, key: string) => {
    const value = variables[key]?.trim()
    return value || `{{${key}}}`
  })
}

function resolvePreviewMediaUrl(
  variables: Record<string, string>,
  schema: ReturnType<typeof enrichSchemaWithLegacyTemplateMedia>,
  campaignMediaFileName?: string | null,
  templateMediaBaseUrl?: string | null
): string | null {
  for (const def of schema) {
    if (def.kind !== "media") {
      continue
    }
    const baseUrl = def.mediaBaseUrl ?? templateMediaBaseUrl
    const fromCampaign = campaignMediaFileName?.trim()
    if (fromCampaign) {
      const url = buildMediaUrl(fromCampaign, baseUrl)
      if (url) {
        return url
      }
    }
    const path = variables[def.key]?.trim()
    if (path) {
      const url = buildMediaUrl(path, baseUrl)
      if (url) {
        return url
      }
    }
    if (def.mediaFileName) {
      return buildMediaUrl(def.mediaFileName, baseUrl)
    }
  }
  return null
}

function fallbackBodyLines(
  variables: Record<string, string>,
  schema: ReturnType<typeof resolveTemplateVariableSchema>
): string[] {
  const lines = schema.map((def) => {
    const value = variables[def.key]?.trim()
    if (!value) {
      return `${def.label}: (vacío)`
    }
    return `${def.label}: ${value}`
  })
  return lines.length > 0 ? lines : ["Sin variables de contenido configuradas."]
}

export async function buildCampaignMessagePreview(input: {
  companyId: number
  targetAllAreas: boolean
  areaIds: number[]
  template: {
    contentSid: string
    variableSchema: string | null
    mediaBaseUrl: string | null
    mediaFileName: string | null
  }
  contentVariables: string | null
  mediaFileName: string | null
}): Promise<CampaignMessagePreview> {
  const sampleEmployee = await prisma.employee.findFirst({
    where: {
      companyId: input.companyId,
      active: true,
      deletedAt: null,
      canSendWhatsapp: true,
      NOT: { mobilePhone: "" },
      ...(input.targetAllAreas
        ? {}
        : {
            areaId: { in: input.areaIds },
          }),
    },
    include: {
      company: true,
      area: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  })

  const staticVars = parseStoredContentVariables(input.contentVariables)
  const schema = enrichSchemaWithLegacyTemplateMedia(
    resolveTemplateVariableSchema(input.template.variableSchema),
    input.template.mediaBaseUrl,
    input.template.mediaFileName
  )

  if (!sampleEmployee) {
    return {
      sampleRecipientLabel: null,
      variables: staticVars,
      bodyLines: fallbackBodyLines(staticVars, schema),
      mediaUrl: resolvePreviewMediaUrl(
        staticVars,
        schema,
        input.mediaFileName,
        input.template.mediaBaseUrl
      ),
      usedTwilioTemplate: false,
      notice:
        "No hay empleados de ejemplo en el alcance de la campaña. Se muestran solo variables de campaña.",
    }
  }

  const recipient = recipientFromEmployeeRecord(sampleEmployee)
  const built = buildContentVariablesForTemplate(
    input.template.variableSchema,
    recipient,
    {
      campaignStaticVars: staticVars,
      campaignMediaFileName: input.mediaFileName,
      templateMediaBaseUrl: input.template.mediaBaseUrl,
      templateMediaFileName: input.template.mediaFileName,
    }
  )

  const variables = built.variables ?? staticVars
  const mediaUrl = resolvePreviewMediaUrl(
    variables,
    schema,
    input.mediaFileName,
    input.template.mediaBaseUrl
  )

  let bodyLines: string[] = []
  let usedTwilioTemplate = false
  let notice: string | undefined

  if (isTwilioConfigured()) {
    try {
      const content = await fetchTwilioContentTemplate(input.template.contentSid)
      const templates = extractBodiesFromContentTypes(content.types)
      if (templates.length > 0) {
        bodyLines = templates.map((body) =>
          interpolateTemplateText(body, variables)
        )
        usedTwilioTemplate = true
      }
    } catch {
      notice = "No se pudo cargar el texto de la plantilla desde Twilio."
    }
  } else {
    notice = "Twilio no configurado: vista previa sin texto oficial de plantilla."
  }

  if (bodyLines.length === 0) {
    bodyLines = fallbackBodyLines(variables, schema)
  }

  const sampleRecipientLabel = `${sampleEmployee.firstName} ${sampleEmployee.lastName}${
    sampleEmployee.area ? ` · ${sampleEmployee.area.name}` : ""
  }`

  return {
    sampleRecipientLabel,
    variables,
    bodyLines,
    mediaUrl,
    usedTwilioTemplate,
    notice,
  }
}
