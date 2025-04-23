import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Decimal } from '@prisma/client/runtime/library';

// Order data tipini tanımla
interface OrderCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  message?: string;
}

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  unit?: string;
  origin?: string;
  isComposite?: boolean;
  contents?: Array<{
    name: string;
    quantity: string;
    origin?: string;
  }>;
}

interface OrderData {
  customer: OrderCustomer;
  items: OrderItem[];
  total: number;
  pickupDate: string;
  pickupTime: string;
}

// E-posta önbelleği - aynı içeriği tekrar göndermeyi önler
const emailCache = new Set<string>();

// E-posta işleyici sınıfı - birden fazla e-posta gönderme işlemini optimize eder
class EmailSender {
  private transporter: nodemailer.Transporter | null = null;
  private initialized = false;
  
  constructor() {
    // Yapılandırma transporter'ı lazy init ile oluşturulacak
  }
  
  private async init() {
    if (!this.initialized) {
      try {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
          pool: true, // Bağlantı havuzu kullan
          maxConnections: 5, // Aynı anda en fazla 5 bağlantı
          maxMessages: 100 // Bağlantı başına maksimum mesaj sayısı
        });
        
        this.initialized = true;
      } catch (error) {
        console.error("E-posta transporter oluşturma hatası:", error);
        throw new Error("E-posta servisine bağlanılamadı");
      }
    }
  }
  
  // Mesajın özet anahtarını oluştur
  private getMessageHash(to: string, subject: string, body: string): string {
    return `${to}:${subject}:${body.length}`;
  }
  
  // E-posta gönder
  async sendMail(options: nodemailer.SendMailOptions): Promise<boolean> {
    try {
      await this.init();
      
      // Önbellekte kontrol et
      const messageHash = this.getMessageHash(
        options.to as string, 
        options.subject as string, 
        options.html as string
      );
      
      // Son 1 dakika içinde aynı e-postayı tekrar gönderme
      if (emailCache.has(messageHash)) {
        console.log("Bu e-posta zaten yakın zamanda gönderildi, tekrarlanmadı");
        return true;
      }
      
      // Transporter'ın başarıyla oluşturulduğundan emin ol
      if (!this.transporter) {
        throw new Error("E-posta transporter'ı başlatılamadı");
      }
      
      // E-posta gönder
      await this.transporter.sendMail(options);
      
      // Önbelleğe ekle
      emailCache.add(messageHash);
      setTimeout(() => emailCache.delete(messageHash), 60 * 1000);
      
      return true;
    } catch (error) {
      console.error("E-posta gönderme hatası:", error);
      return false;
    }
  }
}

// Tek örnek oluştur
const emailSender = new EmailSender();

// Email gönderme fonksiyonu
async function sendOrderEmail(orderData: OrderData, orderId: string | number, isStoreEmail = false) {
  try {
    // Ürünlerin HTML tablosunu oluştur
    const itemsHtml = orderData.items.map(item => {
      // Alt içerik HTML'i oluştur (eğer bileşik ürünse)
      let contentsHtml = '';
      if (item.isComposite && item.contents && item.contents.length > 0) {
        contentsHtml = `
          <tr>
            <td colspan="4" style="padding: 10px; background-color: #f9f9f9;">
              <div style="font-size: 14px; color: #555;">
                <p style="margin: 0; font-weight: bold;">Contenu du produit:</p>
                <ul style="margin: 5px 0 0 20px; padding: 0;">
                  ${item.contents.map(content => `
                    <li>${content.name} - ${content.quantity}${content.origin ? ` (${content.origin})` : ''}</li>
                  `).join('')}
                </ul>
              </div>
            </td>
          </tr>
        `;
      }

      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <div>
              <p style="margin: 0; font-weight: bold;">${item.name}</p>
              ${item.origin ? `<p style="margin: 0; font-size: 13px; color: #4a9d5c;"><strong>Origine:</strong> ${item.origin}</p>` : ''}
              ${item.unit ? `<p style="margin: 0; font-size: 12px; color: #666;">Unité: ${item.unit}</p>` : ''}
            </div>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.price.toFixed(2)} €</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${(item.price * item.quantity).toFixed(2)} €</td>
        </tr>
        ${contentsHtml}
      `;
    }).join('');

    // Teslimat tarihini formatla
    const pickupDate = orderData.pickupDate 
      ? format(new Date(orderData.pickupDate), 'dd MMMM yyyy', { locale: fr }) 
      : '';

    // E-posta içeriği
    let subject, htmlContent;
    
    if (isStoreEmail) {
      // Mağaza için e-posta
      subject = `Nouvelle commande #${orderId}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4a9d5c; text-align: center; padding-bottom: 20px; border-bottom: 2px solid #eee;">Nouvelle Commande #${orderId}</h1>
          
          <div style="padding: 20px 0;">
            <h2 style="color: #333;">Détails du client:</h2>
            <p><strong>Nom:</strong> ${orderData.customer.firstName} ${orderData.customer.lastName}</p>
            <p><strong>Email:</strong> ${orderData.customer.email}</p>
            <p><strong>Téléphone:</strong> ${orderData.customer.countryCode}${orderData.customer.phone}</p>
            <p><strong>Message:</strong> ${orderData.customer.message || 'Aucun message'}</p>
          </div>

          <div style="padding: 20px 0;">
            <h2 style="color: #333;">Détails de la commande:</h2>
            <p><strong>Date de retrait:</strong> ${pickupDate}</p>
            <p><strong>Heure de retrait:</strong> ${orderData.pickupTime}</p>
            <p><strong>Montant total:</strong> ${orderData.total.toFixed(2)} €</p>
          </div>

          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f3f3f3;">
                <th style="padding: 10px; text-align: left;">Produit</th>
                <th style="padding: 10px; text-align: left;">Quantité</th>
                <th style="padding: 10px; text-align: left;">Prix unitaire</th>
                <th style="padding: 10px; text-align: left;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 10px; font-weight: bold;">${orderData.total.toFixed(2)} €</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    } else {
      // Müşteri için e-posta
      subject = `Confirmation de votre commande #${orderId}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4a9d5c; text-align: center; padding-bottom: 20px; border-bottom: 2px solid #eee;">Merci pour votre commande!</h1>
          
          <p style="font-size: 16px; line-height: 1.5;">Cher(e) ${orderData.customer.firstName},</p>
          
          <p style="font-size: 16px; line-height: 1.5;">Nous avons bien reçu votre commande et nous la préparons avec soin. Voici un récapitulatif de votre commande:</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Numéro de commande:</strong> #${orderId}</p>
            <p><strong>Date de retrait:</strong> ${pickupDate}</p>
            <p><strong>Heure de retrait:</strong> ${orderData.pickupTime}</p>
            <p><strong>Montant total:</strong> ${orderData.total.toFixed(2)} €</p>
          </div>

          <h2 style="color: #333;">Résumé de votre commande:</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f3f3f3;">
                <th style="padding: 10px; text-align: left;">Produit</th>
                <th style="padding: 10px; text-align: left;">Quantité</th>
                <th style="padding: 10px; text-align: left;">Prix unitaire</th>
                <th style="padding: 10px; text-align: left;">Total estimé</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total estimé:</td>
                <td style="padding: 10px; font-weight: bold;">${orderData.total.toFixed(2)} €</td>
              </tr>
            </tfoot>
          </table>

          <p style="font-size: 16px; line-height: 1.5; margin-top: 30px;">Nous vous attendrons à notre magasin pour retirer votre commande à la date et l'heure prévues.</p>
          
          <p style="font-size: 16px; line-height: 1.5;">Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          
          <p style="font-size: 16px; line-height: 1.5;">Cordialement,<br>L'équipe de Philippe Primeurs</p>
        </div>
      `;
    }

    // E-posta gönder
    const emailResult = await emailSender.sendMail({
      from: process.env.EMAIL_FROM,
      to: isStoreEmail ? process.env.EMAIL_TO : orderData.customer.email,
      subject: subject,
      html: htmlContent,
    });

    if (emailResult) {
      console.log(`E-posta ${isStoreEmail ? 'mağazaya' : 'müşteriye'} başarıyla gönderildi`);
    }
    return emailResult;
  } catch (error) {
    console.error(`E-posta gönderme hatası (${isStoreEmail ? 'mağaza' : 'müşteri'})`, error);
    return false;
  }
}

// Çok hafif önbellek sistemi (1 dakika)
let ordersCache: any = null;
let ordersCacheTime = 0;
const ORDERS_CACHE_TTL = 60 * 1000; // 1 dakika

export async function GET() {
  try {
    // Önbellek kontrolü
    const now = Date.now();
    if (ordersCache && (now - ordersCacheTime < ORDERS_CACHE_TTL)) {
      return NextResponse.json(ordersCache);
    }
    
    // Son 3 aya ait siparişleri getir
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    // Tüm siparişleri ve ilişkili müşteri bilgilerini getir - daha optimize sorgu
    const orders = await prisma.order.findMany({
      where: {
        created_at: {
          gte: threeMonthsAgo
        }
      },
      select: {
        id: true,
        status: true,
        total: true,
        pickup_date: true,
        pickup_time: true,
        created_at: true,
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            countryCode: true,
            country: true,
            city: true,
            postalCode: true,
            address: true
          }
        },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // API yanıt formatını hazırla
    const formattedOrders = orders.map((order: any) => ({
      id: order.id,
      status: order.status,
      total: Number(order.total),
      pickupDate: order.pickup_date,
      pickupTime: order.pickup_time,
      createdAt: order.created_at,
      customer: {
        firstName: order.customer.firstName,
        lastName: order.customer.lastName,
        email: order.customer.email,
        phone: order.customer.phone,
        countryCode: order.customer.countryCode,
        country: order.customer.country || "",
        city: order.customer.city || "",
        postalCode: order.customer.postalCode || "",
        address: order.customer.address || ""
      },
      items: order.items.map((item: any) => ({
        itemId: item.id,
        productName: item.product.name,
        quantity: Number(item.quantity),
        price: Number(item.price)
      }))
    }));
    
    // Önbelleğe al
    ordersCache = formattedOrders;
    ordersCacheTime = now;

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("Siparişleri getirme hatası:", error);
    return NextResponse.json(
      { error: "Siparişler yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data: OrderData = await req.json();
    console.log("Gelen sipariş verisi:", data);

    // Girdi Doğrulaması
    if (typeof data.total !== 'number' || !isFinite(data.total) || data.total < 0) {
      console.error("Geçersiz sipariş verisi: total", data.total);
      return NextResponse.json({ error: "Geçersiz toplam tutar." }, { status: 400 });
    }
    if (!Array.isArray(data.items) || data.items.length === 0) {
      console.error("Geçersiz sipariş verisi: items", data.items);
      return NextResponse.json({ error: "Sipariş kalemleri eksik veya geçersiz." }, { status: 400 });
    }
    for (const item of data.items) {
      if (typeof item.id !== 'number' || !isFinite(item.id)) {
        console.error("Geçersiz sipariş verisi: item.id", item.id);
        return NextResponse.json({ error: `Geçersiz ürün ID: ${item.id}` }, { status: 400 });
      }
      if (typeof item.quantity !== 'number' || !isFinite(item.quantity) || item.quantity <= 0) {
        console.error("Geçersiz sipariş verisi: item.quantity", item.quantity, "for item", item.id);
        return NextResponse.json({ error: `Ürün ID ${item.id} için geçersiz miktar: ${item.quantity}` }, { status: 400 });
      }
      if (typeof item.price !== 'number' || !isFinite(item.price) || item.price < 0) {
        console.error("Geçersiz sipariş verisi: item.price", item.price, "for item", item.id);
        return NextResponse.json({ error: `Ürün ID ${item.id} için geçersiz fiyat: ${item.price}` }, { status: 400 });
      }
    }

    // Doğrudan SQL kullanarak sipariş oluşturma
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Müşteri oluştur
      const customer = await tx.customer.create({
        data: {
          firstName: data.customer.firstName,
          lastName: data.customer.lastName,
          email: data.customer.email,
          phone: data.customer.phone,
          countryCode: data.customer.countryCode,
          country: data.customer.country || "",
          city: data.customer.city || "",
          postalCode: data.customer.postalCode || "",
          address: data.customer.address || "",
          message: data.customer.message || ""
        },
        select: {
          id: true, 
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          countryCode: true
        }
      });
      
      // 2. Sipariş oluştur
      const order = await tx.order.create({
        data: {
          customer_id: customer.id,
          total: new Decimal(data.total.toString()),
          pickup_date: data.pickupDate ? new Date(data.pickupDate) : null,
          pickup_time: data.pickupTime,
          status: 'pending',
        },
        select: {
          id: true,
          status: true,
          total: true,
          pickup_date: true,
          pickup_time: true,
          created_at: true
        }
      });
      
      // 3. Sipariş öğelerini SQL ile ekle
      for (const item of data.items) {
        console.log(`Creating orderItem for product ${item.id}: quantity=${item.quantity}, price=${item.price}`);
        
        // Ham SQL sorgusu kullanarak orderItem ekle - tür dönüşümleri eklendi
        await tx.$executeRaw`
          INSERT INTO "order_items" ("order_id", "product_id", "quantity", "price") 
          VALUES (${order.id}, ${item.id}, ${item.quantity}::integer, ${item.price}::decimal)
        `;
      }
      
      return { customer, order };
    });
    
    // Önbelleği sıfırla
    ordersCache = null;
    
    // 4. İsterseniz e-posta gönder (mevcut sendOrderEmail fonksiyonunu kullan)
    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      // E-posta gönderimlerini asenkron olarak başlat (yanıtı bekletme)
      Promise.allSettled([
        sendOrderEmail(data, result.order.id, true), // Mağazaya bildirim
        sendOrderEmail(data, result.order.id, false) // Müşteriye bildirim
      ])
      .catch(emailError => {
        console.error("E-posta gönderme hatası:", emailError);
      });
    }
    
    return NextResponse.json({
      success: true,
      orderId: result.order.id,
      message: "Siparişiniz başarıyla alındı"
    });
  } catch (error) {
    console.error("Sipariş oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Sipariş oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}
