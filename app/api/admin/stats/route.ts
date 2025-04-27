import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

// Admin token'ını doğrulama fonksiyonu
async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    // JWT_SECRET değerini ortam değişkeninden al
    const JWT_SECRET = process.env.JWT_SECRET || "49ad02bfbd62dbaef4844c4dced26a4f47626cac23ab670a2e849b3fa3a2049c";
    const decoded = jwt.verify(token, JWT_SECRET) as { role?: string };
    
    // Admin rolü kontrolü
    return decoded && decoded.role === 'admin';
  } catch (error) {
    console.error("Token doğrulama hatası:", error);
    return false;
  }
}

// Site istatistiklerini getiren API
export async function GET(request: NextRequest) {
  console.log("İstatistikler API'si çağrıldı:", new Date().toISOString())
  
  try {
    // Token kontrolü
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      console.error("Kimlik doğrulama hatası: Token bulunamadı")
      return NextResponse.json(
        { error: "Kimlik doğrulama hatası" },
        { status: 401 }
      )
    }

    const validAdmin = await verifyAdminToken(token)
    if (!validAdmin) {
      console.error("Kimlik doğrulama hatası: Geçersiz admin token")
      return NextResponse.json(
        { error: "Kimlik doğrulama hatası" },
        { status: 401 }
      )
    }

    console.log("Yönetici kimliği doğrulandı, istatistikler hesaplanıyor")

    // Önbelleğe almayı önlemek için headers
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Timestamp': Date.now().toString()
    }
    
    console.log(`[${new Date().toISOString()}] Admin istatistik API'si çağrıldı`)
    
    // Toplam ürün sayısı
    const totalProducts = await prisma.product.count()
    console.log(`Toplam ürün sayısı: ${totalProducts}`)
    
    // Aktif ürün sayısı
    const activeProducts = await prisma.product.count({
      where: {
        is_active: true
      }
    })
    console.log(`Aktif ürün sayısı: ${activeProducts}`)
    
    // Toplam sipariş sayısı
    const totalOrders = await prisma.order.count()
    console.log(`Toplam sipariş sayısı: ${totalOrders}`)
    
    // Bugünkü siparişler
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const ordersToday = await prisma.order.count({
      where: {
        created_at: {
          gte: today
        }
      }
    })
    console.log(`Bugün yapılan sipariş sayısı: ${ordersToday}`)
    
    // Toplam satış tutarı
    const sales = await prisma.order.aggregate({
      _sum: {
        total: true
      }
    })
    
    const totalAmount = sales._sum.total || 0
    console.log(`Toplam satış tutarı: ${totalAmount}`)
    
    // Bugünkü satış
    const todaySales = await prisma.order.aggregate({
      where: {
        created_at: {
          gte: today
        }
      },
      _sum: {
        total: true
      }
    })
    
    const todayAmount = todaySales._sum.total || 0
    console.log(`Bugün yapılan satış tutarı: ${todayAmount}`)
    
    // Toplam müşteri sayısı
    const totalCustomers = await prisma.customer.count()
    console.log(`Toplam müşteri sayısı: ${totalCustomers}`)
    
    const stats = {
      totalProducts,
      activeProducts,
      totalOrders,
      ordersToday,
      totalAmount,
      todayAmount,
      totalCustomers
    }
    
    console.log('İstatistikler alındı:', stats)
    
    return NextResponse.json(stats, { headers })
  } catch (error) {
    console.error('İstatistik verileri alınırken hata oluştu:', error)
    
    // Hata durumunda varsayılan değerler döndür
    return NextResponse.json({
      totalProducts: 0,
      activeProducts: 0,
      totalOrders: 0,
      ordersToday: 0,
      totalAmount: 0,
      todayAmount: 0,
      totalCustomers: 0,
      error: "İstatistik verilerini alırken bir hata oluştu"
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    })
  }
} 
