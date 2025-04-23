import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    // Form alanlarını kontrol et
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires' },
        { status: 400 }
      );
    }

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
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // E-posta gönder
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"${name}" <${email}>`,
      to: process.env.EMAIL_TO || 'contact@yourwebsite.com',
      subject: `Nouveau message: ${subject}`,
      html: htmlContent,
      replyTo: email
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'envoi du message' },
      { status: 500 }
    );
  }
} 