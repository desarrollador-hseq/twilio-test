import type {
  TemplateVariableDef,
  TemplateVariableInput,
  TemplateVariableKind,
} from "@/lib/messaging/template-variable-schema"

export type VariableBindingId =
  | "employee.firstName"
  | "employee.lastName"
  | "employee.fullName"
  | "employee.email"
  | "employee.areaName"
  | "company.legalName"
  | "campaign.text"
  | "campaign.url"
  | "campaign.textarea"
  | "media"

export type VariableBindingOption = {
  id: VariableBindingId
  group: string
  label: string
  description: string
}

export const VARIABLE_BINDING_OPTIONS: VariableBindingOption[] = [
  {
    id: "employee.firstName",
    group: "Empleado",
    label: "Nombre",
    description: "Se completa por destinatario al enviar.",
  },
  {
    id: "employee.lastName",
    group: "Empleado",
    label: "Apellidos",
    description: "Se completa por destinatario al enviar.",
  },
  {
    id: "employee.fullName",
    group: "Empleado",
    label: "Nombre completo",
    description: "Nombre y apellidos del destinatario.",
  },
  {
    id: "employee.email",
    group: "Empleado",
    label: "Correo",
    description: "Email del empleado en la base de datos.",
  },
  {
    id: "employee.areaName",
    group: "Empleado",
    label: "Área",
    description: "Área asignada al empleado (si tiene).",
  },
  {
    id: "company.legalName",
    group: "Empresa",
    label: "Razón social",
    description: "Empresa del empleado destinatario.",
  },
  {
    id: "campaign.text",
    group: "Campaña",
    label: "Texto fijo",
    description: "Mismo valor para todos; se pide al crear la campaña.",
  },
  {
    id: "campaign.url",
    group: "Campaña",
    label: "URL fija",
    description: "Enlace común para todos los destinatarios.",
  },
  {
    id: "campaign.textarea",
    group: "Campaña",
    label: "Texto largo",
    description: "Párrafo o mensaje fijo en la campaña.",
  },
  {
    id: "media",
    group: "Multimedia",
    label: "Imagen o video",
    description: "Archivo de campaña o default de la plantilla.",
  },
]

function bindingParts(id: VariableBindingId) {
  if (id === "media") {
    return { kind: "media" as const }
  }
  if (id.startsWith("company.")) {
    return {
      kind: "company" as const,
      source: id.slice("company.".length),
    }
  }
  if (id.startsWith("employee.")) {
    return {
      kind: "employee" as const,
      source: id.slice("employee.".length),
    }
  }
  const input = id.slice("campaign.".length) as TemplateVariableInput
  return { kind: "static" as const, input }
}

export function defFromBinding(
  bindingId: VariableBindingId,
  key: string,
  label: string,
  required = true
): TemplateVariableDef {
  const parts = bindingParts(bindingId)
  const def: TemplateVariableDef = {
    key,
    label: label.trim() || defaultLabelForBinding(bindingId, key),
    kind: parts.kind as TemplateVariableKind,
    required,
  }

  if ("source" in parts && parts.source) {
    def.source = parts.source as TemplateVariableDef["source"]
  }
  if ("input" in parts && parts.input) {
    def.input = parts.input
  }

  return def
}

export function bindingIdFromDef(def: TemplateVariableDef): VariableBindingId {
  if (def.kind === "media") {
    return "media"
  }
  if (def.kind === "company") {
    return `company.${def.source ?? "legalName"}` as VariableBindingId
  }
  if (def.kind === "employee") {
    const source = def.source ?? "firstName"
    return `employee.${source}` as VariableBindingId
  }
  if (def.input === "url") {
    return "campaign.url"
  }
  if (def.input === "textarea") {
    return "campaign.textarea"
  }
  return "campaign.text"
}

export function defaultLabelForBinding(
  bindingId: VariableBindingId,
  key: string
): string {
  const option = VARIABLE_BINDING_OPTIONS.find((item) => item.id === bindingId)
  return option ? `${option.label} ({{${key}}})` : `Variable {{${key}}}`
}

export function isKnownBindingId(value: string): value is VariableBindingId {
  return VARIABLE_BINDING_OPTIONS.some((option) => option.id === value)
}
