import {
  buildMediaUrl,
  type MediaSource,
} from "@/lib/messaging/content-variables"
import { cn } from "@/lib/utils"

type CampaignMediaImageProps = {
  mediaFileName?: string | null
  mediaBaseUrl?: string | null
  source?: MediaSource | null
  size?: "sm" | "md" | "lg"
  showMeta?: boolean
  className?: string
}

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-24 w-24",
  lg: "max-h-56 w-full max-w-sm",
}

export function CampaignMediaImage({
  mediaFileName,
  mediaBaseUrl,
  source,
  size = "md",
  showMeta = false,
  className,
}: CampaignMediaImageProps) {
  const url = buildMediaUrl(mediaFileName, mediaBaseUrl)

  if (!url) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return (
    <div className={cn("space-y-1", className)}>
      <a href={url} target="_blank" rel="noreferrer" className="inline-block">
        <img
          src={url}
          alt={mediaFileName ?? "Imagen de campaña"}
          className={cn(
            "rounded-md border object-cover",
            sizeClasses[size]
          )}
        />
      </a>
      {showMeta && (
        <p className="text-xs text-muted-foreground">
          {source === "campaign"
            ? "Campaña"
            : source === "template"
              ? "Plantilla"
              : "Imagen"}
          {" · "}
          <code>{mediaFileName}</code>
        </p>
      )}
    </div>
  )
}
