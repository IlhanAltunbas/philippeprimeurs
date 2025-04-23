import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Token doğrulama işlemi burada yapılacak
  // Şimdilik basit bir kontrol
  if (token.value === process.env.ADMIN_TOKEN) {
    return NextResponse.json({ status: "authenticated" })
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
} 