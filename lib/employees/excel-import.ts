import * as XLSX from "xlsx"

import {
  normalizeNationalId,
  nationalIdValidationError,
} from "@/lib/national-id"
import { isValidE164Phone, normalizePhoneToE164 } from "@/lib/phone"

export type ExcelEmployeeRow = {
  rowNumber: number
  firstName: string
  lastName: string
  nationalId: string
  mobilePhone: string
  email: string
  areaName: string
  canSendWhatsapp: boolean
  canSendEmail: boolean
}

export type ExcelRowError = {
  rowNumber: number
  message: string
}

const HEADER_ALIASES: Record<string, string> = {
  nombres: "firstName",
  nombre: "firstName",
  primer_nombre: "firstName",
  firstname: "firstName",
  first_name: "firstName",
  apellidos: "lastName",
  apellido: "lastName",
  lastname: "lastName",
  last_name: "lastName",
  nombre_completo: "fullName",
  cedula: "nationalId",
  documento: "nationalId",
  n_identificacion: "nationalId",
  no_identificacion: "nationalId",
  numero_identificacion: "nationalId",
  nationalid: "nationalId",
  national_id: "nationalId",
  telefono: "mobilePhone",
  celular: "mobilePhone",
  mobilephone: "mobilePhone",
  mobile_phone: "mobilePhone",
  phone: "mobilePhone",
  numero_activo_de_whastapp: "mobilePhone",
  numero_activo_de_whatsapp: "mobilePhone",
  whatsapp_number: "mobilePhone",
  correo: "email",
  correo_electronico: "email",
  email: "email",
  mail: "email",
  area: "areaName",
  areaname: "areaName",
  area_a_la_que_pertenece: "areaName",
  whatsapp: "canSendWhatsapp",
  cansendwhatsapp: "canSendWhatsapp",
  correo_notif: "canSendEmail",
  email_notif: "canSendEmail",
  cansendemail: "canSendEmail",
}

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[°º]/g, "")
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function cellToString(value: unknown) {
  if (value == null) return ""
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? String(value)
      : String(value).trim()
  }
  return String(value).trim()
}

function parseBoolean(value: unknown, defaultValue: boolean) {
  if (value == null || value === "") return defaultValue
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0

  const normalized = String(value).trim().toLowerCase()
  if (["1", "true", "si", "sí", "yes", "y", "activo"].includes(normalized)) {
    return true
  }
  if (["0", "false", "no", "n", "inactivo"].includes(normalized)) {
    return false
  }
  return defaultValue
}

function titleCaseWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLocaleLowerCase("es-CO")
      return lower.charAt(0).toLocaleUpperCase("es-CO") + lower.slice(1)
    })
    .join(" ")
}

function deriveLastName(fullName: string, firstName: string) {
  const fullParts = fullName.trim().split(/\s+/).filter(Boolean)
  const firstToken = firstName.trim().split(/\s+/)[0]?.toLowerCase()

  if (fullParts.length <= 1) {
    return titleCaseWords(fullParts[0] ?? firstName) || "Sin apellido"
  }

  if (firstToken && fullParts[0]?.toLowerCase() === firstToken) {
    return titleCaseWords(fullParts.slice(1).join(" "))
  }

  return titleCaseWords(fullParts.slice(1).join(" "))
}

function parsePhoneCell(raw: string) {
  const value = raw.trim()
  if (!value) {
    return { mobilePhone: "", hasPhone: false as const }
  }

  const normalizedText = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  if (
    normalizedText.includes("no tiene") ||
    normalizedText === "n/a" ||
    normalizedText === "na" ||
    normalizedText === "-" ||
    normalizedText === "sin numero" ||
    normalizedText === "ninguno"
  ) {
    return { mobilePhone: "", hasPhone: false as const }
  }

  const mobilePhone = normalizePhoneToE164(value)
  if (!isValidE164Phone(mobilePhone)) {
    return { mobilePhone: "", hasPhone: false as const, invalid: true as const }
  }

  return { mobilePhone, hasPhone: true as const }
}

export function parseEmployeesExcel(buffer: Buffer): {
  rows: ExcelEmployeeRow[]
  errors: ExcelRowError[]
} {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false })
  const sheetName = workbook.SheetNames[0]

  if (!sheetName) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: "El archivo Excel no tiene hojas." }],
    }
  }

  const sheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(
    sheet,
    { header: 1, defval: "", raw: false }
  )

  if (matrix.length < 2) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 0,
          message:
            "El archivo debe incluir una fila de encabezados y al menos un empleado.",
        },
      ],
    }
  }

  const headers = (matrix[0] ?? []).map(normalizeHeader)
  const columnMap = new Map<number, string>()

  headers.forEach((header, index) => {
    const field = HEADER_ALIASES[header]
    if (field) {
      columnMap.set(index, field)
    }
  })

  const mappedFields = new Set(columnMap.values())
  const hasIdentity =
    mappedFields.has("nationalId") &&
    mappedFields.has("email") &&
    mappedFields.has("areaName") &&
    (mappedFields.has("firstName") || mappedFields.has("fullName")) &&
    (mappedFields.has("lastName") || mappedFields.has("fullName"))

  if (!hasIdentity) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 1,
          message:
            "Faltan columnas obligatorias. Usa: nombres, apellidos, cedula, correo, area (telefono opcional). También se acepta nombre completo + primer nombre.",
        },
      ],
    }
  }

  const rows: ExcelEmployeeRow[] = []
  const errors: ExcelRowError[] = []
  const seenNationalIds = new Set<string>()

  for (let i = 1; i < matrix.length; i++) {
    const rowNumber = i + 1
    const rawRow = matrix[i] ?? []
    const isEmpty = rawRow.every((cell) => cellToString(cell) === "")
    if (isEmpty) continue

    const values: Record<string, string | boolean> = {
      canSendWhatsapp: true,
      canSendEmail: true,
    }

    for (const [index, field] of columnMap.entries()) {
      const cell = rawRow[index]
      if (field === "canSendWhatsapp" || field === "canSendEmail") {
        values[field] = parseBoolean(cell, true)
      } else {
        values[field] = cellToString(cell)
      }
    }

    const fullName = String(values.fullName ?? "").trim()
    let firstName = String(values.firstName ?? "").trim()
    let lastName = String(values.lastName ?? "").trim()
    const nationalId = normalizeNationalId(String(values.nationalId ?? ""))
    const email = String(values.email ?? "").trim()
    const areaName = String(values.areaName ?? "").trim()
    const rawPhone = String(values.mobilePhone ?? "").trim()

    if (fullName) {
      if (!firstName) {
        firstName = titleCaseWords(fullName.split(/\s+/)[0] ?? "")
      } else {
        firstName = titleCaseWords(firstName)
      }
      if (!lastName) {
        lastName = deriveLastName(fullName, firstName)
      } else {
        lastName = titleCaseWords(lastName)
      }
    } else {
      firstName = titleCaseWords(firstName)
      lastName = titleCaseWords(lastName)
    }

    const phoneResult = parsePhoneCell(rawPhone)

    if (!firstName || !lastName || !email || !areaName) {
      errors.push({
        rowNumber,
        message:
          "Faltan campos obligatorios (nombres/apellidos, correo o área).",
      })
      continue
    }

    const nationalIdError = nationalIdValidationError(nationalId)
    if (nationalIdError) {
      errors.push({ rowNumber, message: nationalIdError })
      continue
    }

    if (!email.includes("@")) {
      errors.push({ rowNumber, message: "Correo inválido." })
      continue
    }

    if (phoneResult.invalid) {
      errors.push({
        rowNumber,
        message:
          "Teléfono inválido. Déjalo vacío o usa formato con indicativo, ej: 3001234567.",
      })
      continue
    }

    if (seenNationalIds.has(nationalId)) {
      errors.push({
        rowNumber,
        message: `Cédula duplicada en el archivo (${nationalId}).`,
      })
      continue
    }
    seenNationalIds.add(nationalId)

    const canSendWhatsapp = phoneResult.hasPhone
      ? Boolean(values.canSendWhatsapp ?? true)
      : false

    rows.push({
      rowNumber,
      firstName,
      lastName,
      nationalId,
      mobilePhone: phoneResult.mobilePhone,
      email,
      areaName,
      canSendWhatsapp,
      canSendEmail: Boolean(values.canSendEmail ?? true),
    })
  }

  return { rows, errors }
}

export const EMPLOYEE_EXCEL_TEMPLATE_HEADERS = [
  "nombres",
  "apellidos",
  "cedula",
  "telefono",
  "correo",
  "area",
  "whatsapp",
  "correo_notif",
] as const
