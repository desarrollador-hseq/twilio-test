import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@/lib/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { TWILIO_STATUS_MAP } from "@/lib/messaging/constants"
import { formatTwilioDeliveryError } from "@/lib/twilio-errors"

export async function POST(request: NextRequest) {
  const formData = await request.formData()
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

  try {
    await prisma.message.update({
      where: { messageSid },
      data: updateData,
    })
  } catch (error) {
    console.error("[twilio/status] Error al actualizar mensaje:", error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Mensaje no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "No se pudo actualizar el estado del mensaje" },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
