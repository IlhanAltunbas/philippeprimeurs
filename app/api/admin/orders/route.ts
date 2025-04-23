import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Önbelleğe almayı önlemek için headers
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
    
    // Tüm siparişleri ve ilişkili müşteri bilgilerini al
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })
    
    // API yanıt formatını hazırla
    const formattedOrders = orders.map((order: any) => ({
      id: order.id,
      createdAt: order.created_at,
      status: order.status,
      total: Number(order.total),
      pickupDate: order.pickup_date,
      pickupTime: order.pickup_time,
      customer: {
        firstName: order.customer.firstName || "",
        lastName: order.customer.lastName || "",
        email: order.customer.email || "",
        phone: order.customer.phone || "",
        countryCode: order.customer.countryCode || "",
        country: order.customer.country || "",
        city: order.customer.city || "",
        postalCode: order.customer.postalCode || "",
        address: order.customer.address || ""
      },
      items: order.items.map((item: any) => ({
        itemId: item.id,
        productId: item.product_id,
        productName: item.product.name,
        quantity: Number(item.quantity),
        price: Number(item.price),
        image: item.product.image
      }))
    }))
    
    return NextResponse.json(formattedOrders, { headers })
  } catch (error) {
    console.error("Siparişleri getirme hatası:", error)
    return NextResponse.json(
      { error: "Siparişler yüklenirken bir hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Müşteri bilgilerini oluştur veya güncelle
    const customer = await prisma.customer.create({
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
      }
    })
    
    // Siparişi oluştur
    const order = await prisma.order.create({
      data: {
        customer_id: customer.id,
        status: data.status || "pending",
        total: data.total,
        pickup_date: data.pickupDate ? new Date(data.pickupDate) : null,
        pickup_time: data.pickupTime || null,
        items: {
          create: data.items.map((item: any) => ({
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })
    
    return NextResponse.json({
      id: order.id,
      message: "Sipariş başarıyla oluşturuldu"
    })
  } catch (error) {
    console.error("Sipariş oluşturma hatası:", error)
    return NextResponse.json(
      { error: "Sipariş oluşturulurken bir hata oluştu" },
      { status: 500 }
    )
  }
} 
