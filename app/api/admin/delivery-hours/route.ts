import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Saat formatını düzeltmek için yardımcı fonksiyon 
function formatTime(timeStr: string): string {
  // Eğer timeStr boşsa veya geçersizse, olduğu gibi döndür
  if (!timeStr) return timeStr;
  
  // Eğer format "HH:MM:SS" ise "HH:MM" formatına dönüştür
  if (timeStr.includes(':') && timeStr.split(':').length === 3) {
    const parts = timeStr.split(':');
    return `${parts[0]}:${parts[1]}`;
  }
  
  // Diğer durumlarda olduğu gibi döndür
  return timeStr;
}

export async function GET(request: Request) {
  try {
    // Önbelleğe almayı önlemek için headers - daha güçlü önbellek kontrolü
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Timestamp': Date.now().toString()
    };
    
    console.log(`[${new Date().toISOString()}] Teslimat saatleri GET isteği alındı - ${request.url}`);
    
    // Tüm teslimat saatlerini al
    const hours = await prisma.deliveryHour.findMany({
      orderBy: {
        day_of_week: 'asc'
      }
    })
    
    console.log(`[${new Date().toISOString()}] Mevcut teslimat saatleri: ${hours.length}`);
    
    // Varsayılan saatleri ekle - eğer kayıt yoksa
    if (hours.length === 0) {
      console.log(`[${new Date().toISOString()}] Teslimat saati kaydı bulunamadı, varsayılan değerler oluşturuluyor...`);
      
      const defaultHours = [
        { day: "Lundi", day_of_week: 1, is_open: true, morning_enabled: true, afternoon_enabled: true, morning_start: "09:00", morning_end: "12:00", afternoon_start: "14:00", afternoon_end: "18:00" },
        { day: "Mardi", day_of_week: 2, is_open: true, morning_enabled: true, afternoon_enabled: true, morning_start: "09:00", morning_end: "12:00", afternoon_start: "14:00", afternoon_end: "18:00" },
        { day: "Mercredi", day_of_week: 3, is_open: true, morning_enabled: true, afternoon_enabled: true, morning_start: "09:00", morning_end: "12:00", afternoon_start: "14:00", afternoon_end: "18:00" },
        { day: "Jeudi", day_of_week: 4, is_open: true, morning_enabled: true, afternoon_enabled: true, morning_start: "09:00", morning_end: "12:00", afternoon_start: "14:00", afternoon_end: "18:00" },
        { day: "Vendredi", day_of_week: 5, is_open: true, morning_enabled: true, afternoon_enabled: true, morning_start: "09:00", morning_end: "12:00", afternoon_start: "14:00", afternoon_end: "18:00" },
        { day: "Samedi", day_of_week: 6, is_open: true, morning_enabled: true, afternoon_enabled: true, morning_start: "09:00", morning_end: "12:00", afternoon_start: "14:00", afternoon_end: "18:00" },
        { day: "Dimanche", day_of_week: 7, is_open: false, morning_enabled: true, afternoon_enabled: true, morning_start: "09:00", morning_end: "12:00", afternoon_start: "14:00", afternoon_end: "18:00" },
      ]

      // Her günü veritabanına ekle
      const createdHours = await Promise.all(
        defaultHours.map(hour => 
          prisma.deliveryHour.create({
            data: {
              day: hour.day,
              day_of_week: hour.day_of_week,
              is_open: hour.is_open,
              morning_enabled: hour.morning_enabled,
              afternoon_enabled: hour.afternoon_enabled,
              morning_start: hour.morning_start,
              morning_end: hour.morning_end,
              afternoon_start: hour.afternoon_start,
              afternoon_end: hour.afternoon_end
            }
          })
        )
      )
      
      console.log(`[${new Date().toISOString()}] Varsayılan teslimat saatleri başarıyla oluşturuldu`);
      
      // Saat formatını düzelt
      const formattedHours = createdHours.map(hour => ({
        ...hour,
        morning_start: formatTime(hour.morning_start || ""),
        morning_end: formatTime(hour.morning_end || ""),
        afternoon_start: formatTime(hour.afternoon_start || ""),
        afternoon_end: formatTime(hour.afternoon_end || "")
      }));

      return NextResponse.json(formattedHours, { headers })
    }

    // Saat formatını düzelt
    const formattedHours = hours.map((hour: any) => ({
      ...hour,
      morning_start: formatTime(hour.morning_start || ""),
      morning_end: formatTime(hour.morning_end || ""),
      afternoon_start: formatTime(hour.afternoon_start || ""),
      afternoon_end: formatTime(hour.afternoon_end || "")
    }));
    
    console.log(`[${new Date().toISOString()}] Teslimat saatleri başarıyla döndürüldü`);

    return NextResponse.json(formattedHours, { headers })
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Teslimat saatleri alınırken hata:`, error)
    return NextResponse.json(
      { error: "Çalışma saatleri yüklenemedi: " + (error instanceof Error ? error.message : String(error)) },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache',
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Önbelleğe almayı önlemek için headers - daha güçlü önbellek kontrolü
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Timestamp': Date.now().toString()
    };
    
    console.log(`[${new Date().toISOString()}] Teslimat saatleri POST isteği alındı - ${request.url}`);
    
    // İstek gövdesini ayrıştır
    let hours;
    try {
      hours = await request.json();
      console.log(`[${new Date().toISOString()}] Alınan veri: ${JSON.stringify(hours)}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] JSON veri ayrıştırma hatası:`, error);
      return NextResponse.json(
        { error: "Geçersiz JSON verisi" },
        { status: 400, headers }
      );
    }
    
    if (!Array.isArray(hours)) {
      console.error(`[${new Date().toISOString()}] Geçersiz veri formatı - dizi bekleniyor`);
      return NextResponse.json(
        { error: "Geçersiz veri formatı - dizi bekleniyor" },
        { status: 400, headers }
      );
    }
    
    // Her günün bilgilerini güncelle
    const updatedHours = await Promise.all(
      hours.map(async (hour: any) => {
        console.log(`[${new Date().toISOString()}] İşlenen gün: ${hour.day} (${hour.day_of_week})`);
        
        const {
          is_open,
          morning_enabled,
          afternoon_enabled,
          morning_start,
          morning_end,
          afternoon_start,
          afternoon_end,
          day_of_week,
          day
        } = hour;

        // Gün değerini her zaman number'a dönüştür
        const dayOfWeekNumber = parseInt(String(day_of_week), 10);
        
        console.log(`[${new Date().toISOString()}] Gün ${dayOfWeekNumber} için işlem yapılıyor`);
        
        // Önce kaydın var olup olmadığını kontrol et
        const existingRecord = await prisma.deliveryHour.findUnique({
          where: { day_of_week: dayOfWeekNumber }
        });
        
        if (existingRecord) {
          // Eğer kayıt varsa update işlemi yap
          console.log(`[${new Date().toISOString()}] Mevcut kayıt güncelleniyor, ID: ${existingRecord.id}`);
          return prisma.deliveryHour.update({
            where: { id: existingRecord.id },
            data: {
              is_open: Boolean(is_open),
              morning_enabled: Boolean(morning_enabled),
              afternoon_enabled: Boolean(afternoon_enabled),
              morning_start: morning_start || null,
              morning_end: morning_end || null,
              afternoon_start: afternoon_start || null,
              afternoon_end: afternoon_end || null
            }
          });
        } else {
          // Eğer kayıt yoksa create işlemi yap
          console.log(`[${new Date().toISOString()}] Yeni kayıt oluşturuluyor, day_of_week: ${dayOfWeekNumber}`);
          return prisma.deliveryHour.create({
            data: {
              day: day,
              day_of_week: dayOfWeekNumber,
              is_open: Boolean(is_open),
              morning_enabled: Boolean(morning_enabled),
              afternoon_enabled: Boolean(afternoon_enabled),
              morning_start: morning_start || null,
              morning_end: morning_end || null,
              afternoon_start: afternoon_start || null,
              afternoon_end: afternoon_end || null
            }
          });
        }
      })
    );
    
    console.log(`[${new Date().toISOString()}] Tüm günler güncellendi, güncel veriler getiriliyor`);
    
    // Prisma Client'in önbelleğini temizle 
    // @ts-ignore - PrismaClient._engine
    if (prisma._engine && typeof prisma._engine.reset === 'function') {
      // @ts-ignore
      await prisma._engine.reset();
    }
    
    // Güncellenmiş saatleri al
    const updatedResult = await prisma.deliveryHour.findMany({
      orderBy: {
        day_of_week: 'asc'
      }
    });
    
    // Saat formatını düzelt
    const formattedHours = updatedResult.map((hour: any) => ({
      ...hour,
      morning_start: formatTime(hour.morning_start || ""),
      morning_end: formatTime(hour.morning_end || ""),
      afternoon_start: formatTime(hour.afternoon_start || ""),
      afternoon_end: formatTime(hour.afternoon_end || "")
    }));
    
    console.log(`[${new Date().toISOString()}] Teslimat saatleri başarıyla güncellendi`);
    
    return NextResponse.json(formattedHours, { headers });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Teslimat saatlerini güncellerken hata:`, error);
    // Hata detaylarını logla
    if (error instanceof Error) {
      console.error(`Hata mesajı: ${error.message}`);
      console.error(`Hata stack: ${error.stack}`);
    }
    
    return NextResponse.json(
      { error: 'Teslimat saatleri güncellenirken bir hata oluştu: ' + (error instanceof Error ? error.message : String(error)) },
      { 
        status: 500, 
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 
