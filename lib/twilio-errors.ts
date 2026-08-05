export function formatTwilioDeliveryError(
  errorCode?: number | string | null,
  errorMessage?: string | null,
  channelStatusMessage?: string | null
) {
  const parts: string[] = []

  if (errorCode !== undefined && errorCode !== null && errorCode !== "") {
    parts.push(`[${errorCode}]`)
  }

  if (errorMessage?.trim()) {
    parts.push(errorMessage.trim())
  }

  if (channelStatusMessage?.trim()) {
    parts.push(channelStatusMessage.trim())
  }

  const combined = parts.join(" ").trim()
  if (!combined) {
    return null
  }

  return formatTwilioError(new Error(combined))
}

export function formatTwilioError(error: unknown) {
  const message = error instanceof Error ? error.message : "Error desconocido"

  if (message.includes("could not find a Channel with the specified From")) {
    return [
      "Twilio no reconoce el número remitente (TWILIO_WHATSAPP_FROM).",
      "Debe ser el número WhatsApp de Twilio (sandbox o Business), NO tu celular personal.",
      "Consola Twilio → Messaging → Senders → WhatsApp senders.",
      "Sandbox de prueba: suele ser whatsapp:+14155238886",
    ].join(" ")
  }

  if (message.includes("not a valid phone number")) {
    return "Número de teléfono del empleado inválido. Usa formato internacional, ej: +573001234567."
  }

  if (
    message.includes("63015") ||
    message.includes("joined the Sandbox") ||
    message.includes("Account not associated with a sandbox")
  ) {
    return [
      "Sandbox de WhatsApp: el destinatario no se ha unido al sandbox (error 63015).",
      "Desde cada celular de prueba envía por WhatsApp el código de unión (ej. join palabra-clave)",
      "al número +1 415 523 8886. Actívalo en Twilio Console → Messaging → Try it out → WhatsApp.",
      "Nota: las plantillas ContentSid de producción (+15559683188) no funcionan en sandbox;",
      "para campañas reales usa TWILIO_WHATSAPP_FROM=whatsapp:+15559683188.",
    ].join(" ")
  }

  if (message.includes("63112") || message.includes("Meta disabled the WhatsApp Business Account")) {
    return [
      "Meta deshabilitó la cuenta de WhatsApp Business vinculada a tu remitente en Twilio (error 63112).",
      "No es un fallo de la aplicación: debes reactivar la cuenta en Meta Business / WhatsApp Manager",
      "o contactar soporte de Twilio. Para pruebas puedes usar el sandbox de Twilio (+14155238886).",
    ].join(" ")
  }

  if (message.includes("Unable to create record")) {
    return message
  }

  return message
}
