import { getStatusCallbackUrl } from "@/lib/env"
import {
  formatWhatsAppTo,
  getTwilioClient,
  getWhatsAppSender,
} from "@/lib/twilio"

type SendWhatsAppParams = {
  to: string
  contentSid: string
  contentVariables?: Record<string, string>
}

export async function sendWhatsAppMessage({
  to,
  contentSid,
  contentVariables,
}: SendWhatsAppParams) {
  const client = getTwilioClient()
  const statusCallback = getStatusCallbackUrl()
  const sender = getWhatsAppSender()

  const message = await client.messages.create({
    ...sender,
    to: formatWhatsAppTo(to),
    contentSid,
    contentVariables: contentVariables
      ? JSON.stringify(contentVariables)
      : undefined,
    ...(statusCallback ? { statusCallback } : {}),
  })

  console.info("[twilio/send]", {
    messageSid: message.sid,
    to: message.to,
    status: message.status,
    statusCallback,
  })

  return message
}
