import { create } from 'zustand'

export interface DeliveryHour {
  id: number
  day: string
  day_of_week: number
  is_open: boolean
  morning_enabled: boolean
  afternoon_enabled: boolean
  morning_start: string
  morning_end: string
  afternoon_start: string
  afternoon_end: string
}

interface DeliveryHoursStore {
  hours: DeliveryHour[]
  isLoading: boolean
  error: string | null
  fetchHours: () => Promise<void>
  updateHours: (hours: DeliveryHour[]) => Promise<void>
}

export const useDeliveryHours = create<DeliveryHoursStore>()((set, get) => ({
  hours: [],
  isLoading: false,
  error: null,
  fetchHours: async () => {
    try {
      set({ isLoading: true, error: null })
      
      // Cache'i devre dışı bırakarak teslimat saatlerini getir
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/delivery-hours`, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Timestamp': Date.now().toString()
        },
        cache: 'no-store' // Next.js 14 ile uyumlu cache kontrolü
      })
      
      if (!response.ok) {
        throw new Error('Çalışma saatleri yüklenemedi');
      }
      
      const data = await response.json();
      
      // Verilerin doğru formatta olduğundan emin olalım
      const validatedData = data.map((hour: any) => ({
        ...hour,
        // Sayısal değerleri düzgün tipte sağlayalım
        id: typeof hour.id === 'number' ? hour.id : parseInt(hour.id),
        day_of_week: typeof hour.day_of_week === 'number' ? hour.day_of_week : parseInt(hour.day_of_week),
        is_open: !!hour.is_open, // Boolean olduğundan emin ol
        morning_enabled: !!hour.morning_enabled,
        afternoon_enabled: !!hour.afternoon_enabled
      }));
      
      set({ hours: validatedData, isLoading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Bir hata oluştu', isLoading: false })
    }
  },
  updateHours: async (hours) => {
    try {
      set({ isLoading: true, error: null })
      
      // Güncellemeden önce veri tiplerinden emin olalım
      const validatedHours = hours.map(hour => ({
        ...hour,
        // String halindeki sayıları sayıya çevirelim
        id: typeof hour.id === 'number' ? hour.id : Number(hour.id),
        day_of_week: typeof hour.day_of_week === 'number' ? hour.day_of_week : Number(hour.day_of_week),
        // Boolean değerleri doğru formata çevirelim
        is_open: Boolean(hour.is_open),
        morning_enabled: Boolean(hour.morning_enabled),
        afternoon_enabled: Boolean(hour.afternoon_enabled),
        // Saat değerlerini string olarak gönderelim
        morning_start: String(hour.morning_start || ''),
        morning_end: String(hour.morning_end || ''),
        afternoon_start: String(hour.afternoon_start || ''),
        afternoon_end: String(hour.afternoon_end || '')
      }));
      
      const response = await fetch('/api/admin/delivery-hours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify(validatedHours),
        cache: 'no-store'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }));
        throw new Error(errorData.error || 'Çalışma saatleri güncellenemedi');
      }
      
      const updatedHours = await response.json();
      
      // Başarılı güncellemeden sonra hemen saatleri tekrar getir
      // Bu, UI'ın güncel verileri göstermesini sağlar
      setTimeout(() => {
        // Kısa bir gecikme ile tekrar veri çekme isteği yap
        set({ hours: updatedHours, isLoading: false });
      }, 300);
      
      return updatedHours;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Bir hata oluştu', isLoading: false });
      throw error;
    }
  }
}))

export function formatDeliveryHours(hour: DeliveryHour): string {
  if (!hour.is_open) return 'Fermé'
  
  let schedule = []
  if (hour.morning_enabled) {
    schedule.push(`${hour.morning_start}-${hour.morning_end}`)
  }
  if (hour.afternoon_enabled) {
    schedule.push(`${hour.afternoon_start}-${hour.afternoon_end}`)
  }
  
  return schedule.length > 0 ? schedule.join(' / ') : 'Fermé'
}

export function getAvailableTimeSlots(selectedDate: Date, hours: DeliveryHour[]): string[] {
  const dayOfWeek = selectedDate.getDay() || 7 // 0 = Pazar = 7
  const todayHours = hours.find(h => h.day_of_week === dayOfWeek)
  
  if (!todayHours || !todayHours.is_open) return []

  const slots: string[] = []
  const addTimeSlots = (start: string, end: string) => {
    const [startHour, startMinute] = start.split(':').map(Number)
    const [endHour, endMinute] = end.split(':').map(Number)
    
    let currentHour = startHour
    let currentMinute = startMinute
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
      slots.push(`${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`)
      currentMinute += 30
      if (currentMinute >= 60) {
        currentHour++
        currentMinute = 0
      }
    }
  }

  // Sabah saatleri
  if (todayHours.morning_enabled) {
    addTimeSlots(todayHours.morning_start, todayHours.morning_end)
  }
  
  // Öğleden sonra saatleri
  if (todayHours.afternoon_enabled) {
    addTimeSlots(todayHours.afternoon_start, todayHours.afternoon_end)
  }

  return slots
}

export const updateDeliveryHours = async (hours: DeliveryHour[]): Promise<DeliveryHour[]> => {
  try {
    // Her bir saatin değerlerini doğru formatta hazırla
    const preparedHours = hours.map(hour => ({
      ...hour,
      // String veya başka tip day_of_week değerini her zaman Number'a çevir
      day_of_week: Number(hour.day_of_week),
      // API boolean değerleri olduğu gibi kabul ediyor
      is_open: hour.is_open,
      morning_enabled: hour.morning_enabled,
      afternoon_enabled: hour.afternoon_enabled,
      // Zaman değerlerinin string olduğundan emin ol
      morning_start: hour.morning_start?.toString() || '',
      morning_end: hour.morning_end?.toString() || '',
      afternoon_start: hour.afternoon_start?.toString() || '',
      afternoon_end: hour.afternoon_end?.toString() || ''
    }))

    // Önbellek kontrol parametreleri ekle
    const timestamp = new Date().getTime();
    const response = await fetch(`/api/admin/delivery-hours?_=${timestamp}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
      },
      body: JSON.stringify(preparedHours),
      cache: 'no-store'
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen hata' }));
      throw new Error(errorData.error || 'Çalışma saatleri güncellenemedi');
    }
    
    const updatedHours = await response.json();
    
    return updatedHours;
  } catch (error) {
    throw error;
  }
} 