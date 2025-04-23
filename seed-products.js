const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL bağlantısı
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'philippedb',
  user: process.env.DB_USER || 'useri',
  password: process.env.DB_PASSWORD,
});

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('Veritabanına örnek veriler ekleniyor...');
    
    // Transaction başlat
    await client.query('BEGIN');
    
    // Tablolar var mı kontrol et
    const tables = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'categories'
      )
    `);
    
    if (!tables.rows[0].exists) {
      console.log('Veritabanında gerekli tablolar bulunamadı. Önce tabloları oluşturun.');
      return;
    }
    
    // Kategorileri ekle veya güncelle
    const categories = [
      { name: "Légumes", description: "Légumes frais et de saison" },
      { name: "Fruits", description: "Fruits frais et de saison" },
      { name: "Paniers", description: "Paniers composés de produits variés" },
      { name: "Colis", description: "Colis préparés avec soin" },
      { name: "Fait Maison", description: "Produits faits maison" }
    ];
    
    for (const category of categories) {
      // Önce kategorinin var olup olmadığını kontrol et
      const existingCategory = await client.query(
        'SELECT id FROM categories WHERE name = $1',
        [category.name]
      );
      
      if (existingCategory.rowCount > 0) {
        // Varsa güncelle
        await client.query(`
          UPDATE categories 
          SET description = $1, is_active = true
          WHERE name = $2
        `, [category.description, category.name]);
      } else {
        // Yoksa ekle
        await client.query(`
          INSERT INTO categories (name, description, is_active)
          VALUES ($1, $2, true)
        `, [category.name, category.description]);
      }
    }
    
    console.log('Kategoriler eklendi veya güncellendi');
    
    // Kategorileri getir (ID'ler için)
    const categoriesResult = await client.query('SELECT * FROM categories');
    const categoriesMap = {};
    categoriesResult.rows.forEach(cat => {
      categoriesMap[cat.name] = cat.id;
    });
    
    // Örnek ürünler ekle
    const products = [
      {
        name: "Pommes de terre", 
        price: 2.50, 
        category: "Légumes",
        quantity: 1,
        unit: "kg",
        origin: "France",
        description: "Pommes de terre fraîches",
        is_composite: false,
        image: "products/placeholder.jpg"
      },
      {
        name: "Carottes", 
        price: 1.80, 
        category: "Légumes",
        quantity: 1,
        unit: "kg",
        origin: "France",
        description: "Carottes fraîches et croquantes",
        is_composite: false,
        image: "products/placeholder.jpg"
      },
      {
        name: "Tomates", 
        price: 3.20, 
        category: "Légumes",
        quantity: 1,
        unit: "kg",
        origin: "France",
        description: "Tomates juteuses et parfumées",
        is_composite: false,
        image: "products/placeholder.jpg"
      },
      {
        name: "Pommes", 
        price: 2.90, 
        category: "Fruits",
        quantity: 1,
        unit: "kg",
        origin: "France",
        description: "Pommes croquantes et sucrées",
        is_composite: false,
        image: "products/placeholder.jpg"
      },
      {
        name: "Oranges", 
        price: 3.40, 
        category: "Fruits",
        quantity: 1,
        unit: "kg",
        origin: "Espagne",
        description: "Oranges juteuses et sucrées",
        is_composite: false,
        image: "products/placeholder.jpg"
      },
      {
        name: "Bananes", 
        price: 2.75, 
        category: "Fruits",
        quantity: 1,
        unit: "kg",
        origin: "Équateur",
        description: "Bananes mûres à point",
        is_composite: false,
        image: "products/placeholder.jpg"
      },
      {
        name: "Panier de fruits", 
        price: 19.90, 
        category: "Paniers",
        quantity: 1,
        unit: "panier",
        origin: "Divers",
        description: "Panier composé de fruits de saison variés",
        is_composite: true,
        image: "products/placeholder.jpg",
        contents: [
          { name: "Pommes", quantity: "500g", origin: "France" },
          { name: "Oranges", quantity: "500g", origin: "Espagne" },
          { name: "Bananes", quantity: "500g", origin: "Équateur" },
          { name: "Kiwis", quantity: "300g", origin: "France" }
        ]
      },
      {
        name: "Panier de légumes", 
        price: 17.50, 
        category: "Paniers",
        quantity: 1,
        unit: "panier",
        origin: "Divers",
        description: "Panier composé de légumes de saison variés",
        is_composite: true,
        image: "products/placeholder.jpg",
        contents: [
          { name: "Pommes de terre", quantity: "500g", origin: "France" },
          { name: "Carottes", quantity: "500g", origin: "France" },
          { name: "Tomates", quantity: "500g", origin: "France" },
          { name: "Oignons", quantity: "300g", origin: "France" }
        ]
      },
      {
        name: "Colis familial", 
        price: 35.00, 
        category: "Colis",
        quantity: 1,
        unit: "colis",
        origin: "Divers",
        description: "Grand colis pour famille composé de fruits et légumes variés",
        is_composite: true,
        image: "products/placeholder.jpg",
        contents: [
          { name: "Pommes de terre", quantity: "1kg", origin: "France" },
          { name: "Carottes", quantity: "1kg", origin: "France" },
          { name: "Pommes", quantity: "1kg", origin: "France" },
          { name: "Oranges", quantity: "1kg", origin: "Espagne" },
          { name: "Oignons", quantity: "500g", origin: "France" },
          { name: "Poireaux", quantity: "500g", origin: "France" }
        ]
      },
      {
        name: "Soupe maison", 
        price: 7.50, 
        category: "Fait Maison",
        quantity: 1,
        unit: "litre",
        origin: "France",
        description: "Soupe de légumes préparée sur place avec des ingrédients frais",
        is_composite: false,
        image: "products/placeholder.jpg"
      }
    ];
    
    // Ürünleri ekle
    for (const product of products) {
      const categoryId = categoriesMap[product.category];
      if (!categoryId) {
        console.log(`Kategori bulunamadı: ${product.category}`);
        continue;
      }
      
      // Önce ürünün var olup olmadığını kontrol et
      const existingProduct = await client.query(
        'SELECT id FROM products WHERE name = $1',
        [product.name]
      );
      
      let productId;
      
      if (existingProduct.rowCount > 0) {
        // Varsa güncelle
        productId = existingProduct.rows[0].id;
        
        await client.query(`
          UPDATE products 
          SET price = $1, 
              category_id = $2, 
              quantity = $3, 
              unit = $4, 
              origin = $5, 
              description = $6, 
              is_composite = $7, 
              is_active = true,
              image = $8
          WHERE id = $9
        `, [
          product.price, 
          categoryId, 
          product.quantity,
          product.unit, 
          product.origin, 
          product.description, 
          product.is_composite,
          product.image,
          productId
        ]);
      } else {
        // Yoksa ekle
        const productResult = await client.query(`
          INSERT INTO products (
            name, price, category_id, quantity, unit, origin, description, is_composite, is_active, image
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
          RETURNING id
        `, [
          product.name, 
          product.price, 
          categoryId, 
          product.quantity,
          product.unit, 
          product.origin, 
          product.description, 
          product.is_composite,
          product.image
        ]);
        
        productId = productResult.rows[0].id;
      }
      
      // Ürün kompozit ise içeriklerini ekle
      if (product.is_composite && product.contents) {
        // Önce mevcut içerikleri temizle
        await client.query('DELETE FROM product_contents WHERE product_id = $1', [productId]);
        
        // Yeni içerikleri ekle
        for (const content of product.contents) {
          await client.query(`
            INSERT INTO product_contents (product_id, name, quantity, origin)
            VALUES ($1, $2, $3, $4)
          `, [productId, content.name, content.quantity, content.origin]);
        }
      }
    }
    
    // Teslimat saatlerini ekle (aralık olarak)
    console.log('Teslimat saat aralıkları ekleniyor...');
    const daysOfWeek = [0, 1, 2, 3, 4, 5, 6]; // Pazar'dan Cumartesi'ye
    const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]; // Gün isimleri
    const morningStart = '08:30';
    const morningEnd = '12:00';
    const afternoonStart = '14:00';
    const afternoonEnd = '19:00';

    for (const day of daysOfWeek) {
      // O güne ait mevcut kayıtları temizle (varsa)
      await client.query('DELETE FROM delivery_hours WHERE day_of_week = $1', [day]);

      // Yeni aralıkları ekle
      const dayName = dayNames[day]; // Sayısal günü isme çevir
      await client.query(`
        INSERT INTO delivery_hours (day, day_of_week, is_open, morning_enabled, afternoon_enabled, morning_start, morning_end, afternoon_start, afternoon_end)
        VALUES ($1, $2, true, true, true, $3, $4, $5, $6)
      `, [dayName, day, morningStart, morningEnd, afternoonStart, afternoonEnd]);
    }
    console.log('Teslimat saat aralıkları başarıyla eklendi');

    // Commitle
    await client.query('COMMIT');
    console.log('Veritabanına örnek veriler başarıyla eklendi!');
  } catch (error) {
    // Hata durumunda rollback
    await client.query('ROLLBACK');
    console.error('Veritabanına veri ekleme hatası:', error);
  } finally {
    // Bağlantıyı kapat
    client.release();
    pool.end();
  }
}

// Seed fonksiyonunu çalıştır
seed(); 
