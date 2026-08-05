export const TEMPLATE_STATUSES = ["pending", "approved", "rejected"] as const
export const TEMPLATE_TYPES = ["whatsapp", "sms"] as const
export const CAMPAIGN_STATUSES = [
  "draft",
  "sending",
  "completed",
  "failed",
] as const
export const CAMPAIGN_CHANNELS = ["whatsapp", "email"] as const
export const MESSAGE_STATUSES = [
  "queued",
  "sent",
  "delivered",
  "read",
  "failed",
  "undelivered",
] as const

export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number]
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]
export type MessageStatus = (typeof MESSAGE_STATUSES)[number]

export const TWILIO_STATUS_MAP: Record<string, MessageStatus> = {
  queued: "queued",
  sending: "sent",
  sent: "sent",
  delivered: "delivered",
  read: "read",
  failed: "failed",
  undelivered: "undelivered",
}
