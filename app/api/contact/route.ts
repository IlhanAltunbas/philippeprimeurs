import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const TURNSTILE_VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const SECRET_KEY = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

export async function POST(req: Request) {
  let turnstileToken: string | undefined;
  let name: string | undefined;
  let email: string | undefined;
  let subject: string | undefined;
  let message: string | undefined;

  try {
    const body = await req.json();
    // Destructure body safely
    ({ name, email, subject, message, turnstileToken } = body);

    // Alan kontrolü (Token dahil)
    if (!name || !email || !subject || !message || !turnstileToken) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires, y compris la vérification CAPTCHA' },
        { status: 400 }
      );
    }

    // Turnstile Doğrulama
    if (!SECRET_KEY) {
       console.error('CLOUDFLARE_TURNSTILE_SECRET_KEY ortam değişkeni ayarlanmamış.');
       throw new Error('Sunucu yapılandırma hatası.');
    }

    const turnstileResponse = await fetch(TURNSTILE_VERIFY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: SECRET_KEY,
        response: turnstileToken,
        // Gerekirse remoteip: req.headers.get('x-forwarded-for') ekleyebilirsiniz
      }),
    });

    const turnstileData = await turnstileResponse.json();

    if (!turnstileData.success) {
      console.error('Turnstile doğrulaması başarısız:', turnstileData);
      return NextResponse.json(
        { error: 'Échec de la vérification CAPTCHA' },
        { status: 403 } // 403 Forbidden daha uygun olabilir
      );
    }
    
    // --- Turnstile doğrulaması başarılı, e-posta gönderme işlemine devam et ---

    // E-posta düzeni oluştur
    const htmlContent = `
      <h1>Nouveau message de contact</h1>
      <p><strong>Nom:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Sujet:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;

    // Transporter oluştur
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // secure true for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      // Gerekirse TLS ayarları
      // tls: {
      //   rejectUnauthorized: false // Güvenilir olmayan sertifikalar için (geliştirme ortamında)
      // }
    });

    // E-posta gönder
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"${name}" <${email}>`,
      to: process.env.EMAIL_TO, // Alıcı e-posta adresini ortam değişkeninden alın
      subject: `Nouveau message: ${subject}`,
      html: htmlContent,
      replyTo: email
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('İstek işleme hatası:', error);
    // Turnstile doğrulaması başarılı olsa bile e-posta gönderirken hata olabilir
    const errorMessage = error instanceof Error ? error.message : 'Une erreur interne est survenue';
    // Hata mesajını daha spesifik hale getirebiliriz
    let status = 500;
    if (errorMessage.includes('CAPTCHA') || errorMessage.includes('vérification')) {
        status = 403;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: status }
    );
  }
} 