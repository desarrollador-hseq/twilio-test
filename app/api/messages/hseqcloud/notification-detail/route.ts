import { NextRequest } from "next/server"

import { handleDetailedNotificationMessagePost } from "@/lib/api/handle-detailed-notification-message-post"

/** HSEQ Cloud — notificación detallada (plantilla {{1}}–{{4}}). */
export async function POST(request: NextRequest) {
  return handleDetailedNotificationMessagePost(request)
}
