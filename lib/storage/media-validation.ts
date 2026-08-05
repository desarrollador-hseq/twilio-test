const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
])

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
])

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_VIDEO_BYTES = 16 * 1024 * 1024

export type MediaValidationResult =
  | { ok: true; kind: "image" | "video" }
  | { ok: false; error: string }

export function validateCampaignMediaFile(file: File): MediaValidationResult {
  if (file.size === 0) {
    return { ok: false, error: "El archivo está vacío." }
  }

  if (ALLOWED_IMAGE_TYPES.has(file.type)) {
    if (file.size > MAX_IMAGE_BYTES) {
      return {
        ok: false,
        error: "La imagen no puede superar 5 MB.",
      }
    }
    return { ok: true, kind: "image" }
  }

  if (ALLOWED_VIDEO_TYPES.has(file.type)) {
    if (file.size > MAX_VIDEO_BYTES) {
      return {
        ok: false,
        error: "El video no puede superar 16 MB.",
      }
    }
    return { ok: true, kind: "video" }
  }

  return {
    ok: false,
    error: "Formato no permitido. Usa JPG, PNG, GIF, WEBP, MP4, WEBM o MOV.",
  }
}
