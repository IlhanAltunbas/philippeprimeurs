import { NextResponse } from "next/server"
import { openDb } from "@/lib/db"

// Test siparişleri oluşturmak için API endpoint
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { months, count = 1 } = body;
    
    if (!months) {
      return NextResponse.json({ error: 'Ay sayısı belirtilmedi' }, { status: 400 });
    }
    
    const db = await openDb();
    const createdOrders = [];
    
    // Belirtilen ay sayısı kadar geçmiş tarihli sipariş oluştur
    for (let i = 0; i < count; i++) {
      // Test müşterisi oluştur
      const customerResult = await db.run(
        `INSERT INTO customers (firstName, lastName, email, phone, countryCode, address, city, country, postalCode)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          `Test${i}`,
          `User${i}`,
          `test${i}@example.com`,
          `123456789${i}`,
          '+32',
          'Test Address',
          'Brussels',
          'Belgium',
          '1000'
        ]
      );
      
      const customerId = customerResult.rows[0].id;
      
      // Sipariş tarihi hesapla
      const orderDate = new Date();
      orderDate.setMonth(orderDate.getMonth() - months);
      // Rastgele birkaç gün ekle (0-30 gün)
      orderDate.setDate(orderDate.getDate() + Math.floor(Math.random() * 30));
      const createdAt = orderDate.toISOString();
      
      // Test siparişi oluştur
      const orderResult = await db.run(
        `INSERT INTO orders (customer_id, total, status, pickup_date, pickup_time, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          customerId, 
          (Math.random() * 100 + 10).toFixed(2), // 10-110 € arası rastgele tutar
          'completed', 
          orderDate.toISOString().split('T')[0], 
          '14:00', 
          createdAt
        ]
      );
      
      const orderId = orderResult.rows[0].id;
      
      // Test sipariş ürünü ekle
      await db.run(
        `INSERT INTO order_items (order_id, product_id, quantity, price, name, unit)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          orderId,
          1, // Varsayılan ürün ID'si
          Math.floor(Math.random() * 5) + 1, // 1-5 arası rastgele miktar
          9.99,
          'Test Ürün',
          'kg'
        ]
      );
      
      createdOrders.push({
        id: orderId,
        createdAt
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `${count} adet ${months} ay öncesine ait test siparişi oluşturuldu`,
      orders: createdOrders 
    });
    
  } catch (error) {
    console.error('Test siparişi oluşturma hatası:', error);
    return NextResponse.json({ 
      error: 'Test siparişi oluşturulurken bir hata oluştu' 
    }, { status: 500 });
  }
} 