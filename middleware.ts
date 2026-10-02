import NextAuth from "next-auth"

import { authConfig } from "@/lib/auth.config"

export default NextAuth(authConfig).auth

export const config = {
  matcher: [
    "/((?!api/webhooks|api/auth|api/messages|_next/static|_next/image|favicon.ico).*)",
  ],
}
