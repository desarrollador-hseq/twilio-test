import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Videos de campaña hasta 16 MB + margen del formulario multipart
      bodySizeLimit: "20mb",
    },
  },
}

export default nextConfig
