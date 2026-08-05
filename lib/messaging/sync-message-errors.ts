import { prisma } from "@/lib/prisma"
import { isTwilioConfigured } from "@/lib/env"
import { getTwilioClient } from "@/lib/twilio"
import { formatTwilioDeliveryError } from "@/lib/twilio-errors"

type MessageWithSid = {
  id: number
  messageSid: string | null
  status: string
  errorMessage: string | null
}

export async function syncMissingTwilioMessageErrors(
  messages: MessageWithSid[]
) {
  if (!isTwilioConfigured()) {
    return
  }

  const pending = messages.filter(
    (message) =>
      message.messageSid &&
      !message.errorMessage &&
      (message.status === "failed" || message.status === "undelivered")
  )

  if (pending.length === 0) {
    return
  }

  const client = getTwilioClient()

  await Promise.all(
    pending.map(async (message) => {
      try {
        const twilioMessage = await client
          .messages(message.messageSid!)
          .fetch()

        const errorMessage = formatTwilioDeliveryError(
          twilioMessage.errorCode,
          twilioMessage.errorMessage
        )

        if (!errorMessage) {
          return
        }

        await prisma.message.update({
          where: { id: message.id },
          data: { errorMessage },
        })

        message.errorMessage = errorMessage
      } catch (error) {
        console.error(
          `[sync-message-errors] No se pudo consultar ${message.messageSid}:`,
          error
        )
      }
    })
  )
}
