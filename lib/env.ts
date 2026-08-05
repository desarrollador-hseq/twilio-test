export function getAppUrl() {
  // APP_URL y AUTH_URL se leen en runtime (ideal para PM2/producción).
  // NEXT_PUBLIC_APP_URL se embebe en el build y puede quedar desactualizado.
  const configured =
    process.env.APP_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (configured) {
    return configured.replace(/\/$/, "")
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return "http://localhost:9000"
}

export function isPublicAppUrl(url = getAppUrl()) {
  try {
    const { hostname } = new URL(url)
    return (
      hostname !== "localhost" &&
      hostname !== "127.0.0.1" &&
      !hostname.endsWith(".local")
    )
  } catch {
    return false
  }
}

function getPublicWebhookUrl(path: string) {
  const appUrl = getAppUrl()

  if (!isPublicAppUrl(appUrl)) {
    return undefined
  }

  return `${appUrl}${path}`
}

export function getStatusCallbackUrl() {
  return getPublicWebhookUrl("/api/webhooks/twilio/status")
}

export function getInboundWebhookUrl() {
  return getPublicWebhookUrl("/api/webhooks/twilio/inbound")
}

export function isTwilioConfigured() {
  const hasSender = Boolean(
    process.env.TWILIO_WHATSAPP_FROM?.trim() ||
      process.env.TWILIO_MESSAGING_SERVICE_SID?.trim()
  )

  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      hasSender
  )
}
