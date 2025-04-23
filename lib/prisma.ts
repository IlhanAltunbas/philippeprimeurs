import { PrismaClient } from '../prisma/generated/client'
import { createHash } from 'crypto'

// PostgreSQL için tip tanımları, ilk açılışta daha az sorgu yapması için
const databaseTypes = {
  Product: {
    id: 'int',
    name: 'string',
    price: 'decimal',
    category_id: 'int',
    quantity: 'decimal',
    unit: 'string?',
    origin: 'string?',
    description: 'string?',
    image: 'string?',
    is_composite: 'boolean',
    is_active: 'boolean',
    created_at: 'datetime'
  },
  Category: {
    id: 'int',
    name: 'string',
    is_default: 'boolean',
    is_active: 'boolean',
    description: 'string?',
    created_at: 'datetime'
  },
  Order: {
    id: 'int',
    customer_id: 'int',
    status: 'string',
    total: 'decimal',
    pickup_date: 'date?',
    pickup_time: 'string',
    created_at: 'datetime'
  }
}

// Prisma Client için performans optimizasyonları
// Caching ve tek bağlantıyla çalışma için global instance kullanımı
const globalForPrisma = global as unknown as { 
  prismaRead: PrismaClient,
  prismaWrite: PrismaClient
}

// Sorgu önbellek mekanizması
interface QueryCacheEntry {
  result: any;
  timestamp: number;
}

// Prisma sorgu argümanları için özel tip
type ExtendedArgs = Record<string, any> & {
  skipCache?: boolean;
}

// Model bazlı önbellek TTL değerleri (ms)
const CACHE_TTL_CONFIG = {
  Product: 0,      // Ürün: Önbellek yok
  Category: 0,     // Kategori: Önbellek yok
  Order: 0,         // Sipariş: Önbellek yok
  Customer: 0,     // Müşteri: Önbellek yok
  OrderItem: 0,     // Sipariş Öğesi: Önbellek yok
  DeliveryHour: 0, // Teslimat Saati: Önbellek yok
  ProductContent: 0,// Ürün İçeriği: Önbellek yok
  default: 0        // Varsayılan: Önbellek yok
};

// Modele göre TTL değerini al
const getTTL = (model: string): number => {
  return CACHE_TTL_CONFIG[model as keyof typeof CACHE_TTL_CONFIG] || CACHE_TTL_CONFIG.default;
};

// Basit bir önbellek
const queryCache = new Map<string, QueryCacheEntry>();

// Sorgu önbellek anahtarı oluşturma - daha güvenilir
function createCacheKey(model: string, operation: string, args: any): string {
  try {
    // skipCache'i önbellek anahtarı hesaplamada kullanma
    const { skipCache, ...restArgs } = args || {};
    
    // JSON serileştirmeden önce tarih objelerini string'e çevir
    const sanitizedArgs = JSON.stringify(restArgs, (key, value) => {
      // Date objelerini ISO string formatına çevir
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    });
    
    // Hash oluşturarak daha kompakt bir anahtar elde et
    const hash = createHash('md5').update(`${model}:${operation}:${sanitizedArgs}`).digest('hex');
    return hash;
  } catch (error) {
    console.error("Önbellek anahtarı oluşturma hatası:", error);
    // Hata durumunda benzersiz bir anahtar oluştur
    return `${model}:${operation}:${Date.now()}-${Math.random()}`;
  }
}

// Okuma için optimize edilmiş Prisma istemcisi
const readClient = new PrismaClient({
  log: [
    { level: 'error', emit: 'event' }
  ],
  
  // Transaction seçenekleri
  transactionOptions: {
    maxWait: 3000,     // Millisaniye cinsinden maksimum bekleme süresi
    timeout: 15000,    // Millisaniye cinsinden zaman aşımı süresi
    isolationLevel: 'ReadCommitted'
  },
  
  // PostgreSQL bağlantısı için ek ayarlar
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// Yazma için optimize edilmiş Prisma istemcisi (doğrudan bağlantı kullanır)
const writeClient = new PrismaClient({
  log: [
    { level: 'error', emit: 'event' },
    { level: 'query', emit: 'event' }
  ],
  
  // Transaction seçenekleri - yazma için daha uzun zaman aşımı
  transactionOptions: {
    maxWait: 5000,     // Millisaniye cinsinden maksimum bekleme süresi
    timeout: 30000,    // Millisaniye cinsinden zaman aşımı süresi 
    isolationLevel: 'ReadCommitted'
  },
  
  // PostgreSQL bağlantısı için ek ayarlar
  datasources: {
    db: {
      url: process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL
    }
  }
})

// Event handler ekle
readClient.$on('error' as any, (e: any) => {
  console.error('Read client prisma hata olayı:', e);
});

writeClient.$on('error' as any, (e: any) => {
  console.error('Write client prisma hata olayı:', e);
});

// Hata yakalama ve yeniden deneme middleware'ini ekle
readClient.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error: any) {
    // Bağlantı hatası mı?
    if (error.code === 'P1001' || error.code === 'P1002' || error.message?.includes('connection')) {
      console.error(`Veritabanı bağlantı hatası (okuma): ${error.message}. Yeniden deneniyor...`);
      
      // Kısa bir bekleme
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Yeniden dene
      try {
        return await next(params);
      } catch (retryError) {
        console.error(`Yeniden deneme başarısız (okuma): ${retryError}`);
        throw retryError;
      }
    }
    
    // Diğer hataları normal olarak fırlat
    throw error;
  }
});

writeClient.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error: any) {
    // Bağlantı hatası mı?
    if (error.code === 'P1001' || error.code === 'P1002' || error.message?.includes('connection')) {
      console.error(`Veritabanı bağlantı hatası (yazma): ${error.message}. Yeniden deneniyor...`);
      
      // Daha uzun bir bekleme
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Yeniden dene
      try {
        return await next(params);
      } catch (retryError) {
        console.error(`Yeniden deneme başarısız (yazma): ${retryError}`);
        throw retryError;
      }
    }
    
    // Diğer hataları normal olarak fırlat
    throw error;
  }
});

// İstemcileri önbelleğe al
const cachedReadClient = globalForPrisma.prismaRead || readClient;
const cachedWriteClient = globalForPrisma.prismaWrite || writeClient;

// Okuma istemcisini genişlet
const extendedReadClient = cachedReadClient.$extends({
  query: {
    $allModels: {
      // SQL sorgu loglama ve önbellekleme
      async $allOperations({ operation, model, args, query }) {
        try {
          // Önbellek sistemi devre dışı bırakıldı - tüm sorgular doğrudan veritabanından
          
          // Performans ölçümü başlat
          const start = performance.now();
          
          try {
            // Sorguyu çalıştır
            const result = await query(args);
            
            // Performans ölçümü tamamla
            const end = performance.now();
            const duration = end - start;
            
            // Yavaş sorguları logla
            if (duration > 500) {
              console.log(`Yavaş sorgu (${duration.toFixed(2)}ms): ${model}.${operation}`);
            }
            
            // Artık önbellekleme yapmıyoruz, doğrudan sorgu sonucunu döndür
            return result;
          } catch (queryError) {
            // Sorgu hatası durumunda da süreyi logla
            const end = performance.now();
            console.error(`SORGU HATASI: ${model}.${operation} - ${Math.round(end - start)}ms`, queryError);
            throw queryError;
          }
        } catch (middlewareError) {
          console.error("Prisma middleware hatası:", middlewareError);
          // Orjinal sorguyu çalıştırmaya devam et, middleware'i pas geç
          return query(args);
        }
      },
    },
  },
});

// Yazma işlemcisini genişlet - önbellek temizleme ve loglama
const extendedWriteClient = cachedWriteClient.$extends({
  query: {
    $allModels: {
      // Yazma işlemlerini logla ve önbelleği temizle
      async $allOperations({ operation, model, args, query }) {
        try {
          // Yazma işlemleri için loglama
          const isWriteOperation = ['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany'].includes(operation);
          
          if (isWriteOperation) {
            console.log(`Veritabanı yazma işlemi: ${model}.${operation}`);
          }
          
          // Performans ölçümü başlat
          const start = performance.now();
          
          try {
            // Sorguyu çalıştır
            const result = await query(args);
            
            // Performans ölçümü tamamla
            const end = performance.now();
            const duration = end - start;
            
            // Yavaş işlemleri logla
            if (duration > 200) {
              console.log(`Yavaş yazma işlemi (${duration.toFixed(2)}ms): ${model}.${operation}`);
            }
            
            // İşlem başarılı
            if (isWriteOperation) {
              console.log(`Veritabanı yazma işlemi tamamlandı: ${model}.${operation}`);
            }
            
            return result;
          } catch (queryError) {
            // Hata durumunda detaylı loglama
            console.error(`Sorgu hatası (${model}.${operation}):`, queryError);
            throw queryError;
          }
        } catch (error) {
          console.error(`Middleware hatası (${model}.${operation}):`, error);
          throw error;
        }
      }
    }
  }
});

// Tek bir genel client içinde birleştir
export const prisma = {
  ...extendedReadClient,
  
  // Yazma işlemleri için açık metod ekleyelim
  write: extendedWriteClient,
  
  // Özel transaction işlemi - her iki client birlikte kullanılsın
  async $transaction<T>(fn: (tx: any) => Promise<T>, options?: any): Promise<T> {
    return extendedWriteClient.$transaction(fn, options);
  },
  
  // Connection için ana client'i kullan
  async $connect() {
    await Promise.all([
      extendedReadClient.$connect(),
      extendedWriteClient.$connect()
    ]);
    return true;
  },
  
  async $disconnect() {
    await Promise.all([
      extendedReadClient.$disconnect(),
      extendedWriteClient.$disconnect()
    ]);
    return true;
  }
};

// Bağlantı kontrolü ve önbellekleme
if (!globalForPrisma.prismaRead || !globalForPrisma.prismaWrite) {
  console.log("Prisma bağlantısı başlatılıyor...");
  
  prisma.$connect()
    .then(async () => {
      console.log('Prisma veritabanına bağlandı');
      
      // Bağlantı ısıtması - ilk sorguları hızlandırmak için
      const warmupQueries = async () => {
        try {
          console.log("Bağlantıyı ısıtmak için yapılandırma tip bilgilerini önbelleğe alıyorum...");
          
          // Önceden yükleme ile ilk sorguları hızlandır
          await Promise.allSettled([
            prisma.category.count({
              where: { is_active: true }
            }),
            prisma.product.count({
              where: { is_active: true }
            }),
            prisma.deliveryHour.count()
          ]);
          
          console.log('Veritabanı bağlantısı ısındı - önceden yükleme tamamlandı');
        } catch (e) {
          console.error('Bağlantı ısıtma hatası:', e);
        }
      };
      
      // Asenkron olarak ısındır (biraz geciktir - ilk başlangıçta yükü dengeleyelim)
      setTimeout(warmupQueries, 2000);
    })
    .catch(e => {
      console.error('Prisma bağlantı hatası:', e);
    });
    
  // Hot reloading sırasında yeniden bağlanmayı önle
  globalForPrisma.prismaRead = cachedReadClient;
  globalForPrisma.prismaWrite = cachedWriteClient;
}

// Tüm önbelleği temizleme
const cleanupCache = () => {
  // Önbellek devre dışı olduğu için hiçbir işlem yapılmıyor
  console.log("Önbellek temizleme isteği alındı, fakat önbellek devre dışı (no-op)");
  return;
};

// Önbelleği temizleme (API için)
export function clearPrismaCache(model?: string) {
  // Önbellek devre dışı olduğu için hiçbir işlem yapılmıyor
  console.log(`Önbellek temizleme isteği alındı: ${model || 'tüm modeller'}, fakat önbellek devre dışı (no-op)`);
  return;
}

// Eski db.ts API için uyarı fonksiyonu
export async function openDb() {
  console.error("DEPRECATED: openDb() artık kullanılmamalıdır! Doğrudan Prisma Client kullanın: import { prisma } from '@/lib/prisma'");
  
  // Örnekler:
  console.error("Örnek: SQL yerine şöyle kullanın:");
  console.error(`- Eski: db.all("SELECT * FROM products WHERE is_active = $1", [true])`);
  console.error(`+ Yeni: prisma.product.findMany({ where: { is_active: true } })`);
  
  throw new Error("openDb() kullanımı kaldırıldı. Prisma Client'a geçiniz.");
}

// Statik derleme için Prisma istemcisini güçlendirme
export const isBuild = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

// Eğer build işlemi sırasında veritabanı hatası alınırsa bunu handle eden bir helper
export const prismaWithErrorHandling = {
  ...prisma,
  $connect: async () => {
    if (isBuild) {
      console.log("Build modu - Prisma bağlantısı simüle ediliyor");
      return Promise.resolve();
    }
    return prisma.$connect();
  },
  $disconnect: async () => {
    if (isBuild) {
      console.log("Build modu - Prisma bağlantısı kapatılıyor (simüle)");
      return Promise.resolve();
    }
    return prisma.$disconnect();
  },
}; 
