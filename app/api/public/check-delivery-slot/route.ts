import { NextResponse } from "next/server"
import { openDb } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { date, time } = await request.json()
    const db = await openDb()
    
    // İlgili günün çalışma saatlerini kontrol et
    const dayOfWeek = new Date(date).getDay() || 7 // 0 = Pazar, bunu 7 olarak değiştirelim
    console.log(`Teslimat slot kontrolü: gün ${dayOfWeek}, saat ${time} için`);
    
    const deliveryHours = await db.get(
      'SELECT * FROM delivery_hours WHERE day_of_week = $1 AND is_open = $2',
      [dayOfWeek, true]
    )

    if (!deliveryHours) {
      return NextResponse.json({ 
        available: false,
        message: "Bu gün teslimat yapılmamaktadır"
      })
    }

    // Seçilen saat çalışma saatleri içinde mi kontrol et
    const selectedHour = parseInt(time.split(':')[0])
    const selectedMinute = parseInt(time.split(':')[1])
    const selectedTimeInMinutes = selectedHour * 60 + selectedMinute

    const morningStart = deliveryHours.morning_start.split(':')
    const morningEnd = deliveryHours.morning_end.split(':')
    const afternoonStart = deliveryHours.afternoon_start.split(':')
    const afternoonEnd = deliveryHours.afternoon_end.split(':')

    const morningStartMinutes = parseInt(morningStart[0]) * 60 + parseInt(morningStart[1])
    const morningEndMinutes = parseInt(morningEnd[0]) * 60 + parseInt(morningEnd[1])
    const afternoonStartMinutes = parseInt(afternoonStart[0]) * 60 + parseInt(afternoonStart[1])
    const afternoonEndMinutes = parseInt(afternoonEnd[0]) * 60 + parseInt(afternoonEnd[1])

    const isInMorningHours = deliveryHours.morning_enabled && 
      selectedTimeInMinutes >= morningStartMinutes && 
      selectedTimeInMinutes <= morningEndMinutes
      
    const isInAfternoonHours = deliveryHours.afternoon_enabled && 
      selectedTimeInMinutes >= afternoonStartMinutes && 
      selectedTimeInMinutes <= afternoonEndMinutes

    return NextResponse.json({ 
      available: isInMorningHours || isInAfternoonHours,
      message: (isInMorningHours || isInAfternoonHours) ? "Teslimat saati uygun" : "Bu saat dilimi uygun değil"
    })
  } catch (error) {
    console.error('Check delivery slot error:', error)
    return NextResponse.json(
      { error: "Teslimat saati kontrolü yapılamadı" },
      { status: 500 }
    )
  }
} 