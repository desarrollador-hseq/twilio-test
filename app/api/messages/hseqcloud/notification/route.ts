import { NextRequest } from "next/server"

import { handleNotificationMessagePost } from "@/lib/api/handle-notification-message-post"

/** @deprecated Usa POST /api/messages/notification */
export async function POST(request: NextRequest) {
  return handleNotificationMessagePost(request)
}
