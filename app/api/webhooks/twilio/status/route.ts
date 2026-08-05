import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { TWILIO_STATUS_MAP } from "@/lib/messaging/constants"
import { parseTwilioFormData } from "@/lib/messaging/parse-twilio-form-data"
import { formatTwilioDeliveryError } from "@/lib/twilio-errors"

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "twilio-status",
    message: "Webhook activo. Twilio debe enviar POST con MessageSid y MessageStatus.",
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await parseTwilioFormData(request)
    const messageSid = formData.get("MessageSid")?.toString()
    const messageStatus = formData.get("MessageStatus")?.toString()

    if (!messageSid || !messageStatus) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    const mappedStatus = TWILIO_STATUS_MAP[messageStatus] ?? "sent"
    const now = new Date()

    const updateData: {
      status: string
      deliveredAt?: Date
      sentAt?: Date
      errorMessage?: string | null
    } = { status: mappedStatus }

    if (mappedStatus === "delivered" || mappedStatus === "read") {
      updateData.deliveredAt = now
    }

    if (mappedStatus === "sent") {
      updateData.sentAt = now
    }

    if (mappedStatus === "failed" || mappedStatus === "undelivered") {
      const errorMessage = formatTwilioDeliveryError(
        formData.get("ErrorCode")?.toString(),
        formData.get("ErrorMessage")?.toString(),
        formData.get("ChannelStatusMessage")?.toString()
      )

      if (errorMessage) {
        updateData.errorMessage = errorMessage
      }
    }

    await prisma.message.update({
      where: { messageSid },
      data: updateData,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      // Twilio reintenta si respondemos error; un SID desconocido no debe tumbar el webhook.
      return NextResponse.json({ ok: true, skipped: "message not found" })
    }

    console.error("[twilio/status] Error al actualizar mensaje:", error)

    return NextResponse.json(
      { error: "No se pudo actualizar el estado del mensaje" },
      { status: 500 }
    )
  }
}
