export const DEFAULT_MEDIA_BASE_URL =
  "https://grupohseq.sfo2.cdn.digitaloceanspaces.com/ccomercial/"

/** @deprecated Usa DEFAULT_MEDIA_BASE_URL */
export const MEDIA_CDN_BASE_URL = DEFAULT_MEDIA_BASE_URL

type EmployeeNameSource = {
  firstName: string
  lastName?: string
}

export type MediaSource = "campaign" | "template"

export function normalizeMediaBaseUrl(baseUrl?: string | null) {
  const value = baseUrl?.trim() || DEFAULT_MEDIA_BASE_URL
  return value.endsWith("/") ? value : `${value}/`
}

export function resolveMediaBaseUrl(templateMediaBaseUrl?: string | null) {
  const value = templateMediaBaseUrl?.trim()
  return normalizeMediaBaseUrl(value || DEFAULT_MEDIA_BASE_URL)
}

export function normalizeMediaFileName(
  fileName?: string | null,
  mediaBaseUrl?: string | null
) {
  const value = fileName?.trim()
  if (!value) {
    return null
  }

  const baseUrl = resolveMediaBaseUrl(mediaBaseUrl)

  if (value.startsWith("http://") || value.startsWith("https://")) {
    if (value.startsWith(baseUrl)) {
      return value.slice(baseUrl.length)
    }

    try {
      const segments = new URL(value).pathname.split("/").filter(Boolean)
      return segments.at(-1) ?? value
    } catch {
      return value
    }
  }

  if (value.startsWith(baseUrl)) {
    return value.slice(baseUrl.length)
  }

  return value
}

export function buildMediaUrl(
  mediaFileName?: string | null,
  mediaBaseUrl?: string | null
) {
  const fileName = normalizeMediaFileName(mediaFileName, mediaBaseUrl)
  if (!fileName) {
    return null
  }

  if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
    return fileName
  }

  return `${resolveMediaBaseUrl(mediaBaseUrl)}${fileName}`
}

export function resolveMediaSource(
  campaignMediaFileName?: string | null,
  templateMediaFileName?: string | null,
  mediaBaseUrl?: string | null
): { fileName: string | null; source: MediaSource | null } {
  const campaignFileName = normalizeMediaFileName(
    campaignMediaFileName,
    mediaBaseUrl
  )
  if (campaignFileName) {
    return { fileName: campaignFileName, source: "campaign" }
  }

  const templateFileName = normalizeMediaFileName(
    templateMediaFileName,
    mediaBaseUrl
  )
  if (templateFileName) {
    return { fileName: templateFileName, source: "template" }
  }

  return { fileName: null, source: null }
}

type BuildContentVariablesOptions = {
  mediaFileName?: string | null
  mediaBaseUrl?: string | null
  useFullName?: boolean
}

export function resolveMediaFileName(
  campaignMediaFileName?: string | null,
  templateMediaFileName?: string | null,
  mediaBaseUrl?: string | null
) {
  return (
    normalizeMediaFileName(campaignMediaFileName, mediaBaseUrl) ||
    normalizeMediaFileName(templateMediaFileName, mediaBaseUrl)
  )
}

export function buildContentVariablesForEmployee(
  employee: EmployeeNameSource,
  options: BuildContentVariablesOptions = {}
) {
  const variables: Record<string, string> = {}

  const employeeName = options.useFullName
    ? [employee.firstName, employee.lastName].filter(Boolean).join(" ").trim()
    : employee.firstName.trim()

  if (employeeName) {
    variables["1"] = employeeName
  }

  const mediaFileName = normalizeMediaFileName(
    options.mediaFileName,
    options.mediaBaseUrl
  )
  if (mediaFileName) {
    variables["2"] = mediaFileName
  }

  return Object.keys(variables).length > 0 ? variables : undefined
}
