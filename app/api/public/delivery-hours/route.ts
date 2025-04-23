import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Saat formatını düzeltmek için yardımcı fonksiyon 
function formatTime(timeStr: string | null): string {
  // Eğer timeStr boşsa veya geçersizse, olduğu gibi döndür
  if (!timeStr) return timeStr || "";
  
  // Eğer format "HH:MM:SS" ise "HH:MM" formatına dönüştür
  if (timeStr.includes(':') && timeStr.split(':').length === 3) {
    const parts = timeStr.split(':');
    return `${parts[0]}:${parts[1]}`;
  }
  
  // Diğer durumlarda olduğu gibi döndür
  return timeStr;
}

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    console.log(`[${new Date().toISOString()}] Public delivery hours API çağrıldı`);
    
    // Önbelleğe almayı önlemek için headers
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Timestamp': Date.now().toString()
    };
    
    // Günlere göre sıralanmış teslimat saatlerini getir
    const hours = await prisma.deliveryHour.findMany({
      orderBy: {
        day_of_week: 'asc'
      },
      // Tipleri güvenli hale getirmek için select kullan
      select: {
        id: true,
        day: true,
        day_of_week: true,
        is_open: true,
        morning_enabled: true,
        afternoon_enabled: true,
        morning_start: true,
        morning_end: true,
        afternoon_start: true,
        afternoon_end: true
      }
    });

    // Hata durumunu kontrol et
    if (!hours || !Array.isArray(hours)) {
      throw new Error("Teslimat saatleri alınamadı veya beklenen formatta değil");
    }

    // Saat formatını düzelt
    const formattedHours = hours.map(hour => ({
      ...hour,
      morning_start: formatTime(hour.morning_start),
      morning_end: formatTime(hour.morning_end),
      afternoon_start: formatTime(hour.afternoon_start),
      afternoon_end: formatTime(hour.afternoon_end)
    }));
    
    console.log(`[${new Date().toISOString()}] ${formattedHours.length} teslimat saati başarıyla döndürüldü`);
    
    // Sonuçları JSON olarak döndür
    return NextResponse.json(formattedHours, { headers });
  } catch (error) {
    console.error('Public delivery hours error:', error);
    return NextResponse.json(
      { error: "Teslimat saatleri yüklenemedi" },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache',
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 