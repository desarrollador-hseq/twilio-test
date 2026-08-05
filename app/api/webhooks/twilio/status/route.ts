import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { TWILIO_STATUS_MAP } from "@/lib/messaging/constants"
import { parseTwilioFormData, formDataToRecord } from "@/lib/messaging/parse-twilio-form-data"
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

    const updated = await prisma.message.updateMany({
      where: { messageSid },
      data: updateData,
    })

    const recentMessages = await prisma.message.findMany({
      where: { messageSid: { not: null } },
      select: { id: true, messageSid: true, status: true },
      orderBy: { id: "desc" },
      take: 5,
    })

    console.info("[twilio/status]", {
      messageSid,
      messageStatus,
      mappedStatus,
      updatedCount: updated.count,
      payload: formDataToRecord(formData),
      recentMessageSidsInDb: recentMessages,
    })

    if (updated.count === 0) {
      return NextResponse.json({ ok: true, skipped: "message not found" })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[twilio/status] Error al actualizar mensaje:", error)

    return NextResponse.json(
      { error: "No se pudo actualizar el estado del mensaje" },
      { status: 500 }
    )
  }
}
