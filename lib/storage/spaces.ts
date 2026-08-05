import {
  PutObjectCommand,
  S3Client,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3"

import { getSpacesConfig, isSpacesConfigured } from "@/lib/env"
import { validateCampaignMediaFile } from "@/lib/storage/media-validation"

export { validateCampaignMediaFile, type MediaValidationResult } from "@/lib/storage/media-validation"

let client: S3Client | null = null

function getSpacesClient() {
  if (!isSpacesConfigured()) {
    throw new Error("DigitalOcean Spaces no está configurado.")
  }

  if (!client) {
    const config = getSpacesConfig()
    client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: false,
    })
  }

  return client
}

function sanitizeFileName(name: string) {
  const baseName = name.split(/[/\\]/).pop() ?? "archivo"
  return baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120)
}

export async function uploadCampaignMedia(file: File): Promise<string> {
  const validation = validateCampaignMediaFile(file)
  if (!validation.ok) {
    throw new Error(validation.error)
  }

  const config = getSpacesConfig()
  const safeName = sanitizeFileName(file.name) || "archivo"
  const key = `${config.prefix}/${Date.now()}-${safeName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const input: PutObjectCommandInput = {
    Bucket: config.bucket,
    Key: key,
    Body: buffer,
    ContentType: file.type,
    ACL: "public-read",
  }

  await getSpacesClient().send(new PutObjectCommand(input))

  const cdnBase = config.cdnUrl.replace(/\/$/, "")
  return `${cdnBase}/${key}`
}
