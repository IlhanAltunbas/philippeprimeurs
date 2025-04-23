import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Config pour désactiver complètement le cache API
let cachedProducts: any = null;
let cacheTimestamp: number = 0;

// Fonction pour nettoyer le cache et revalider
const clearCache = () => {
  cachedProducts = null;
  cacheTimestamp = 0;
  revalidatePath('/'); // Revalider la page d'accueil
  return true;
};

// Correction des chemins d'image
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

// Endpoint spécial pour vider le cache
export async function DELETE(request: Request) {
  try {
    clearCache();
    return NextResponse.json({ success: true, message: "Cache des produits en vedette vidé" });
  } catch (error) {
    console.error("Erreur lors du vidage du cache:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timestamp = Date.now(); // Horodatage unique pour chaque requête
    const limit = searchParams.has('limit') 
      ? parseInt(searchParams.get('limit') || '4', 10) 
      : 4;
    
    // En-têtes pour désactiver complètement le cache du navigateur
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Timestamp': timestamp.toString()
    };
    
    // Désactivation complète du cache serveur
    // Nous récupérons toujours les données fraîches de la base de données
    
    // Calculer une limite basée sur le nombre total de produits actifs
    // pour assurer que les produits en vedette sont différents à chaque chargement
    const totalActiveProducts = await prisma.product.count({
      where: { is_active: true }
    });
    
    // Si le nombre de produits actifs est inférieur à la limite demandée, 
    // utiliser tous les produits disponibles
    const effectiveLimit = Math.min(limit, totalActiveProducts);
    
    // Récupérer des produits aléatoires
    const products = await prisma.product.findMany({
      where: { 
        is_active: true 
      },
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
      take: effectiveLimit,
      orderBy: { name: 'asc' }
    });
    
    // Convertir les données dans le format attendu par le frontend
    const formattedProducts = products.map((product: any) => ({
      ...product,
      category_name: product.category.name,
      image: getFormattedImagePath(product.id, product.image),
      category: undefined
    }));
    
    // Créer la réponse avec les données fraîches
    const response = { products: formattedProducts, timestamp };
    
    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error("Erreur lors du chargement des produits en vedette:", error);
    return NextResponse.json(
      { error: "Impossible de charger les produits en vedette" },
      { status: 500 }
    );
  }
}

// Statik olarak dışa aktarılabilir API yapılandırması
export const dynamic = 'force-static'
export const runtime = 'nodejs'
export const revalidate = 3600 // saatte bir yeniden doğrulama 
