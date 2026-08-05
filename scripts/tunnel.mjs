import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import ngrok from "@ngrok/ngrok"
import "dotenv/config"

const PORT = 9000
const ENV_PATH = resolve(process.cwd(), ".env")

function updateEnvPublicUrl(publicUrl) {
  let content = readFileSync(ENV_PATH, "utf8")

  if (/^NEXT_PUBLIC_APP_URL=/m.test(content)) {
    content = content.replace(
      /^NEXT_PUBLIC_APP_URL=.*$/m,
      `NEXT_PUBLIC_APP_URL="${publicUrl}"`
    )
  } else {
    content += `\nNEXT_PUBLIC_APP_URL="${publicUrl}"\n`
  }

  writeFileSync(ENV_PATH, content, "utf8")
}

async function main() {
  const authtoken = process.env.NGROK_AUTHTOKEN?.trim()

  if (!authtoken) {
    console.error(`
❌ Falta NGROK_AUTHTOKEN en .env

Pasos:
  1. Crea cuenta gratis en https://dashboard.ngrok.com/signup
  2. Copia tu token en https://dashboard.ngrok.com/get-started/your-authtoken
  3. Agrégalo a .env:
     NGROK_AUTHTOKEN="tu_token_aqui"
`)
    process.exit(1)
  }

  console.log(`\n🚇 Iniciando túnel ngrok → localhost:${PORT}...\n`)

  const listener = await ngrok.forward({
    addr: PORT,
    authtoken,
  })

  const publicUrl = listener.url()

  if (!publicUrl) {
    throw new Error("ngrok no devolvió una URL pública.")
  }

  updateEnvPublicUrl(publicUrl)

  console.log("✅ Túnel activo")
  console.log(`   Pública:  ${publicUrl}`)
  console.log(`   Webhook:  ${publicUrl}/api/webhooks/twilio/status`)
  console.log(`   Webhook inbound:  ${publicUrl}/api/webhooks/twilio/inbound`)
  console.log(`   Local:    http://localhost:${PORT}`)
  console.log("\n📝 NEXT_PUBLIC_APP_URL actualizado en .env")
  console.log("⚠️  Reinicia 'npm run dev' si ya estaba corriendo.\n")
  console.log("   Mantén esta terminal abierta. Ctrl+C para detener.\n")

  const shutdown = async () => {
    console.log("\n🔌 Cerrando túnel ngrok...")
    await listener.close()
    process.exit(0)
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)

  // Mantener el proceso vivo
  process.stdin.resume()
}

main().catch((error) => {
  console.error("Error al iniciar ngrok:", error.message ?? error)
  process.exit(1)
})
