import { NextRequest, NextResponse } from "next/server"
import { sendIndividualMessage } from "@/lib/actions/campaigns"

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    employeeId?: number
    templateId?: number
    contentVariables?: Record<string, string>
  }

  if (!body.employeeId || !body.templateId) {
    return NextResponse.json(
      { error: "employeeId y templateId son obligatorios." },
      { status: 400 }
    )
  }

  const staticOverrides: Record<string, string> = {}
  if (body.contentVariables && typeof body.contentVariables === "object") {
    for (const [key, value] of Object.entries(body.contentVariables)) {
      if (typeof value === "string") {
        staticOverrides[key] = value
      }
    }
  }

  const result = await sendIndividualMessage(
    body.employeeId,
    body.templateId,
    staticOverrides
  )

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result)
}
