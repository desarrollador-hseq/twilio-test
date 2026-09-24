export const TEMPLATE_VARIABLE_PRESETS = [
  "image_greeting",
  "course_link",
  "custom",
] as const

export type TemplateVariablePreset = (typeof TEMPLATE_VARIABLE_PRESETS)[number]

export type TemplateVariableKind = "static" | "employee" | "company" | "media"
export type TemplateVariableInput = "text" | "url" | "textarea"
export type EmployeeSourceField =
  | "firstName"
  | "lastName"
  | "fullName"
  | "email"
  | "areaName"

/** @deprecated Usa EmployeeSourceField */
export type EmployeeNameSourceField = "firstName" | "fullName"

export type CompanySourceField = "legalName"

export type TemplateVariableDef = {
  key: string
  label: string
  kind: TemplateVariableKind
  required?: boolean
  input?: TemplateVariableInput
  source?: EmployeeSourceField | CompanySourceField
  /** Solo kind media: prefijo CDN en Twilio antes de {{n}} */
  mediaBaseUrl?: string | null
  /** Solo kind media: nombre de archivo por defecto (path relativo al prefijo) */
  mediaFileName?: string | null
}

export const PRESET_VARIABLE_SCHEMAS: Record<
  Exclude<TemplateVariablePreset, "custom">,
  TemplateVariableDef[]
> = {
  image_greeting: [
    {
      key: "1",
      label: "Nombre del destinatario",
      kind: "employee",
      source: "firstName",
      required: true,
    },
    {
      key: "2",
      label: "Imagen o video",
      kind: "media",
      required: false,
    },
  ],
  course_link: [
    {
      key: "1",
      label: "Nombre del microcurso",
      kind: "static",
      input: "text",
      required: true,
    },
    {
      key: "2",
      label: "Enlace de acceso",
      kind: "static",
      input: "url",
      required: true,
    },
  ],
}

const VALID_KINDS: TemplateVariableKind[] = [
  "static",
  "employee",
  "company",
  "media",
]
const VALID_INPUTS: TemplateVariableInput[] = ["text", "url", "textarea"]
const VALID_EMPLOYEE_SOURCES: EmployeeSourceField[] = [
  "firstName",
  "lastName",
  "fullName",
  "email",
  "areaName",
]
const VALID_COMPANY_SOURCES: CompanySourceField[] = ["legalName"]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseVariableDef(raw: unknown): TemplateVariableDef | null {
  if (!isRecord(raw)) {
    return null
  }

  const key = raw.key
  const label = raw.label
  const kind = raw.kind

  if (typeof key !== "string" || !/^\d+$/.test(key)) {
    return null
  }
  if (typeof label !== "string" || !label.trim()) {
    return null
  }
  if (typeof kind !== "string" || !VALID_KINDS.includes(kind as TemplateVariableKind)) {
    return null
  }

  const def: TemplateVariableDef = {
    key,
    label: label.trim(),
    kind: kind as TemplateVariableKind,
  }

  if (typeof raw.required === "boolean") {
    def.required = raw.required
  }

  if (kind === "static") {
    const input = raw.input
    if (
      typeof input === "string" &&
      VALID_INPUTS.includes(input as TemplateVariableInput)
    ) {
      def.input = input as TemplateVariableInput
    } else {
      def.input = "text"
    }
  }

  if (kind === "employee") {
    const source = raw.source
    if (
      typeof source === "string" &&
      VALID_EMPLOYEE_SOURCES.includes(source as EmployeeSourceField)
    ) {
      def.source = source as EmployeeSourceField
    } else if (source === "fullName" || source === "firstName") {
      def.source = source
    } else {
      def.source = "firstName"
    }
  }

  if (kind === "company") {
    const source = raw.source
    if (
      typeof source === "string" &&
      VALID_COMPANY_SOURCES.includes(source as CompanySourceField)
    ) {
      def.source = source as CompanySourceField
    } else {
      def.source = "legalName"
    }
  }

  if (kind === "media") {
    const mediaBaseUrl = raw.mediaBaseUrl
    const mediaFileName = raw.mediaFileName
    if (typeof mediaBaseUrl === "string" && mediaBaseUrl.trim()) {
      def.mediaBaseUrl = mediaBaseUrl.trim()
    }
    if (typeof mediaFileName === "string" && mediaFileName.trim()) {
      def.mediaFileName = mediaFileName.trim()
    }
  }

  return def
}

export function parseVariableSchemaJson(
  json: string | null | undefined
): TemplateVariableDef[] | null {
  if (!json?.trim()) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(json)
    if (!Array.isArray(parsed)) {
      return null
    }

    const defs: TemplateVariableDef[] = []
    for (const item of parsed) {
      const def = parseVariableDef(item)
      if (!def) {
        return null
      }
      defs.push(def)
    }

    return defs
  } catch {
    return null
  }
}

export function serializeVariableSchema(schema: TemplateVariableDef[]): string {
  return JSON.stringify(schema)
}

export function validateVariableSchema(schema: TemplateVariableDef[]): string | null {
  if (schema.length === 0) {
    return "El esquema debe incluir al menos una variable."
  }

  const keys = new Set<string>()
  for (const def of schema) {
    if (!/^\d+$/.test(def.key)) {
      return `La clave "${def.key}" debe ser un número (como en Twilio {{1}}, {{2}}).`
    }
    if (keys.has(def.key)) {
      return `La variable {{${def.key}}} está duplicada.`
    }
    keys.add(def.key)

    if (!def.label.trim()) {
      return `La variable {{${def.key}}} necesita una etiqueta.`
    }

    if (def.kind === "static" && def.source) {
      return `La variable {{${def.key}}} estática no puede tener "source".`
    }
    if (def.kind === "employee" && def.input) {
      return `La variable {{${def.key}}} de empleado no usa "input".`
    }
    if (def.kind === "company" && def.input) {
      return `La variable {{${def.key}}} de empresa no usa "input".`
    }
    if (def.kind === "media" && (def.input || def.source)) {
      return `La variable {{${def.key}}} de media no usa "input" ni "source".`
    }
  }

  return null
}

export function resolveTemplateVariableSchema(
  variableSchema: string | null | undefined
): TemplateVariableDef[] {
  const parsed = parseVariableSchemaJson(variableSchema)
  if (parsed && parsed.length > 0) {
    return parsed
  }
  return PRESET_VARIABLE_SCHEMAS.image_greeting
}

export function schemaFromPreset(
  preset: TemplateVariablePreset,
  customJson?: string | null
): { schema: TemplateVariableDef[]; error: string | null } {
  if (preset === "custom") {
    const parsed = parseVariableSchemaJson(customJson ?? "")
    if (!parsed) {
      return {
        schema: [],
        error: "JSON de variables inválido. Usa un array de objetos con key, label y kind.",
      }
    }
    const validationError = validateVariableSchema(parsed)
    if (validationError) {
      return { schema: [], error: validationError }
    }
    return { schema: parsed, error: null }
  }

  return {
    schema: PRESET_VARIABLE_SCHEMAS[preset],
    error: null,
  }
}

export function detectPresetFromSchema(
  variableSchema: string | null | undefined
): TemplateVariablePreset {
  const parsed = parseVariableSchemaJson(variableSchema)
  if (!parsed) {
    return "image_greeting"
  }

  for (const preset of ["image_greeting", "course_link"] as const) {
    const expected = serializeVariableSchema(PRESET_VARIABLE_SCHEMAS[preset])
    const actual = serializeVariableSchema(parsed)
    if (expected === actual) {
      return preset
    }
  }

  return "custom"
}

export function schemaHasMediaVariable(schema: TemplateVariableDef[]): boolean {
  return schema.some((def) => def.kind === "media")
}

export function getMediaVariableDefs(
  schema: TemplateVariableDef[]
): TemplateVariableDef[] {
  return schema.filter((def) => def.kind === "media")
}

/** Compatibilidad: columnas legacy en Template → variables media del esquema. */
export function enrichSchemaWithLegacyTemplateMedia(
  schema: TemplateVariableDef[],
  templateMediaBaseUrl?: string | null,
  templateMediaFileName?: string | null
): TemplateVariableDef[] {
  if (!templateMediaBaseUrl && !templateMediaFileName) {
    return schema
  }

  return schema.map((def) => {
    if (def.kind !== "media") {
      return def
    }
    return {
      ...def,
      mediaBaseUrl: def.mediaBaseUrl ?? templateMediaBaseUrl ?? null,
      mediaFileName: def.mediaFileName ?? templateMediaFileName ?? null,
    }
  })
}

export function legacyTemplateMediaFromSchema(schema: TemplateVariableDef[]): {
  mediaBaseUrl: string | null
  mediaFileName: string | null
} {
  const firstMedia = schema.find((def) => def.kind === "media")
  if (!firstMedia) {
    return { mediaBaseUrl: null, mediaFileName: null }
  }
  return {
    mediaBaseUrl: firstMedia.mediaBaseUrl ?? null,
    mediaFileName: firstMedia.mediaFileName ?? null,
  }
}

export function schemaStaticVariables(
  schema: TemplateVariableDef[]
): TemplateVariableDef[] {
  return schema.filter((def) => def.kind === "static")
}

export function presetLabel(preset: TemplateVariablePreset): string {
  switch (preset) {
    case "image_greeting":
      return "Saludo + imagen ({{1}} nombre, {{2}} media)"
    case "course_link":
      return "Microcurso + enlace ({{1}} curso, {{2}} URL)"
    case "custom":
      return "Armador (variables por placeholder)"
  }
}

export function variableKindLabel(kind: TemplateVariableKind): string {
  switch (kind) {
    case "static":
      return "Valor fijo (campaña)"
    case "employee":
      return "Empleado (automático)"
    case "company":
      return "Empresa (automático)"
    case "media":
      return "Multimedia"
  }
}

export function schemaDynamicVariables(
  schema: TemplateVariableDef[]
): TemplateVariableDef[] {
  return schema.filter(
    (def) =>
      def.kind === "employee" || def.kind === "company" || def.kind === "media"
  )
}

export function validateStaticVariables(
  schema: TemplateVariableDef[],
  rawValues: Record<string, string | undefined | null>
): { values: Record<string, string>; error: string | null } {
  const values: Record<string, string> = {}

  for (const def of schemaStaticVariables(schema)) {
    const raw = rawValues[def.key]?.toString().trim() ?? ""
    if (!raw) {
      if (def.required) {
        return {
          values: {},
          error: `Completa "${def.label}" ({{${def.key}}}).`,
        }
      }
      continue
    }

    if (def.input === "url") {
      try {
        const url = new URL(raw)
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          return {
            values: {},
            error: `"${def.label}" debe ser una URL http(s) válida.`,
          }
        }
      } catch {
        return {
          values: {},
          error: `"${def.label}" debe ser una URL válida.`,
        }
      }
    }

    values[def.key] = raw
  }

  return { values, error: null }
}

export function parseCampaignStaticVariables(
  formData: FormData,
  schema: TemplateVariableDef[]
): { values: Record<string, string>; error: string | null } {
  const rawValues: Record<string, string> = {}
  for (const def of schemaStaticVariables(schema)) {
    rawValues[def.key] =
      formData.get(`contentVar_${def.key}`)?.toString() ?? ""
  }
  return validateStaticVariables(schema, rawValues)
}

export function parseAndValidateVariableSchemaJson(
  json: string | null | undefined
): { schema: TemplateVariableDef[]; error: string | null } {
  const parsed = parseVariableSchemaJson(json ?? "")
  if (!parsed) {
    return {
      schema: [],
      error:
        "Esquema de variables inválido. Revisa el armador o el JSON avanzado.",
    }
  }
  const validationError = validateVariableSchema(parsed)
  if (validationError) {
    return { schema: [], error: validationError }
  }
  return { schema: parsed, error: null }
}

export function parseStoredContentVariables(
  json: string | null | undefined
): Record<string, string> {
  if (!json?.trim()) {
    return {}
  }
  try {
    const parsed: unknown = JSON.parse(json)
    if (!isRecord(parsed)) {
      return {}
    }
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") {
        result[key] = value
      }
    }
    return result
  } catch {
    return {}
  }
}
