import { createHash, randomBytes } from "crypto"

const TOKEN_PREFIX = "hseq_"

export function generateApiApplicationToken() {
  return `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`
}

export function hashApiApplicationToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function apiApplicationTokenPrefix(token: string, visibleLength = 16) {
  return token.slice(0, visibleLength)
}

export function isApiApplicationTokenFormat(token: string) {
  return token.startsWith(TOKEN_PREFIX) && token.length > TOKEN_PREFIX.length + 16
}
