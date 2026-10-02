import { NextRequest } from "next/server"

import { handleDetailedNotificationMessagePost } from "@/lib/api/handle-detailed-notification-message-post"

/** @deprecated Usa POST /api/messages/hseqcloud/notification-detail */
export async function POST(request: NextRequest) {
  return handleDetailedNotificationMessagePost(request)
}
