import type { CampaignMessagePreview } from "@/lib/messaging/campaign-message-preview"
import { cn } from "@/lib/utils"

type CampaignMessagePreviewCardProps = {
  preview: CampaignMessagePreview
  className?: string
}

function detectMediaKind(url: string): "image" | "video" {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) ? "video" : "image"
}

export function CampaignMessagePreviewCard({
  preview,
  className,
}: CampaignMessagePreviewCardProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {preview.sampleRecipientLabel && (
        <p className="text-sm text-muted-foreground">
          Ejemplo para:{" "}
          <span className="font-medium text-foreground">
            {preview.sampleRecipientLabel}
          </span>
        </p>
      )}
      {preview.notice && (
        <p className="text-xs text-muted-foreground">{preview.notice}</p>
      )}

      <div className="mx-auto w-full max-w-sm rounded-xl border border-border/60 bg-[#e5ddd5] p-4 shadow-sm dark:bg-muted/40">
        <div className="mb-2 text-center text-[10px] text-muted-foreground">
          WhatsApp · vista previa
        </div>
        <div className="ml-auto max-w-[92%] overflow-hidden rounded-lg bg-white shadow-sm dark:bg-card">
          {preview.mediaUrl && (
            <div className="border-b border-border/40 bg-muted/30">
              {detectMediaKind(preview.mediaUrl) === "video" ? (
                <video
                  src={preview.mediaUrl}
                  controls
                  className="max-h-48 w-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.mediaUrl}
                  alt="Vista previa multimedia"
                  className="max-h-48 w-full object-cover"
                />
              )}
            </div>
          )}
          <div className="space-y-2 px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {preview.bodyLines.map((line, index) => (
              <p key={`${index}-${line.slice(0, 24)}`}>{line}</p>
            ))}
          </div>
          <div className="px-3 pb-2 text-right text-[10px] text-muted-foreground">
            {new Date().toLocaleTimeString("es-CO", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>

      {preview.usedTwilioTemplate && (
        <p className="text-xs text-muted-foreground">
          Texto obtenido de la plantilla aprobada en Twilio con variables
          sustituidas.
        </p>
      )}
    </div>
  )
}
