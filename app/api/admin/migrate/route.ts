import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Next.js 14'ün yeni config yapısını kullanıyoruz
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('Veritabanı güncelleme başlatılıyor...')
    
    try {
      // Prisma kullanarak veritabanı şemasını güncelle
      console.log('Prisma schema üzerinden veritabanı güncelleniyor...')
      
      // Veritabanı bağlantısını kontrol et
      await prisma.$connect()
      console.log('PostgreSQL veritabanına bağlandı')
      
      // Verileri kontrol et - Kategoriler var mı?
      const categoriesCount = await prisma.category.count()
      console.log(`Veritabanında ${categoriesCount} kategori bulundu`)
      
      // Eğer hiç kategori yoksa, istenen kategorileri ekle
      if (categoriesCount === 0) {
        console.log('Kategoriler oluşturuluyor...')
        
        // Oluşturulacak kategoriler
        const categories = [
          { name: "Légumes", description: "Légumes frais et de saison", is_default: true },
          { name: "Fruits", description: "Fruits frais et de saison", is_default: false },
          { name: "Paniers", description: "Paniers composés de produits variés", is_default: false },
          { name: "Colis", description: "Colis préparés avec soin", is_default: false },
          { name: "Fait Maison", description: "Produits faits maison", is_default: false }
        ];
        
        // Tüm kategorileri ekle
        for (const category of categories) {
          await prisma.category.create({
            data: {
              name: category.name,
              is_default: category.is_default,
              is_active: true,
              description: category.description
            }
          });
        }
        
        console.log('Kategoriler başarıyla oluşturuldu')
      } else {
        console.log('Kategoriler zaten mevcut')
      }
      
      // Veritabanı durumunu doğrula
      const categories = await prisma.category.findMany({
        select: {
          id: true,
          name: true,
          is_default: true,
          is_active: true,
          description: true
        },
        orderBy: {
          id: 'asc'
        }
      })
      
      console.log('Mevcut kategoriler:', categories)
      console.log('Veritabanı güncelleme tamamlandı.')
      
      return NextResponse.json({ 
        success: true, 
        message: "Veritabanı başarıyla güncellendi",
        details: {
          categoriesCount,
          categories
        }
      })
    } catch (error) {
      console.error('Veritabanı güncelleme hatası:', error)
      return NextResponse.json(
        { error: "Veritabanı güncellenirken bir hata oluştu", details: String(error) },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error)
    return NextResponse.json(
      { error: "Veritabanına bağlanırken bir hata oluştu", details: String(error) },
      { status: 500 }
    )
  }
} 