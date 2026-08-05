import Twilio from "twilio"
import { normalizePhoneToE164 } from "@/lib/phone"

export function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error("Credenciales de Twilio no configuradas.")
  }

  return Twilio(accountSid, authToken)
}

export function getMessagingServiceSid() {
  return process.env.TWILIO_MESSAGING_SERVICE_SID?.trim() || undefined
}

export function getWhatsAppFrom() {
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim()

  if (!from) {
    throw new Error("TWILIO_WHATSAPP_FROM no configurado.")
  }

  const normalized = from.replace(/\s/g, "")

  if (normalized.startsWith("whatsapp:")) {
    return normalized
  }

  if (normalized.startsWith("+")) {
    return `whatsapp:${normalized}`
  }

  return `whatsapp:+${normalized}`
}

export function getWhatsAppSender() {
  const messagingServiceSid = getMessagingServiceSid()

  if (messagingServiceSid) {
    return { messagingServiceSid } as const
  }

  return { from: getWhatsAppFrom() } as const
}

export function formatWhatsAppTo(phone: string) {
  const cleaned = phone.replace(/\s/g, "")

  if (cleaned.startsWith("whatsapp:")) {
    return cleaned
  }

  const e164 = normalizePhoneToE164(cleaned)
  return `whatsapp:${e164}`
}
