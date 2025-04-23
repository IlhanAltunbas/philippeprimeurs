import { NextResponse } from "next/server"
import { openDb } from "@/lib/db"

// Sipariş durumunu güncelleme
export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    const body = await request.json()
    
    // Status değerinin gönderilip gönderilmediğini kontrol et
    if (!body.status) {
      return NextResponse.json(
        { error: "Le statut est requis" },
        { status: 400 }
      )
    }

    const db = await openDb()
    
    // Siparişin var olup olmadığını kontrol et
    const orderExists = await db.get(
      "SELECT id FROM orders WHERE id = $1",
      [orderId]
    )
    
    if (!orderExists) {
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 }
      )
    }

    // Sipariş durumunu güncelle
    await db.run(
      "UPDATE orders SET status = $1 WHERE id = $2",
      body.status,
      orderId
    )

    // Güncellenmiş siparişi getir
    const updatedOrder = await db.get(
      "SELECT * FROM orders WHERE id = $1",
      [orderId]
    )

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la commande:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la commande" },
      { status: 500 }
    )
  }
}

// Sipariş detaylarını getirme
export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  console.log("API GET /api/orders/[orderId] CALLED, ID:", params.orderId);
  const { orderId } = params
  console.log("API: Sipariş detayları getiriliyor, ID:", orderId)
  
  try {
    const db = await openDb()

    // Sipariş bilgilerini getir
    const order = await db.get(
      "SELECT * FROM orders WHERE id = $1",
      [orderId]
    )

    if (!order) {
      console.log("API: Sipariş bulunamadı, ID:", orderId)
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 }
      )
    }

    console.log("API: Sipariş bulundu:", order)

    // Müşteri bilgilerini getir
    const customer = await db.get(
      "SELECT * FROM customers WHERE id = $1",
      [order.customer_id]
    )

    console.log("API: Müşteri bulundu:", customer)

    // Sipariş öğelerini getir
    const items = await db.all(
      `SELECT oi.*, p.name, p.image, p.unit 
       FROM order_items oi  
       LEFT JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = $1`,  
      [orderId]
    )

    console.log("API: Sipariş öğeleri bulundu, sayı:", items.length)

    // Sipariş detaylarını oluştur
    const orderDetails = {
      id: order.id,
      createdAt: order.created_at,
      status: order.status,
      total: Number(order.total),
      pickupDate: order.pickup_date,
      pickupTime: order.pickup_time,
      customer: customer || {},
      items: items.map((item: any) => ({
        itemId: item.id,
        productName: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        image: item.image
      }))
    }

    console.log("API: Nihai orderDetails.items:", JSON.stringify(orderDetails.items, null, 2));
    console.log("API: Sipariş detayları döndürülüyor")
    return NextResponse.json(orderDetails)
  } catch (error: any) {
    console.error("API: Sipariş detayları getirme hatası:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des détails de la commande" },
      { status: 500 }
    )
  }
}

// Sipariş silme
export async function DELETE(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    const db = await openDb()

    // Siparişin var olup olmadığını kontrol et
    const orderExists = await db.get(
      "SELECT id FROM orders WHERE id = $1",
      [orderId]
    )
    
    if (!orderExists) {
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 }
      )
    }

    // Sipariş öğelerini sil
    await db.run(
      "DELETE FROM order_items WHERE order_id = $1",
      [orderId]
    )

    // Siparişi sil
    await db.run(
      "DELETE FROM orders WHERE id = $1",
      [orderId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la suppression de la commande:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la commande" },
      { status: 500 }
    )
  }
} 