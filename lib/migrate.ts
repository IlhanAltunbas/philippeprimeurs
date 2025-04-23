import { openDb } from './db'

async function migrate() {
  const db = await openDb()
  
  console.log('Veritabanı güncelleme başlatılıyor...')
  
  try {
    // Kategoriler tablosunda isActive sütunu var mı kontrol et
    const tableInfo = await db.all("PRAGMA table_info(categories)")
    const hasIsActive = tableInfo.some(column => column.name === 'isActive')
    const hasDescription = tableInfo.some(column => column.name === 'description')
    
    // isActive sütunu yoksa ekle
    if (!hasIsActive) {
      console.log('isActive sütunu ekleniyor...')
      await db.exec('ALTER TABLE categories ADD COLUMN isActive BOOLEAN NOT NULL DEFAULT 1')
      console.log('isActive sütunu eklendi.')
    } else {
      console.log('isActive sütunu zaten mevcut.')
    }
    
    // description sütunu yoksa ekle
    if (!hasDescription) {
      console.log('description sütunu ekleniyor...')
      await db.exec('ALTER TABLE categories ADD COLUMN description TEXT')
      console.log('description sütunu eklendi.')
    } else {
      console.log('description sütunu zaten mevcut.')
    }
    
    console.log('Veritabanı güncelleme tamamlandı.')
  } catch (error) {
    console.error('Veritabanı güncelleme hatası:', error)
  } finally {
    await db.close()
  }
}

migrate().catch(console.error) 