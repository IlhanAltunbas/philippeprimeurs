import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Sipariş durumunu güncellemek için PATCH metodu
export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Next.js 15'te params'a erişmeden önce await kullanılmalı
    const params = await context.params;
    const orderId = parseInt(params.id)
    
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: "Geçersiz sipariş ID" },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    // Durum değerini doğrula
    if (!body.status || typeof body.status !== 'string') {
      return NextResponse.json(
        { error: "Geçersiz sipariş durumu" },
        { status: 400 }
      )
    }
    
    // Önce siparişin var olduğunu kontrol et
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!existingOrder) {
      return NextResponse.json(
        { error: "Sipariş bulunamadı" },
        { status: 404 }
      )
    }
    
    // Durumu güncelle
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: body.status }
    })

    return NextResponse.json({
      id: updatedOrder.id,
      status: updatedOrder.status,
      createdAt: updatedOrder.created_at,
      message: "Sipariş durumu başarıyla güncellendi"
    })
  } catch (error) {
    console.error("Sipariş durumu güncellenirken hata:", error)
    return NextResponse.json(
      { error: "Sipariş durumu güncellenirken bir hata oluştu" },
      { status: 500 }
    )
  }
} 