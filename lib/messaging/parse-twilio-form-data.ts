import { NextRequest } from "next/server"

function paramsToFormData(params: URLSearchParams) {
  const formData = new FormData()

  for (const [key, value] of params.entries()) {
    formData.append(key, value)
  }

  return formData
}

export async function parseTwilioFormData(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? ""

  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    return request.formData()
  }

  const rawBody = await request.text()

  if (!rawBody.trim()) {
    return new FormData()
  }

  return paramsToFormData(new URLSearchParams(rawBody))
}

export function formDataToRecord(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].map(([key, value]) => [key, value.toString()])
  )
}
