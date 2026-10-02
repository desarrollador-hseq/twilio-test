import {
  hashApiApplicationToken,
  isApiApplicationTokenFormat,
} from "@/lib/api/api-application-token"
import { prisma } from "@/lib/prisma"

export function readMessagesApiToken(request: Request): string | null {
  const fromHeader = request.headers.get("x-api-key")?.trim()
  if (fromHeader) {
    return fromHeader
  }

  const authorization = request.headers.get("authorization")?.trim()
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice("bearer ".length).trim() || null
  }

  return null
}

export type MessagesApiAuthResult =
  | {
      ok: true
      application: { id: number; name: string }
    }
  | {
      ok: false
      status: 401 | 503
      error: string
    }

export async function authenticateMessagesApiRequest(
  request: Request
): Promise<MessagesApiAuthResult> {
  const token = readMessagesApiToken(request)

  if (!token) {
    return {
      ok: false,
      status: 401,
      error:
        "Falta token de API. Envía Authorization: Bearer <token> o la cabecera X-API-Key.",
    }
  }

  if (!isApiApplicationTokenFormat(token)) {
    return {
      ok: false,
      status: 401,
      error: "Formato de token inválido.",
    }
  }

  const tokenHash = hashApiApplicationToken(token)

  const application = await prisma.apiApplication.findFirst({
    where: {
      tokenHash,
      active: true,
      revokedAt: null,
    },
    select: { id: true, name: true },
  })

  if (!application) {
    return {
      ok: false,
      status: 401,
      error: "Token inválido, inactivo o revocado.",
    }
  }

  await prisma.apiApplication.update({
    where: { id: application.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    ok: true,
    application,
  }
}
