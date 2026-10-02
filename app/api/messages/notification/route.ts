import { NextRequest } from "next/server"

import { handleNotificationMessagePost } from "@/lib/api/handle-notification-message-post"

/** Notificación simple (plantilla {{1}}). */
export async function POST(request: NextRequest) {
  return handleNotificationMessagePost(request)
}
