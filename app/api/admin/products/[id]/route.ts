import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import path from "path"
import fs from "fs"

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Önbelleğe almayı önlemek için headers
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Timestamp': Date.now().toString()
    };
    
    // Next.js 15'te params'a erişmeden önce await kullanılmalı
    const urlParams = await context.params;
    console.log(`Ürün güncelleme isteği alındı, ID: ${urlParams.id}`);
    const formData = await request.formData();
    
    // Form verilerini al ve logla
    const name = formData.get('name') as string;
    const isActiveStr = formData.get('isActive');
    const isCompositeStr = formData.get('isComposite');
    const contentsStr = formData.get('contents');
    
    // Tüm form verilerini logla
    console.log("Gelen form verileri:", {
      name,
      isActive: isActiveStr,
      isComposite: isCompositeStr,
      price: formData.get('price'),
      categoryId: formData.get('category_id'),
      quantity: formData.get('quantity'),
      unit: formData.get('unit'),
      contents: contentsStr ? "Var" : "Yok"
    });
    
    // Contents varlığını kontrol et - debug için
    if (contentsStr) {
      try {
        const contents = JSON.parse(contentsStr as string);
        console.log(`İçerik dizisi mevcut. İçerik sayısı: ${contents.length}`);
      } catch (e) {
        console.error("İçerik verisi parse edilemedi:", e);
      }
    }
    
    // Ürün kimliğini sayıya dönüştür
    const productId = parseInt(urlParams.id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Geçersiz ürün kimliği" },
        { status: 400 }
      );
    }

    // Ürünün var olup olmadığını kontrol et
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Ürün bulunamadı" },
        { status: 404 }
      );
    }
    
    // Sadece isActive değeri gönderilmişse, sadece o alanı güncelle
    if (isActiveStr !== null && (!name || name.trim() === '')) {
      console.log(`Sadece isActive değeri güncelleniyor: ${isActiveStr}`);
      const isActive = isActiveStr === 'true';
      
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: { is_active: isActive },
        include: {
          category: true,
          contents: true
        }
      });
      
      // Kategori formatını önceki API'yle uyumlu hale getir
      return NextResponse.json({
        ...updatedProduct,
        category: {
          id: updatedProduct.category_id,
          name: updatedProduct.category.name
        }
      }, { headers });
    }
    
    // Form verilerini doğru şekilde al
    // İsim kontrolü
    if (!name || name.trim() === '') {
      console.error("Ürün ismi boş olamaz");
      return NextResponse.json(
        { error: "Ürün ismi boş olamaz" },
        { status: 400 }
      );
    }
    
    // Fiyat kontrolü
    let price: number;
    try {
      price = parseFloat(formData.get('price') as string);
      if (isNaN(price)) throw new Error("Geçersiz fiyat değeri");
    } catch (error) {
      console.error("Fiyat dönüştürme hatası:", error);
      return NextResponse.json(
        { error: "Geçersiz fiyat değeri" },
        { status: 400 }
      );
    }
    
    // Kategori kontrolü
    let categoryId: number;
    try {
      const categoryIdStr = formData.get('category_id') as string || formData.get('categoryId') as string;
      if (!categoryIdStr || categoryIdStr.trim() === '') {
        return NextResponse.json(
          { error: "Kategori ID'si gereklidir" },
          { status: 400 }
        );
      }
      
      categoryId = parseInt(categoryIdStr);
      if (isNaN(categoryId)) throw new Error("Geçersiz kategori ID değeri");
      
      // Kategorinin var olup olmadığını kontrol et
      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      if (!categoryExists) {
        return NextResponse.json(
          { error: "Belirtilen kategori bulunamadı" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Kategori ID dönüştürme hatası:", error);
      return NextResponse.json(
        { error: "Geçersiz kategori bilgisi" },
        { status: 400 }
      );
    }
    
    // Miktar kontrolü
    let quantity: number = existingProduct.quantity.toNumber(); // Mevcut değeri varsayılan olarak al
    try {
      const quantityStr = formData.get('quantity') as string;
      if (quantityStr) {
        quantity = parseFloat(quantityStr);
        if (isNaN(quantity) || quantity <= 0) {
          quantity = existingProduct.quantity.toNumber(); // Geçersizse mevcut değeri kullan
        }
      }
    } catch (error) {
      console.error("Miktar dönüştürme hatası:", error);
      // Hata durumunda mevcut değeri koru
    }
    
    // Birim kontrolü
    const unit = formData.get('unit') as string || existingProduct.unit;
    
    // Bileşik ürün kontrolü
    const isComposite = isCompositeStr === 'true';
    
    // Origin kontrolü - Bileşik ürünler için origin boş olmalı
    const origin = isComposite ? null : (formData.get('origin') as string || null);
    const description = formData.get('description') as string || null;
    
    // isActive kontrolü
    let isActive = existingProduct.is_active; // Varsayılan olarak mevcut değer
    
    if (isActiveStr !== null && isActiveStr !== undefined) {
      // Form'dan gelen değeri kullan
      isActive = isActiveStr === 'true';
    }
    
    // Resim işleme
    let imagePath = existingProduct.image; // Varsayılan olarak mevcut resmi kullan
    const imageData = formData.get('image');
    const imageUrl = formData.get('imageUrl'); // Frontend'den gelen mevcut resim URL'si
    const removeImage = formData.get('removeImage') === 'true';
    
    // Eğer bir dosya gönderildiyse
    if (imageData instanceof File && imageData.size > 0) {
      try {
        const bytes = await imageData.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const publicDir = path.join(process.cwd(), 'public', 'products');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        
        // Benzersiz dosya adı oluştur
        const timestamp = Date.now();
        const originalName = imageData.name;
        const extension = path.extname(originalName);
        const baseNameWithoutExt = path.basename(originalName, extension);

        // Dosya adını temizle: boşlukları '_' yap, özel karakterleri kaldır
        const sanitizedBaseName = baseNameWithoutExt
          .normalize('NFD') // Aksanları ayır
          .replace(/[\u0300-\u036f]/g, '') // Aksanları kaldır
          .replace(/\s+/g, '_') // Boşlukları _ ile değiştir
          .replace(/[^a-zA-Z0-9_.-]/g, ''); // Sadece harf, rakam, _, ., - kalsın

        const uniqueFileName = `${timestamp}_${sanitizedBaseName}${extension}`;
        const filePath = path.join(publicDir, uniqueFileName);
        
        await fs.promises.writeFile(filePath, buffer);
        imagePath = `products/${uniqueFileName}`;
      } catch (error) {
        console.error("Backend - DOSYA YAZMA HATASI:", error); // Detaylı loglama
        // Hata durumunda işlemi durdur ve 500 hatası döndür
        return NextResponse.json(
          { error: "Erreur lors de l\'enregistrement de l\'image sur le serveur.", details: (error as Error).message },
          { status: 500 }
        );
      }
    } else if (imageUrl) {
      // Eğer yeni bir resim yüklenmedi ama imageUrl gönderildiyse, bu URL'yi kullan
      imagePath = imageUrl as string;
      if (imagePath.startsWith('/')) {
        imagePath = imagePath.substring(1);
      }
    } else if (removeImage) {
      // Resim kaldırma isteği varsa
      imagePath = "placeholder.jpg";
    }
    
    // İçerik verisi işleme
    let contents = [];
    if (isComposite && contentsStr) {
      try {
        contents = JSON.parse(contentsStr as string);
      } catch (error) {
        console.error("Erreur d'analyse des contenus:", error);
        return NextResponse.json(
          { error: "Format invalide pour les contenus du produit composite" },
          { status: 400 }
        );
      }
    }
    
    // Ürünü güncelle ve içerikleri yönet
    const updatedProduct = await prisma.$transaction(async (tx: any) => {
      // Önce ürünü güncelle
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          name,
          price,
          category_id: categoryId,
          quantity,
          unit,
          origin,
          description,
          image: imagePath,
          is_composite: isComposite,
          is_active: isActive
        },
        include: {
          category: true
        }
      });
      
      // Eğer bileşik ürünse veya içerikler dizisi gönderildiyse, içerikleri güncelle
      if (isComposite || contentsStr) {
        // Önce mevcut içerikleri sil
        await tx.productContent.deleteMany({
          where: { product_id: productId }
        });
        
        // Sonra yeni içerikleri ekle
        if (contents.length > 0) {
          for (const content of contents) {
            await tx.productContent.create({
              data: {
                product_id: productId,
                name: content.name,
                quantity: content.quantity,
                origin: content.origin || null
              }
            });
          }
        }
      }
      
      // Güncellenmiş içeriklerle birlikte ürünü getir
      return await tx.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          contents: true
        }
      });
    });
    
    if (!updatedProduct) {
      throw new Error("Ürün güncellemesi sırasında beklenmeyen bir hata oluştu.");
    }
    
    // Kategori formatını önceki API'yle uyumlu hale getir
    return NextResponse.json({
      ...updatedProduct,
      category: {
        id: updatedProduct.category_id,
        name: updatedProduct.category.name
      }
    }, { headers });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Ürün güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Önbelleğe almayı önlemek için headers
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Timestamp': Date.now().toString()
    };

    // Next.js 15'te params'a erişmeden önce await kullanılmalı
    const { id } = await context.params;
    const productId = parseInt(id);
    
    // Ürün verilerini getir
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        contents: true
      }
    });
    
    if (!product) {
      return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
    }
    
    return NextResponse.json(product, { headers });
  } catch (error) {
    console.error("Ürün detayları getirme hatası:", error);
    return NextResponse.json(
      { error: "Ürün detayları yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Önbelleğe almayı önlemek için headers
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Timestamp': Date.now().toString()
    };
    
    // Next.js 15'te params'a erişmeden önce await kullanılmalı
    const params = await context.params;
    const productId = parseInt(params.id);
    const forceDelete = new URL(request.url).searchParams.get('force') === 'true';
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Geçersiz ürün kimliği" },
        { status: 400 }
      );
    }

    // Ürünün var olup olmadığını kontrol et
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json(
        { error: "Ürün bulunamadı" },
        { status: 404 }
      );
    }

    // Siparişlerde kullanılıp kullanılmadığını kontrol et
    const usedInOrders = await prisma.orderItem.findFirst({
      where: { product_id: productId }
    });

    // Eğer force=true değilse ve ürün siparişlerde kullanılıyorsa uyarı döndür
    if (usedInOrders && !forceDelete) {
      return NextResponse.json(
        { 
          warning: "Bu ürün siparişlerde kullanılıyor. Silmek için force=true parametresi ekleyin.", 
          usedInOrders: true 
        },
        { status: 400 }
      );
    }

    // Ürünün içeriklerini ve kendisini sil (cascade ilişkisi sayesinde içerikler otomatik silinecek)
    await prisma.product.delete({
      where: { id: productId }
    });

    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    console.error("Ürün silme hatası:", error);
    return NextResponse.json(
      { error: "Ürün silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 
