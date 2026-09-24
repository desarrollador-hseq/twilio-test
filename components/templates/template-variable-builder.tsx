"use client"

import { useMemo } from "react"
import { Plus, Trash2 } from "lucide-react"

import {
  bindingIdFromDef,
  defFromBinding,
  defaultLabelForBinding,
  isKnownBindingId,
  VARIABLE_BINDING_OPTIONS,
  type VariableBindingId,
} from "@/lib/messaging/variable-source-catalog"
import {
  DEFAULT_MEDIA_BASE_URL,
} from "@/lib/messaging/content-variables"
import {
  PRESET_VARIABLE_SCHEMAS,
  type TemplateVariableDef,
  validateVariableSchema,
} from "@/lib/messaging/template-variable-schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type TemplateVariableBuilderProps = {
  schema: TemplateVariableDef[]
  onChange: (schema: TemplateVariableDef[]) => void
  showJson?: boolean
  jsonValue?: string
  onJsonChange?: (json: string) => void
}

const selectClassName =
  "h-7 w-full rounded-md border border-input bg-input/20 px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"

function nextNumericKey(schema: TemplateVariableDef[]): string {
  const used = new Set(schema.map((def) => def.key))
  for (let i = 1; i <= 99; i += 1) {
    const key = String(i)
    if (!used.has(key)) {
      return key
    }
  }
  return String(schema.length + 1)
}

export function TemplateVariableBuilder({
  schema,
  onChange,
  showJson = false,
  jsonValue = "",
  onJsonChange,
}: TemplateVariableBuilderProps) {
  const validationError = useMemo(() => validateVariableSchema(schema), [schema])

  const groupedOptions = useMemo(() => {
    const groups = new Map<string, typeof VARIABLE_BINDING_OPTIONS>()
    for (const option of VARIABLE_BINDING_OPTIONS) {
      const list = groups.get(option.group) ?? []
      list.push(option)
      groups.set(option.group, list)
    }
    return [...groups.entries()]
  }, [])

  function updateRow(index: number, patch: Partial<TemplateVariableDef>) {
    const next = schema.map((def, i) =>
      i === index ? { ...def, ...patch } : def
    )
    onChange(next)
  }

  function updateBinding(index: number, bindingId: VariableBindingId) {
    const current = schema[index]
    if (!current) {
      return
    }
    const nextDef = defFromBinding(
      bindingId,
      current.key,
      current.label || defaultLabelForBinding(bindingId, current.key),
      current.required ?? true
    )
    if (bindingId === "media") {
      nextDef.mediaBaseUrl =
        current.mediaBaseUrl?.trim() || DEFAULT_MEDIA_BASE_URL
      nextDef.mediaFileName = current.mediaFileName ?? ""
    }
    updateRow(index, nextDef)
  }

  function addRow() {
    const key = nextNumericKey(schema)
    onChange([
      ...schema,
      defFromBinding("campaign.text", key, defaultLabelForBinding("campaign.text", key)),
    ])
  }

  function removeRow(index: number) {
    onChange(schema.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Variables de la plantilla</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange([...PRESET_VARIABLE_SCHEMAS.image_greeting])
            }
          >
            Ejemplo: saludo + imagen
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange([...PRESET_VARIABLE_SCHEMAS.course_link])
            }
          >
            Ejemplo: curso + enlace
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus data-icon="inline-start" />
            Añadir variable
          </Button>
        </div>
      </div>

      {schema.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Añade una fila por cada placeholder {"{{1}}"}, {"{{2}}"}, etc. de Twilio.
        </p>
      ) : (
        <ul className="space-y-3">
          {schema.map((def, index) => {
            const binding = bindingIdFromDef(def)
            return (
              <li
                key={`${def.key}-${index}`}
                className="grid gap-2 rounded-md border border-border/60 bg-muted/10 p-3 sm:grid-cols-[4rem_1fr_1fr_auto]"
              >
                <div className="space-y-1">
                  <Label className="text-xs">Clave</Label>
                  <Input
                    value={def.key}
                    onChange={(e) =>
                      updateRow(index, { key: e.target.value.replace(/\D/g, "") })
                    }
                    inputMode="numeric"
                    aria-label={`Clave {{${def.key}}}`}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Origen del valor</Label>
                  <select
                    className={selectClassName}
                    value={binding}
                    onChange={(e) => {
                      const value = e.target.value
                      if (isKnownBindingId(value)) {
                        updateBinding(index, value)
                      }
                    }}
                  >
                    {groupedOptions.map(([group, options]) => (
                      <optgroup key={group} label={group}>
                        {options.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-1">
                  <Label className="text-xs">Etiqueta (UI)</Label>
                  <Input
                    value={def.label}
                    onChange={(e) => updateRow(index, { label: e.target.value })}
                  />
                </div>
                <div className="flex items-end justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeRow(index)}
                    disabled={schema.length <= 1}
                  >
                    <Trash2 />
                    <span className="sr-only">Eliminar</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-4">
                  {VARIABLE_BINDING_OPTIONS.find((o) => o.id === binding)
                    ?.description ?? ""}
                </p>
                {def.kind === "media" && (
                  <div className="grid gap-2 sm:col-span-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Prefijo CDN (Twilio + path)</Label>
                      <Input
                        value={def.mediaBaseUrl ?? ""}
                        placeholder={DEFAULT_MEDIA_BASE_URL}
                        onChange={(e) =>
                          updateRow(index, {
                            mediaBaseUrl: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Parte fija antes de {"{{"}
                        {def.key}
                        {"}}"} en la plantilla de Twilio.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Archivo por defecto</Label>
                      <Input
                        value={def.mediaFileName ?? ""}
                        placeholder="mision-alto-voltaje.png"
                        onChange={(e) =>
                          updateRow(index, {
                            mediaFileName: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Solo el path tras el prefijo; puede cambiarse en la
                        campaña.
                      </p>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {validationError && (
        <p className="text-sm text-destructive">{validationError}</p>
      )}

      {showJson && onJsonChange && (
        <div className="space-y-2">
          <Label htmlFor="variableSchemaJson">JSON (avanzado)</Label>
          <textarea
            id="variableSchemaJson"
            name="variableSchemaJson"
            className="min-h-32 w-full rounded-md border border-input bg-input/20 px-2 py-2 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            value={jsonValue}
            onChange={(e) => onJsonChange(e.target.value)}
            spellCheck={false}
          />
        </div>
      )}
    </div>
  )
}
