# Plantillas WhatsApp y variables de contenido

Guía para registrar plantillas de Twilio Content y usarlas en campañas sin cambiar código.

## 1. Crear la plantilla en Twilio

1. Define el contenido en Twilio Content Template Builder con placeholders `{{1}}`, `{{2}}`, etc.
2. Obtén el **Content SID** (`HX…`) cuando esté aprobada para WhatsApp.

## 2. Registrar la plantilla en la app

1. Ve a **Plantillas → Nueva**.
2. Pega el **Content SID**.
3. Configura el **armador de variables**: por cada `{{n}}` elige origen (nombre, área, empresa, texto/URL de campaña, media). Puedes usar los botones de ejemplo o importar desde Twilio. JSON avanzado opcional.
4. Opcional: **Importar variables desde Twilio** (requiere credenciales Twilio en `.env`). Revisa el esquema sugerido antes de guardar.
5. En variables **Imagen o video** del armador, configura prefijo CDN (p. ej. `…/ws/`) y archivo por defecto por cada `{{n}}`.

## 3. Campaña masiva

1. **Campañas → Nueva** → empresa + plantilla.
2. El formulario muestra solo los campos que el esquema necesita (texto, URL, archivo multimedia).
3. Los valores fijos se guardan en la campaña y se combinan con datos del empleado al enviar.

## 4. Envío individual o prueba

- **UI**: en el detalle de la plantilla, **Enviar prueba** (`/plantillas/[id]/enviar`).
- **API**: `POST /api/messages/send` con token de aplicación registrada (ver **Integraciones** en la app) y cuerpo JSON:

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

### Notificaciones desde otra aplicación

Plantilla típica en Twilio (utility/notificación):

- Cuerpo: `Notificación: {{1}}` + firma fija `Grupo HSEQ`
- Content SID de ejemplo: `HXd3c876275a784751fb9e7d200aaf7fc9`
- En **Plantillas → Nueva**: pega el Content SID y define una sola variable estática `{{1}}` (texto de la notificación). Puedes importar el esquema desde Twilio o usar JSON:

```json
[
  {
    "key": "1",
    "label": "Texto de la notificación",
    "kind": "static",
    "input": "textarea",
    "required": true
  }
]
```

Flujo:

1. **Integraciones**: el administrador registra la app externa y copia el token.
2. **API**: `POST /api/messages/notification` con `Authorization: Bearer <token>` o `X-API-Key: <token>`.
3. En `.env`: `NOTIFICATION_CONTENT_SID` (la app la registra sola en Plantillas la primera vez que envías; también puedes crearla manualmente). El texto va en `text` → `{{1}}`. **Reinicia el servidor** tras cambiar `.env`.

```json
{
  "phone": "3001234567",
  "text": "Se te asignó el presupuesto para el mes de febrero."
}
```

`phone`: destinatario en E.164 o móvil Colombia (10 dígitos). **No** tiene que estar registrado como empleado; se envía al número indicado (sujeto a reglas de WhatsApp/Twilio).

El mensaje al usuario quedará: *Notificación: Se te asignó…* + *Grupo HSEQ* (según la plantilla aprobada).

Opcional: `"templateId"` en el cuerpo para otra plantilla.

### HSEQ Cloud — notificación detallada (app externa)

Plantilla con saludo, empresa, asunto y cuerpo (`{{1}}`–`{{4}}`):

- **API**: `POST /api/messages/hseqcloud/notification-detail` (mismo token de Integraciones).
- **`.env`**: `DETAILED_NOTIFICATION_CONTENT_SID=<Content SID HX…>`.

```json
{
  "phone": "3001234567",
  "recipientName": "María García",
  "companyName": "Logística del Pacífico Ltda.",
  "subject": "Firma pendiente en ATS",
  "message": "Tienes una solicitud de firma para autorizar el ATS..."
}
```

| Campo API | Variable Twilio |
|-----------|-----------------|
| `recipientName` | `{{1}}` |
| `companyName` | `{{2}}` |
| `subject` | `{{3}}` |
| `message` | `{{4}}` |

## 5. Añadir una plantilla nueva (checklist)

- [ ] Placeholders en Twilio coinciden con `key` del esquema (`"1"`, `"2"`, …).
- [ ] Tipo de variables correcto o JSON personalizado validado.
- [ ] Prueba con **Enviar prueba** antes de una campaña grande.
- [ ] Para media: por defecto la app envía **URL HTTPS completa** en `{{n}}` (formato `fullUrl`). Usa solo path si en Twilio la Media URL es prefijo + variable y el archivo vive bajo ese prefijo.

## Referencia de `kind`

| kind       | Quién lo completa                          |
|-----------|-----------------------------------------------|
| `static`  | Campaña o envío individual / API              |
| `employee`| App (nombre, apellidos, email, área, etc.)    |
| `company` | App (razón social del empleado)               |
| `media`   | Archivo de campaña o default de la plantilla  |

Código relacionado: `lib/messaging/template-variable-schema.ts`, `lib/messaging/twilio-content-schema.ts`.
