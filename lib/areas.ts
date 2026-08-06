export function normalizeAreaName(name: string) {
  return name.trim().toLowerCase()
}

export function displayAreaName(name: string) {
  return name.trim().replace(/\s+/g, " ")
}
