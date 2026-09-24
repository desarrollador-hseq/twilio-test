import { getTwilioClient } from "@/lib/twilio"
import { formatTwilioError } from "@/lib/twilio-errors"
import {
  detectPresetFromSchema,
  PRESET_VARIABLE_SCHEMAS,
  serializeVariableSchema,
  type TemplateVariableDef,
  type TemplateVariablePreset,
} from "@/lib/messaging/template-variable-schema"

export type TwilioContentSnapshot = {
  sid: string
  friendlyName: string
  language: string
  variables: Record<string, unknown>
  types: Record<string, unknown>
}

export type SuggestedTemplateSchema = {
  preset: TemplateVariablePreset
  schema: TemplateVariableDef[]
  variableSchemaJson: string
  hint: string
  friendlyName?: string
  language?: string
}

export async function fetchTwilioContentTemplate(contentSid: string) {
  const sid = contentSid.trim()
  if (!sid.startsWith("HX")) {
    throw new Error("El Content SID debe comenzar con HX.")
  }

  try {
    const client = getTwilioClient()
    const content = await client.content.v1.contents(sid).fetch()
    return {
      sid: content.sid,
      friendlyName: content.friendlyName,
      language: content.language,
      variables: (content.variables ?? {}) as Record<string, unknown>,
      types: (content.types ?? {}) as Record<string, unknown>,
    } satisfies TwilioContentSnapshot
  } catch (error) {
    throw new Error(formatTwilioError(error))
  }
}

function collectNumericVariableKeys(content: TwilioContentSnapshot): string[] {
  const keys = new Set<string>()

  for (const key of Object.keys(content.variables)) {
    if (/^\d+$/.test(key)) {
      keys.add(key)
    }
  }

  const typesJson = JSON.stringify(content.types)
  for (const match of typesJson.matchAll(/\{\{(\d+)\}\}/g)) {
    keys.add(match[1])
  }

  return [...keys].sort((a, b) => Number(a) - Number(b))
}

function contentUsesMedia(types: Record<string, unknown>): boolean {
  const json = JSON.stringify(types).toLowerCase()
  return (
    json.includes("twilio/media") ||
    json.includes("whatsapp/media") ||
    (json.includes('"media"') && json.includes("whatsapp/"))
  )
}

function variableAppearsInMediaField(
  typesJson: string,
  key: string
): boolean {
  const mediaFieldPattern = new RegExp(
    `"media[^"]*"\\s*:\\s*"[^"]*\\{\\{${key}\\}\\}`,
    "i"
  )
  return mediaFieldPattern.test(typesJson)
}

function sampleValue(content: TwilioContentSnapshot, key: string): string {
  const raw = content.variables[key]
  if (typeof raw === "string") {
    return raw.trim()
  }
  if (raw != null) {
    return String(raw).trim()
  }
  return ""
}

function buildCustomSuggestedSchema(
  content: TwilioContentSnapshot,
  keys: string[],
  hasMedia: boolean
): TemplateVariableDef[] {
  const typesJson = JSON.stringify(content.types)

  return keys.map((key) => {
    const sample = sampleValue(content, key)
    const inMedia = hasMedia && variableAppearsInMediaField(typesJson, key)

    if (inMedia) {
      return {
        key,
        label: "Imagen o video",
        kind: "media",
        required: false,
      }
    }

    const looksLikeUrl =
      sample.startsWith("http://") ||
      sample.startsWith("https://") ||
      /https:\/\//.test(typesJson) && key === "2"

    return {
      key,
      label: sample
        ? `Variable {{${key}}} (ej. ${sample.slice(0, 40)}${sample.length > 40 ? "…" : ""})`
        : `Variable {{${key}}}`,
      kind: "static",
      input: looksLikeUrl ? "url" : "text",
      required: true,
    }
  })
}

export function suggestTemplateSchemaFromTwilioContent(
  content: TwilioContentSnapshot
): SuggestedTemplateSchema {
  const keys = collectNumericVariableKeys(content)
  const hasMedia = contentUsesMedia(content.types)

  if (keys.length === 0) {
    const schema = PRESET_VARIABLE_SCHEMAS.image_greeting
    const variableSchemaJson = serializeVariableSchema(schema)
    return {
      preset: "image_greeting",
      schema,
      variableSchemaJson,
      friendlyName: content.friendlyName,
      language: content.language,
      hint: "Twilio no expuso variables numéricas; se aplicó el preset saludo + imagen. Revísalo antes de guardar.",
    }
  }

  if (keys.length === 2 && keys[0] === "1" && keys[1] === "2") {
    if (hasMedia) {
      const schema = PRESET_VARIABLE_SCHEMAS.image_greeting
      return {
        preset: "image_greeting",
        schema,
        variableSchemaJson: serializeVariableSchema(schema),
        friendlyName: content.friendlyName,
        language: content.language,
        hint: "Detectado cuerpo con media: preset saludo + imagen. Confirma que {{1}} sea nombre y {{2}} sea el path de media.",
      }
    }

    const schema = PRESET_VARIABLE_SCHEMAS.course_link
    return {
      preset: "course_link",
      schema,
      variableSchemaJson: serializeVariableSchema(schema),
      friendlyName: content.friendlyName,
      language: content.language,
      hint: "Detectado texto con dos variables: preset microcurso + enlace. Ajusta etiquetas si hace falta.",
    }
  }

  const schema = buildCustomSuggestedSchema(content, keys, hasMedia)
  const variableSchemaJson = serializeVariableSchema(schema)
  const preset = detectPresetFromSchema(variableSchemaJson)

  return {
    preset,
    schema,
    variableSchemaJson,
    friendlyName: content.friendlyName,
    language: content.language,
    hint:
      preset === "custom"
        ? "Esquema inferido desde Twilio. Revisa tipos (static / employee / media) antes de guardar."
        : "El esquema coincide con un preset conocido.",
  }
}
