"use client"

import { useState, useTransition } from "react"
import { Download } from "lucide-react"

import { importTemplateSchemaFromTwilio } from "@/lib/actions/templates"
import type { TemplateVariablePreset } from "@/lib/messaging/template-variable-schema"
import { Button } from "@/components/ui/button"

type ImportTwilioSchemaButtonProps = {
  onImported: (data: {
    preset: TemplateVariablePreset
    variableSchemaJson: string
    friendlyName?: string
    language?: string
    hint?: string
  }) => void
}

export function ImportTwilioSchemaButton({
  onImported,
}: ImportTwilioSchemaButtonProps) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  function handleImport() {
    const contentSid =
      document.querySelector<HTMLInputElement>("#contentSid")?.value.trim() ??
      ""

    setMessage(null)
    setIsError(false)

    startTransition(async () => {
      const result = await importTemplateSchemaFromTwilio(contentSid)

      if (result.error) {
        setIsError(true)
        setMessage(result.error)
        return
      }

      if (!result.preset || !result.variableSchemaJson) {
        setIsError(true)
        setMessage("Twilio no devolvió un esquema utilizable.")
        return
      }

      onImported({
        preset: result.preset,
        variableSchemaJson: result.variableSchemaJson,
        friendlyName: result.friendlyName,
        language: result.language,
        hint: result.hint,
      })

      setIsError(false)
      setMessage(result.hint ?? "Esquema importado desde Twilio.")
    })
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={handleImport}
      >
        <Download data-icon="inline-start" />
        {pending ? "Consultando Twilio…" : "Importar variables desde Twilio"}
      </Button>
      {message && (
        <p
          className={`text-xs ${isError ? "text-destructive" : "text-muted-foreground"}`}
        >
          {message}
        </p>
      )}
    </div>
  )
}
