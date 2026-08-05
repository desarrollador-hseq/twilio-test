export const OPT_OUT_KEYWORDS = [
  "baja",
  "stop",
  "cancelar",
  "unsubscribe",
  "salir",
] as const

export const OPT_IN_KEYWORDS = [
  "alta",
  "start",
  "suscribir",
  "subscribe",
] as const

export function parseInboundKeyword(body: string) {
  return body.trim().toLowerCase().split(/\s+/)[0] ?? ""
}

export function isOptOutKeyword(keyword: string) {
  return OPT_OUT_KEYWORDS.includes(keyword as (typeof OPT_OUT_KEYWORDS)[number])
}

export function isOptInKeyword(keyword: string) {
  return OPT_IN_KEYWORDS.includes(keyword as (typeof OPT_IN_KEYWORDS)[number])
}

export function escapeTwiml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export function twimlResponse(message: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeTwiml(message)}</Message></Response>`
}
