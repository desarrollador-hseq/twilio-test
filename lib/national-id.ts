/** Deja solo dígitos: quita puntos, comas, espacios y otros caracteres. */
export function normalizeNationalId(value: string) {
  return value.replace(/\D/g, "")
}

export function isValidNationalId(value: string) {
  return /^\d{5,15}$/.test(value)
}

export function nationalIdValidationError(value: string) {
  if (!value) {
    return "La cédula es obligatoria."
  }

  if (!/^\d+$/.test(value)) {
    return "La cédula solo puede contener números."
  }

  if (value.length < 5 || value.length > 15) {
    return "La cédula debe tener entre 5 y 15 dígitos."
  }

  return null
}
