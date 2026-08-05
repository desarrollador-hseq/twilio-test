import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import {
  isOptInKeyword,
  isOptOutKeyword,
  parseInboundKeyword,
  twimlResponse,
} from "@/lib/messaging/opt-out"
import { parseTwilioFormData, formDataToRecord } from "@/lib/messaging/parse-twilio-form-data"
import { normalizePhoneToE164 } from "@/lib/phone"

function xmlResponse(message: string) {
  return new NextResponse(twimlResponse(message), {
    headers: { "Content-Type": "text/xml" },
  })
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "twilio-inbound",
    message: "Webhook activo. Twilio debe enviar POST con From y Body.",
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await parseTwilioFormData(request)
    const from = formData.get("From")?.toString() ?? ""
    const body = formData.get("Body")?.toString() ?? ""
    const messageSid = formData.get("MessageSid")?.toString() ?? null
    const smsMessageSid = formData.get("SmsMessageSid")?.toString() ?? null

    console.info("[twilio/inbound]", {
      messageSid,
      smsMessageSid,
      from,
      body,
      payload: formDataToRecord(formData),
    })

    if (!from) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    const phone = normalizePhoneToE164(from.replace(/^whatsapp:/i, ""))

    if (!phone) {
      return xmlResponse("No pudimos identificar tu número de teléfono.")
    }

    const keyword = parseInboundKeyword(body)

    if (!isOptOutKeyword(keyword) && !isOptInKeyword(keyword)) {
      return new NextResponse(null, { status: 204 })
    }

    const employees = await prisma.employee.findMany({
      where: { mobilePhone: phone, deletedAt: null },
    })

    if (employees.length === 0) {
      return xmlResponse("No encontramos tu número en nuestro sistema.")
    }

    if (isOptOutKeyword(keyword)) {
      await prisma.employee.updateMany({
        where: { mobilePhone: phone, deletedAt: null },
        data: {
          canSendWhatsapp: false,
          unsubscribedAt: new Date(),
          unsubscribeReason: `keyword:${keyword.toUpperCase()}`,
        },
      })

      return xmlResponse(
        "Has sido dado de baja de los mensajes de HSEQ. Responde ALTA si deseas volver a recibirlos."
      )
    }

    await prisma.employee.updateMany({
      where: { mobilePhone: phone, deletedAt: null },
      data: {
        canSendWhatsapp: true,
        unsubscribedAt: null,
        unsubscribeReason: null,
      },
    })

    return xmlResponse("Te has suscrito nuevamente a los mensajes de HSEQ.")
  } catch (error) {
    console.error("[twilio/inbound] Error al procesar mensaje:", error)

    return NextResponse.json(
      { error: "No se pudo procesar el mensaje entrante" },
      { status: 500 }
    )
  }
}
