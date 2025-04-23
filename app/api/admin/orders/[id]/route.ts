import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Next.js 15'te params'a erişmeden önce await kullanılmalı
    const params = await context.params;
    const orderId = parseInt(params.id)
    
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Geçersiz sipariş ID" }, { status: 400 })
    }
    
    // Siparişi ve ilişkili verileri al
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })
    
    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 })
    }
    
    // Temizlenmiş sipariş nesnesini oluştur
    const cleanedOrder = {
      id: order.id,
      status: order.status,
      total: Number(order.total),
      createdAt: order.created_at,
      pickupDate: order.pickup_date,
      pickupTime: order.pickup_time,
      customer: {
        id: order.customer.id,
        firstName: order.customer.firstName,
        lastName: order.customer.lastName,
        email: order.customer.email,
        phone: order.customer.phone,
        countryCode: order.customer.countryCode,
        address: order.customer.address || "",
        city: order.customer.city || "",
        country: order.customer.country || "",
        postalCode: order.customer.postalCode || "",
        message: order.customer.message || ""
      },
      items: order.items.map((item: any) => ({
        itemId: item.id,
        productId: item.product_id,
        orderId: item.order_id,
        productName: item.product.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        image: item.product.image,
        unit: item.product.unit || 'pièce',
        origin: item.product.origin || null
      }))
    }
    
    return NextResponse.json(cleanedOrder)
  } catch (error) {
    console.error("Error fetching order details:", error)
    return NextResponse.json(
      { error: "Sipariş detayları alınırken bir hata oluştu" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Next.js 15'te params'a erişmeden önce await kullanılmalı
    const params = await context.params;
    const orderId = parseInt(params.id)
    
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Geçersiz sipariş ID" }, { status: 400 })
    }
    
    const body = await request.json()
    
    // Siparişi güncelle
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: body.status },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: "Sipariş güncellenirken bir hata oluştu" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Next.js 15'te params'a erişmeden önce await kullanılmalı
    const params = await context.params;
    const orderId = parseInt(params.id)
    
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Geçersiz sipariş ID" }, { status: 400 })
    }
    
    // Siparişin var olup olmadığını kontrol et
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json(
        { error: "Sipariş bulunamadı" },
        { status: 404 }
      )
    }

    // Siparişi sil (cascade ile sipariş öğeleri de silinecek)
    await prisma.order.delete({
      where: { id: orderId }
    })

    return NextResponse.json({ 
      success: true,
      message: "Sipariş başarıyla silindi" 
    })
  } catch (error) {
    console.error("Order deletion error:", error)
    return NextResponse.json(
      { error: "Sipariş silinirken bir hata oluştu" },
      { status: 500 }
    )
  }
} 
