import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Next.js 15'te params'a erişmeden önce await kullanılmalı
    const params = await context.params
    const productId = parseInt(params.id)
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Geçersiz ürün kimliği" },
        { status: 400 }
      )
    }
    
    console.log(`Ürün aktiflik durumu güncelleme isteği alındı, ID: ${productId}`)
    
    // JSON verisini al
    const data = await request.json()
    if (data === null || typeof data.isActive !== 'boolean') {
      console.error("Geçersiz isActive değeri:", data)
      return NextResponse.json(
        { error: "isActive alanı eksik veya geçersiz" },
        { status: 400 }
      )
    }
    
    const isActive = Boolean(data.isActive)
    console.log(`Ürün ID ${productId} için is_active değeri ${isActive} olarak ayarlanıyor`)
    
    // Ürünün varlığını kontrol et
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })
    
    if (!product) {
      console.error(`Ürün bulunamadı, ID: ${productId}`)
      return NextResponse.json(
        { error: "Ürün bulunamadı" },
        { status: 404 }
      )
    }
    
    // Ürünü güncelle
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { is_active: isActive },
      include: {
        category: true
      }
    })
    
    console.log(`Ürün ID ${productId} aktiflik durumu güncellendi: ${isActive}`)
    
    // Kategori formatını önceki API'yle uyumlu hale getir
    return NextResponse.json({
      ...updatedProduct,
      category: {
        id: updatedProduct.category_id,
        name: updatedProduct.category.name
      }
    })
  } catch (error) {
    console.error("Ürün aktiflik durumu güncelleme hatası:", error)
    return NextResponse.json(
      { error: "Ürün aktiflik durumu güncellenirken bir hata oluştu" },
      { status: 500 }
    )
  }
} 