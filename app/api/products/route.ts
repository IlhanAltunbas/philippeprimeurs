import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

// API'nin tamamen dinamik olmasını sağla, önbellekleme yok
export const dynamic = 'force-dynamic'

// Configuration de l'API produits - complètement sans cache
const ITEMS_PER_PAGE = 12;

// Correction du chemin d'image
const getFormattedImagePath = (productId: number, imagePath?: string | null) => {
  try {
    if (!imagePath || 
        typeof imagePath !== 'string' || 
        imagePath.trim() === '' || 
        imagePath === 'null' || 
        imagePath === 'undefined' ||
        imagePath.includes('NaN')) {
      return "/placeholder.svg";
    }
    
    // Cas spécial pour les images placeholder
    if (imagePath.includes('placeholder')) {
      return '/placeholder.svg';
    }
    
    // Toujours commencer par /
    if (!imagePath.startsWith('/')) {
      return `/${imagePath}`;
    }
    
    return imagePath;
  } catch (error) {
    return "/placeholder.svg";
  }
};

export async function GET(request: Request) {
  try {
    const timestamp = Date.now();
    console.log(`[${new Date().toISOString()}] Produits API çağrıldı, timestamp: ${timestamp}`);
    
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    
    // Dinamik parametre işleme
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE), 10);
    const categoryParam = searchParams.get('category');
    const searchTerm = searchParams.get('search') || '';
    
    // Kategori ID veya slug olabilir
    let categoryFilter: number | undefined = undefined;
    if (categoryParam) {
      // Eğer bir sayı ise, doğrudan ID kullan
      if (!isNaN(Number(categoryParam))) {
        categoryFilter = Number(categoryParam);
      } else {
        // Slug ise, kategoriyi isimle bul
        const category = await prisma.category.findFirst({
          where: { name: { equals: categoryParam, mode: 'insensitive' } }
        });
        if (category) {
          categoryFilter = category.id;
        }
      }
    }
    
    // En-têtes pour désactiver complètement le cache
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Timestamp': timestamp.toString()
    };
    
    // Calculer l'offset pour la pagination
    const skip = (page - 1) * limit;
    
    // Construire la requête de base pour les produits actifs
    let whereClause: any = {
      is_active: true
    };
    
    // Filtrage par catégorie
    if (categoryFilter) {
      whereClause.category_id = categoryFilter;
    }
    
    // Recherche par terme
    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }
    
    // Récupérer les produits filtrés avec pagination
    const products = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        price: true,
        category_id: true,
        quantity: true,
        unit: true,
        origin: true,
        description: true,
        image: true,
        is_composite: true,
        category: {
          select: {
            id: true,
            name: true
          }
        },
        contents: {
          select: {
            id: true,
            name: true,
            quantity: true,
            origin: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { name: 'asc' }
    });
    
    // Récupérer le nombre total de produits pour la pagination
    const total = await prisma.product.count({
      where: whereClause
    });
    
    // Calculer les métadonnées de pagination
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Formater les chemins d'image des produits
    const formattedProducts = products.map((product: any) => ({
      ...product,
      image: getFormattedImagePath(product.id, product.image),
    }));
    
    // Préparer la réponse avec les données fraîches et timestamp
    const response = {
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      timestamp
    };
    
    console.log(`[${new Date().toISOString()}] ${formattedProducts.length} ürün başarıyla döndürüldü`);
    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error("Erreur lors du chargement des produits:", error);
    return NextResponse.json(
      { error: "Impossible de charger les produits" },
      { status: 500 }
    );
  }
} 
