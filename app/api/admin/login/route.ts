import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Ortam değişkenlerini kullan
const JWT_SECRET = process.env.JWT_SECRET || "49ad02bfbd62dbaef4844c4dced26a4f47626cac23ab670a2e849b3fa3a2049c"
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    console.log('Login attempt:', { username, password: '******' }) // Şifreyi loglamıyoruz

    // Kullanıcı adı ve şifre kontrolü
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return new NextResponse(
        JSON.stringify({ error: "Geçersiz kullanıcı adı veya şifre" }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // JWT token oluştur
    const token = jwt.sign(
      { username, role: "admin" },
      JWT_SECRET,
      { expiresIn: "24h" }
    )

    return new NextResponse(
      JSON.stringify({
        access_token: token,
        token_type: "Bearer"
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error("Login error:", error)
    return new NextResponse(
      JSON.stringify({ error: "Giriş yapılırken bir hata oluştu" }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
} 