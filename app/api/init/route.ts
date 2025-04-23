import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Next.js 14 ile uyumlu yapılandırma
export const dynamic = 'force-static'
export const runtime = 'nodejs'

export async function GET() {
  try {
    // Temel kategorileri ekle
    const defaultCategories = [
      { name: "Légumes", description: "Légumes frais et de saison", isDefault: true },
      { name: "Fruits", description: "Fruits frais et de saison", isDefault: false },
      { name: "Colis", description: "Colis préparés avec soin", isDefault: false },
      { name: "Paniers", description: "Paniers composés de produits variés", isDefault: false },
      { name: "Fait Maison", description: "Produits faits maison", isDefault: false }
    ];

    console.log("Varsayılan kategoriler ekleniyor...");
    for (const category of defaultCategories) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: { 
          is_default: category.isDefault, 
          is_active: true,
          description: category.description 
        },
        create: { 
          name: category.name,
          is_default: category.isDefault,
          is_active: true,
          description: category.description
        }
      });
    }

    // "Genel" kategorisini kontrol et ve sil
    try {
      const generalCategory = await prisma.category.findFirst({
        where: { name: "Genel" }
      });
      
      if (generalCategory) {
        console.log('"Genel" kategorisi bulundu, siliniyor...');
        await prisma.category.delete({
          where: { id: generalCategory.id }
        });
        console.log('"Genel" kategorisi silindi');
      }
    } catch (error) {
      console.error('"Genel" kategorisi silinirken hata:', error);
      // Hata olursa devam et, kritik değil
    }

    // Teslimat saatlerini ayarla
    const weekDays = [
      { id: 1, day: "Lundi", day_of_week: 1 },
      { id: 2, day: "Mardi", day_of_week: 2 },
      { id: 3, day: "Mercredi", day_of_week: 3 },
      { id: 4, day: "Jeudi", day_of_week: 4 },
      { id: 5, day: "Vendredi", day_of_week: 5 },
      { id: 6, day: "Samedi", day_of_week: 6 },
      { id: 7, day: "Dimanche", day_of_week: 7 }
    ];

    console.log("Teslimat saatleri ayarlanıyor...");
    for (const day of weekDays) {
      await prisma.deliveryHour.upsert({
        where: { day_of_week: day.day_of_week },
        update: {
          day: day.day,
          is_open: day.day_of_week < 7, // Pazar günü kapalı
          morning_enabled: day.day_of_week < 7,
          afternoon_enabled: day.day_of_week < 7,
          morning_start: "09:00",
          morning_end: "12:00",
          afternoon_start: "14:00",
          afternoon_end: "18:00"
        },
        create: {
          day: day.day,
          day_of_week: day.day_of_week,
          is_open: day.day_of_week < 7, // Pazar günü kapalı
          morning_enabled: day.day_of_week < 7,
          afternoon_enabled: day.day_of_week < 7,
          morning_start: "09:00",
          morning_end: "12:00",
          afternoon_start: "14:00",
          afternoon_end: "18:00"
        }
      });
    }

    // Kategorileri getir
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ 
      message: "Veritabanı başlatma işlemi tamamlandı",
      categories: categories.length,
      categoryNames: categories.map((c: any) => c.name),
      deliveryHours: weekDays.length
    });
  } catch (error) {
    console.error("Veritabanı başlatma hatası:", error);
    return NextResponse.json(
      { error: "Veritabanı oluşturulurken bir hata oluştu", details: String(error) },
      { status: 500 }
    );
  }
} 
