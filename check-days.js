const { PrismaClient } = require('./lib/generated/prisma');
const prisma = new PrismaClient();

async function checkDeliveryHours() {
  try {
    // Tüm teslimat saatlerini getir
    const hours = await prisma.deliveryHour.findMany({
      orderBy: {
        day_of_week: 'asc'
      }
    });
    
    console.log("Mevcut teslimat saatleri:");
    console.table(hours.map(h => ({
      id: h.id,
      day: h.day,
      day_of_week: h.day_of_week
    })));
    
    // Normal olarak 7 gün (1-7) olmalı
    const expectedDays = [1, 2, 3, 4, 5, 6, 7];
    const extraDays = hours.filter(h => !expectedDays.includes(h.day_of_week));
    
    if (extraDays.length > 0) {
      console.log("Fazla günler bulundu:");
      console.table(extraDays.map(h => ({
        id: h.id,
        day: h.day,
        day_of_week: h.day_of_week
      })));
    } else {
      console.log("Fazla gün bulunamadı. Toplam gün sayısı:", hours.length);
    }
  } catch (error) {
    console.error("Hata:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDeliveryHours();
