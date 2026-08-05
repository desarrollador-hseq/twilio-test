import { NextRequest, NextResponse } from "next/server"
import { sendIndividualMessage } from "@/lib/actions/campaigns"

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    employeeId?: number
    templateId?: number
  }

  if (!body.employeeId || !body.templateId) {
    return NextResponse.json(
      { error: "employeeId y templateId son obligatorios." },
      { status: 400 }
    )
  }

  const result = await sendIndividualMessage(body.employeeId, body.templateId)

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result)
}
