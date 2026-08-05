export function normalizePhoneToE164(phone: string) {
  const cleaned = phone.replace(/[\s()-]/g, "")

  if (!cleaned) {
    return ""
  }

  if (cleaned.startsWith("+")) {
    return cleaned
  }

  // Colombia: 10 dígitos empezando por 3
  if (/^3\d{9}$/.test(cleaned)) {
    return `+57${cleaned}`
  }

  if (cleaned.startsWith("57") && /^57\d{10}$/.test(cleaned)) {
    return `+${cleaned}`
  }

  return `+${cleaned}`
}

export function normalizePhoneForInput(phone?: string) {
  if (!phone?.trim()) {
    return ""
  }

  return normalizePhoneToE164(phone.trim())
}

export function isValidE164Phone(phone: string) {
  return /^\+[1-9]\d{7,14}$/.test(phone)
}
