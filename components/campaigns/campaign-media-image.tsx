import {
  buildMediaUrl,
  type MediaSource,
} from "@/lib/messaging/content-variables"
import { cn } from "@/lib/utils"

type CampaignMediaImageProps = {
  mediaFileName?: string | null
  mediaBaseUrl?: string | null
  source?: MediaSource | null
  mediaKind?: "image" | "video" | "auto"
  size?: "sm" | "md" | "lg"
  showMeta?: boolean
  className?: string
}

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-24 w-24",
  lg: "max-h-56 w-full max-w-sm",
}

function detectMediaKind(url: string): "image" | "video" {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) ? "video" : "image"
}

export function CampaignMediaImage({
  mediaFileName,
  mediaBaseUrl,
  source,
  mediaKind = "auto",
  size = "md",
  showMeta = false,
  className,
}: CampaignMediaImageProps) {
  const url = buildMediaUrl(mediaFileName, mediaBaseUrl)

  if (!url) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const resolvedKind =
    mediaKind === "auto" ? detectMediaKind(url) : mediaKind

  return (
    <div className={cn("space-y-1", className)}>
      <a href={url} target="_blank" rel="noreferrer" className="inline-block">
        {resolvedKind === "video" ? (
          <video
            src={url}
            controls
            className={cn(
              "rounded-md border object-cover",
              sizeClasses[size]
            )}
          />
        ) : (
          <img
            src={url}
            alt={mediaFileName ?? "Multimedia de campaña"}
            className={cn(
              "rounded-md border object-cover",
              sizeClasses[size]
            )}
          />
        )}
      </a>
      {showMeta && (
        <p className="break-all text-xs text-muted-foreground">
          {source === "campaign"
            ? "Campaña"
            : source === "template"
              ? "Plantilla"
              : "Multimedia"}
          {" · "}
          <code>{mediaFileName}</code>
        </p>
      )}
    </div>
  )
}
