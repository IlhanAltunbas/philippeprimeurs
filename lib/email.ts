'use server';

import nodemailer from 'nodemailer';

// E-posta gönderimi için transporter oluşturma
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Sipariş onay e-postası gönderme fonksiyonu
export async function sendOrderConfirmationEmail(
  customerEmail: string,
  orderDetails: {
    orderId: number;
    customerName: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      unit?: string;
    }>;
    total: number;
    pickupDate: string;
    pickupTime: string;
  }
) {
  // Sipariş öğelerini HTML formatında hazırlama
  const itemsHtml = orderDetails.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity} ${item.unit || ''}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.price.toFixed(2)} €</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${(item.price * item.quantity).toFixed(2)} €</td>
      </tr>
    `
    )
    .join('');

  // E-posta içeriği
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2 style="color: #4CAF50; text-align: center;">Sipariş Onayı</h2>
      <p>Merhaba ${orderDetails.customerName},</p>
      <p>Siparişiniz başarıyla oluşturuldu. Sipariş detayları aşağıdadır:</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Sipariş Numarası:</strong> #${orderDetails.orderId}</p>
        <p><strong>Alım Tarihi:</strong> ${orderDetails.pickupDate}</p>
        <p><strong>Alım Saati:</strong> ${orderDetails.pickupTime}</p>
      </div>
      
      <h3 style="border-bottom: 2px solid #4CAF50; padding-bottom: 5px;">Sipariş Öğeleri</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Ürün</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Miktar</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Birim Fiyat</th>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Toplam</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">Toplam:</td>
            <td style="padding: 8px; font-weight: bold;">${orderDetails.total.toFixed(2)} €</td>
          </tr>
        </tfoot>
      </table>
      
      <p style="margin-top: 20px;">Siparişiniz için teşekkür ederiz!</p>
      <p>Philippe Primeurs Ekibi</p>
    </div>
  `;

  try {
    // Müşteriye e-posta gönderme
    await transporter.sendMail({
      from: `"Philippe Primeurs" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Sipariş Onayı #${orderDetails.orderId}`,
      html: emailContent,
    });

    // Mağaza sahibine e-posta gönderme
    await transporter.sendMail({
      from: `"Philippe Primeurs Sistem" <${process.env.EMAIL_USER}>`,
      to: process.env.STORE_EMAIL || process.env.EMAIL_USER,
      subject: `Yeni Sipariş #${orderDetails.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #4CAF50; text-align: center;">Yeni Sipariş Bildirimi</h2>
          <p>Yeni bir sipariş oluşturuldu:</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Sipariş Numarası:</strong> #${orderDetails.orderId}</p>
            <p><strong>Müşteri:</strong> ${orderDetails.customerName}</p>
            <p><strong>Alım Tarihi:</strong> ${orderDetails.pickupDate}</p>
            <p><strong>Alım Saati:</strong> ${orderDetails.pickupTime}</p>
            <p><strong>Toplam Tutar:</strong> ${orderDetails.total.toFixed(2)} €</p>
          </div>
          
          <h3 style="border-bottom: 2px solid #4CAF50; padding-bottom: 5px;">Sipariş Öğeleri</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Ürün</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Miktar</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Birim Fiyat</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Toplam</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">Toplam:</td>
                <td style="padding: 8px; font-weight: bold;">${orderDetails.total.toFixed(2)} €</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `,
    });

    console.log(`Sipariş #${orderDetails.orderId} için e-postalar gönderildi`);
    return { success: true };
  } catch (error) {
    console.error('E-posta gönderimi sırasında hata oluştu:', error);
    return { success: false, error };
  }
} 