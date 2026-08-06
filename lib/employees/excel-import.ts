import * as XLSX from "xlsx"

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

const HEADER_ALIASES: Record<string, keyof Omit<ExcelEmployeeRow, "rowNumber">> =
  {
    nombres: "firstName",
    nombre: "firstName",
    firstname: "firstName",
    first_name: "firstName",
    apellidos: "lastName",
    apellido: "lastName",
    lastname: "lastName",
    last_name: "lastName",
    cedula: "nationalId",
    cédula: "nationalId",
    documento: "nationalId",
    nationalid: "nationalId",
    national_id: "nationalId",
    telefono: "mobilePhone",
    teléfono: "mobilePhone",
    celular: "mobilePhone",
    mobilephone: "mobilePhone",
    mobile_phone: "mobilePhone",
    phone: "mobilePhone",
    correo: "email",
    email: "email",
    mail: "email",
    area: "areaName",
    área: "areaName",
    areaname: "areaName",
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
    .replace(/\s+/g, "_")
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
          message: "El archivo debe incluir una fila de encabezados y al menos un empleado.",
        },
      ],
    }
  }

  const headers = (matrix[0] ?? []).map(normalizeHeader)
  const columnMap = new Map<number, keyof Omit<ExcelEmployeeRow, "rowNumber">>()

  headers.forEach((header, index) => {
    const field = HEADER_ALIASES[header]
    if (field) {
      columnMap.set(index, field)
    }
  })

  const requiredFields = [
    "firstName",
    "lastName",
    "nationalId",
    "mobilePhone",
    "email",
    "areaName",
  ] as const

  const missingHeaders = requiredFields.filter(
    (field) => ![...columnMap.values()].includes(field)
  )

  if (missingHeaders.length > 0) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 1,
          message: `Faltan columnas obligatorias: ${missingHeaders.join(", ")}. Usa: nombres, apellidos, cedula, telefono, correo, area.`,
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

    const values: Partial<ExcelEmployeeRow> = {
      rowNumber,
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

    const firstName = values.firstName?.trim() ?? ""
    const lastName = values.lastName?.trim() ?? ""
    const nationalId = values.nationalId?.trim() ?? ""
    const email = values.email?.trim() ?? ""
    const areaName = values.areaName?.trim() ?? ""
    const mobilePhone = normalizePhoneToE164(values.mobilePhone?.trim() ?? "")

    if (!firstName || !lastName || !nationalId || !mobilePhone || !email || !areaName) {
      errors.push({
        rowNumber,
        message: "Faltan campos obligatorios (nombres, apellidos, cédula, teléfono, correo o área).",
      })
      continue
    }

    if (!email.includes("@")) {
      errors.push({ rowNumber, message: "Correo inválido." })
      continue
    }

    if (!isValidE164Phone(mobilePhone)) {
      errors.push({
        rowNumber,
        message: "Teléfono inválido. Usa formato con indicativo, ej: +573001234567 o 3001234567.",
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

    rows.push({
      rowNumber,
      firstName,
      lastName,
      nationalId,
      mobilePhone,
      email,
      areaName,
      canSendWhatsapp: values.canSendWhatsapp ?? true,
      canSendEmail: values.canSendEmail ?? true,
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

