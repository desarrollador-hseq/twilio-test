"use client"

import { useState, useTransition } from "react"
import { Send } from "lucide-react"

import { launchCampaign } from "@/lib/actions/campaigns"
import { Button } from "@/components/ui/button"

type LaunchCampaignButtonProps = {
  campaignId: number
  mediaFileName?: string | null
}

export function LaunchCampaignButton({
  campaignId,
  mediaFileName,
}: LaunchCampaignButtonProps) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      

      {result && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm">{result}</p>
      )}

      <Button
        disabled={pending}
        onClick={() => {
          if (
            !confirm(
              "¿Lanzar campaña? Se enviará WhatsApp a todos los empleados elegibles."
            )
          ) {
            return
          }

          startTransition(async () => {
            const response = await launchCampaign(campaignId)

            if (response.error) {
              setResult(response.error)
              return
            }

            setResult(
              `Enviados: ${response.sent}/${response.total}. Fallidos: ${response.failed}.`
            )
          })
        }}
      >
        <Send data-icon="inline-start" />
        {pending ? "Enviando..." : "Lanzar campaña"}
      </Button>
    </div>
  )
}
