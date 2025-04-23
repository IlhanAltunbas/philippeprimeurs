import { Pool } from 'pg'
import dotenv from 'dotenv'
import { prisma } from './prisma'

// .env dosyasından değişkenleri yükle
dotenv.config()

// PostgreSQL bağlantı havuzu için geriye dönük uyumluluk
// Aslında artık Prisma kullanıldığı için bu havuz kullanılmıyor
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'philippe_primeurs_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  // Bağlantı havuzu yapılandırması
  max: 20, // maksimum bağlantı sayısı
  idleTimeoutMillis: 30000, // boşta bekleyen bağlantıların kapatılma süresi
  connectionTimeoutMillis: 2000, // bağlantı zaman aşımı
})

// Veritabanı bağlantısını test et
pool.on('connect', () => {
  console.log('PostgreSQL veritabanına bağlandı')
})

pool.on('error', (err) => {
  console.error('PostgreSQL bağlantı hatası:', err)
})

export async function initializeDb() {
  try {
    // DB tabloları oluşturuldu/güncellendi!
    console.log('Veritabanı tabloları Prisma tarafından yönetiliyor')
    return true
  } catch (error) {
    console.error('Veritabanı başlatma hatası:', error)
    return false
  }
}

// Geriye dönük uyumluluk için SQL sorguları çalıştırma yardımcıları
// Artık bu fonksiyonlar Prisma'ya yönlendiriyor
export async function openDb() {
  return {
    // SELECT sorguları için
    async get(query: string, params: any[] = []) {
      console.warn("SQL query kullanımı algılandı. Prisma modellerine geçiş yapınız: " + query);
      // Basit sorgu analizi
      if (query.includes("FROM products")) {
        if (query.includes("WHERE") && query.includes("id = $1")) {
          try {
            const id = Number(params[0]);
            return await prisma.product.findUnique({
              where: { id },
              include: { category: true }
            });
          } catch (error) {
            console.error("Prisma ürün sorgulama hatası:", error);
          }
        }
        // Tüm ürünler için dönüşüm
        try {
          return await prisma.product.findMany({
            include: { category: true }
          });
        } catch (error) {
          console.error("Prisma ürün listesi hatası:", error);
        }
      }
      
      const client = await pool.connect()
      try {
        const result = await client.query(query, params)
        return result.rows[0] || null
      } catch (error) {
        console.error("SQL get error:", error);
        return null;
      } finally {
        client.release()
      }
    },

    // SELECT sorguları için (birden fazla satır)
    async all(query: string, params: any[] = []) {
      console.warn("SQL query kullanımı algılandı. Prisma modellerine geçiş yapınız: " + query);
      // Basit sorgu analizi
      if (query.includes("FROM products")) {
        try {
          return await prisma.product.findMany({
            include: { category: true }
          });
        } catch (error) {
          console.error("Prisma ürün listesi hatası:", error);
        }
      }
      
      if (query.includes("FROM categories")) {
        try {
          return await prisma.category.findMany({
            orderBy: { name: 'asc' }
          });
        } catch (error) {
          console.error("Prisma kategori listesi hatası:", error);
        }
      }
      
      if (query.includes("FROM orders")) {
        try {
          const orders = await prisma.order.findMany({
            include: {
              customer: true,
              items: { include: { product: true } }
            },
            orderBy: { created_at: 'desc' }
          });
          return orders;
        } catch (error) {
          console.error("Prisma sipariş listesi hatası:", error);
        }
      }

      const client = await pool.connect()
      try {
        const result = await client.query(query, params)
        return result.rows
      } catch (error) {
        console.error("SQL all error:", error);
        return [];
      } finally {
        client.release()
      }
    },

    // INSERT, UPDATE, DELETE sorguları için
    async run(query: string, ...params: any[]) {
      console.warn("SQL query kullanımı algılandı. Prisma modellerine geçiş yapınız: " + query);
      
      const client = await pool.connect()
      try {
        return await client.query(query, preparePgParams(params))
      } catch (err) {
        console.error("Veritabanı sorgu hatası:", err);
        throw err;
      } finally {
        client.release();
      }
    },

    // Transaction için
    async exec(query: string) {
      console.warn("SQL query kullanımı algılandı. Prisma modellerine geçiş yapınız: " + query);
      
      const client = await pool.connect()
      try {
        return await client.query(query)
      } finally {
        client.release()
      }
    }
  }
}

// PostgreSQL için parametre hazırlama
function preparePgParams(params: any[]) {
  if (params.length === 0) {
    return [];
  } 
  else if (params.length === 1 && Array.isArray(params[0])) {
    // Parametre bir dizi ise, o diziyi kullan
    return params[0];
  } 
  else {
    // Farklı parametreler varsa hepsini birleştir
    return params;
  }
} 