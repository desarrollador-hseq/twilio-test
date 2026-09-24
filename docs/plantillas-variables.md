# Plantillas WhatsApp y variables de contenido

Guía para registrar plantillas de Twilio Content y usarlas en campañas sin cambiar código.

## 1. Crear la plantilla en Twilio

1. Define el contenido en Twilio Content Template Builder con placeholders `{{1}}`, `{{2}}`, etc.
2. Obtén el **Content SID** (`HX…`) cuando esté aprobada para WhatsApp.

## 2. Registrar la plantilla en la app

1. Ve a **Plantillas → Nueva**.
2. Pega el **Content SID**.
3. Elige el **tipo de variables**:
   - **Saludo + imagen**: `{{1}}` nombre del empleado (automático), `{{2}}` path de media (campaña o default).
   - **Microcurso + enlace**: `{{1}}` nombre del curso, `{{2}}` URL de acceso (se piden al crear la campaña).
   - **Personalizado**: JSON con `key`, `label`, `kind` (`static`, `employee`, `media`).
4. Opcional: **Importar variables desde Twilio** (requiere credenciales Twilio en `.env`). Revisa el esquema sugerido antes de guardar.
5. Si el esquema incluye **media**, configura prefijo CDN y archivo por defecto.

## 3. Campaña masiva

1. **Campañas → Nueva** → empresa + plantilla.
2. El formulario muestra solo los campos que el esquema necesita (texto, URL, archivo multimedia).
3. Los valores fijos se guardan en la campaña y se combinan con datos del empleado al enviar.

## 4. Envío individual o prueba

- **UI**: en el detalle de la plantilla, **Enviar prueba** (`/plantillas/[id]/enviar`).
- **API**: `POST /api/messages/send` con cuerpo JSON:

```json
{
  "employeeId": 1,
  "templateId": 2,
  "contentVariables": {
    "1": "Nombre del curso",
    "2": "https://ejemplo.com/curso"
  }
}
```

`contentVariables` cubre las variables **static** del esquema. Variables `employee` y `media` se resuelven como en campañas.

## 5. Añadir una plantilla nueva (checklist)

- [ ] Placeholders en Twilio coinciden con `key` del esquema (`"1"`, `"2"`, …).
- [ ] Tipo de variables correcto o JSON personalizado validado.
- [ ] Prueba con **Enviar prueba** antes de una campaña grande.
- [ ] Para media: URL en Twilio = prefijo en plantilla + path en `{{n}}`.

## Referencia de `kind`

| kind       | Quién lo completa                          |
|-----------|-----------------------------------------------|
| `static`  | Campaña o envío individual / API              |
| `employee`| App (nombre del destinatario)                 |
| `media`   | Archivo de campaña o default de la plantilla  |

Código relacionado: `lib/messaging/template-variable-schema.ts`, `lib/messaging/twilio-content-schema.ts`.
