import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import path from "path"
import fs from "fs"

// Fonction pour nettoyer le cache des produits en vedette (via API)
async function clearFeaturedProductsCache() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const timestamp = Date.now();
    const response = await fetch(`${apiUrl}/api/featured-products?refresh=true`, {
      method: 'DELETE',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Timestamp': timestamp.toString()
      }
    });
    
    const result = await response.json();
    // Log uniquement en cas d'erreur
    if (!result.success) {
      console.error("Échec du nettoyage du cache des produits en vedette");
    }
    return result.success;
  } catch (error) {
    console.error("Erreur lors du nettoyage du cache des produits en vedette:", error);
    return false;
  }
}

// Fonction de revalidation - régénère les pages de produits
async function triggerRevalidation() {
  try {
    // D'abord nettoyer le cache des produits en vedette
    await clearFeaturedProductsCache();
    
    const secret = process.env.REVALIDATE_SECRET || 'cle-secrete-philippe-primeurs'
    const paths = [
      '/products',
      '/', // Page d'accueil qui affiche également des produits
      '/admin/products', // Page des produits dans le panneau d'administration
      '/admin/(dashboard)/products', // Chemin alternatif (dossier avec parenthèses)
      '/admin' // Page d'accueil de l'administration
    ]
    
    console.log(`[${new Date().toISOString()}] Démarrage de la revalidation des pages après modification des produits`)
    
    // Revalider chaque chemin en parallèle
    await Promise.all(paths.map(async (path) => {
      try {
        const revalidateUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/revalidate?secret=${secret}&path=${path}&_=${Date.now()}`
        const response = await fetch(revalidateUrl, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`)
        }
        
        const result = await response.json()
        console.log(`[${new Date().toISOString()}] Revalidation pour ${path}: ${result.revalidated ? 'réussie' : 'échouée'} - ${result.message || ''}`)
      } catch (pathError) {
        console.error(`[${new Date().toISOString()}] Erreur lors de la revalidation du chemin ${path}:`, pathError)
      }
    }))
    
    // Forcer l'invalidation du cache côté client par tag
    try {
      const tagRevalidateUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/revalidate?secret=${secret}&tag=products&_=${Date.now()}`
      const tagResponse = await fetch(tagRevalidateUrl, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      
      const tagResult = await tagResponse.json()
      console.log(`[${new Date().toISOString()}] Revalidation par tag 'products': ${tagResult.revalidated ? 'réussie' : 'échouée'}`)
    } catch (tagError) {
      console.error(`[${new Date().toISOString()}] Erreur lors de la revalidation par tag:`, tagError)
    }
    
    console.log(`[${new Date().toISOString()}] Processus de revalidation terminé`)
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erreur globale de revalidation:`, error)
  }
}

export async function GET() {
  try {
    // En-têtes pour empêcher la mise en cache
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Timestamp': Date.now().toString()
    };

    // Récupérer les produits de la base de données avec les champs sélectionnés
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        image: true,
        category_id: true,
        quantity: true,
        unit: true,
        origin: true,
        is_composite: true,
        is_active: true,
        created_at: true,
        category: {
          select: {
            id: true,
            name: true,
            is_active: true
          }
        },
        contents: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transformation des données et vérification de cohérence
    // ... existing code ...

    return NextResponse.json(products, { headers });
  } catch (error) {
    console.error("Erreur lors de la récupération des produits:", error);
    return NextResponse.json(
      { error: "Une erreur s'est produite lors de la récupération des produits" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // En-têtes pour empêcher la mise en cache
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Timestamp': Date.now().toString()
    };

    const formData = await request.formData()
    
    // Récupérer les données du formulaire
    const name = formData.get('name') as string;
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: "Le nom du produit est requis" },
        { status: 400 }
      );
    }

    // Vérification du prix
    let price: number;
    try {
      price = parseFloat(formData.get('price') as string);
      if (isNaN(price)) throw new Error("Valeur de prix invalide");
    } catch (error) {
      console.error("Erreur de conversion du prix:", error);
      return NextResponse.json(
        { error: "Valeur de prix invalide" },
        { status: 400 }
      );
    }

    // Vérification de l'ID de catégorie - accepte à la fois category_id et categoryId
    let categoryId: number;
    try {
      const categoryIdStr = formData.get('category_id') as string || formData.get('categoryId') as string;
      
      if (!categoryIdStr || categoryIdStr.trim() === '') {
        return NextResponse.json(
          { error: "L'ID de catégorie est requis" },
          { status: 400 }
        );
      }
      
      categoryId = parseInt(categoryIdStr);
      if (isNaN(categoryId)) throw new Error("Valeur d'ID de catégorie invalide");
      
      // Vérifier si la catégorie existe
      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      if (!categoryExists) {
        console.error(`Catégorie non trouvée, ID: ${categoryId}`);
        return NextResponse.json(
          { error: "La catégorie spécifiée n'a pas été trouvée" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Erreur de conversion de l'ID de catégorie:", error);
      return NextResponse.json(
        { error: "Informations de catégorie invalides" },
        { status: 400 }
      );
    }

    // Vérification des produits composites
    const isCompositeStr = formData.get('isComposite');
    const isComposite = isCompositeStr === 'true';

    // Vérification de la quantité
    let quantity: number;
    try {
      if (isComposite) {
        quantity = 1; // Valeur par défaut pour les produits composites
      } else {
        const quantityStr = formData.get('quantity') as string;
        quantity = quantityStr ? parseFloat(quantityStr) : 1;
        if (isNaN(quantity)) {
          quantity = 1; // Valeur par défaut en cas de valeur invalide
        }
      }
    } catch (error) {
      console.error("Erreur de conversion de la quantité:", error);
      quantity = 1; // Valeur par défaut en cas d'erreur
    }

    // Vérification de l'unité
    const unit = isComposite ? "pc" : (formData.get('unit') as string);
    
    // Pour les produits composites, l'origine doit être vide
    const origin = isComposite ? null : (formData.get('origin') as string || null);
    const description = formData.get('description') as string || null;

    // Récupérer la valeur isActive
    const isActiveStr = formData.get('isActive');
    const isActive = isActiveStr === 'true' || isActiveStr === null || isActiveStr === undefined;

    // Traitement de l'image
    let imagePath = null;
    const imageData = formData.get('image');

    if (imageData instanceof File && imageData.size > 0) {
      try {
        const bytes = await imageData.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const publicDir = path.join(process.cwd(), 'public', 'products');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        
        // Déterminer l'extension correcte en fonction du type MIME
        let extension = path.extname(imageData.name).toLowerCase();
        const mimeType = imageData.type.toLowerCase();
        
        // Vérifier la cohérence entre le type MIME et l'extension
        const mimeToExt: Record<string, string> = {
          'image/jpeg': '.jpg',
          'image/jpg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
          'image/webp': '.webp',
          'image/svg+xml': '.svg'
        };
        
        // Si le type MIME est connu, utiliser l'extension correspondante
        if (mimeType in mimeToExt) {
          extension = mimeToExt[mimeType];
        } else if (!extension || extension === '.') {
          // Si l'extension n'est pas définie ou invalide, utiliser .jpg par défaut
          extension = '.jpg';
        }
        
        // Créer un nom de fichier unique avec la bonne extension
        const timestamp = Date.now();
        const baseFileName = imageData.name.replace(/\.[^/.]+$/, ""); // Nom sans extension
        const sanitizedFileName = baseFileName.replace(/[^a-zA-Z0-9_-]/g, "_"); // Nom sécurisé
        const uniqueFileName = `${timestamp}_${sanitizedFileName}${extension}`;
        const filePath = path.join(publicDir, uniqueFileName);
        
        try {
          await fs.promises.writeFile(filePath, buffer);
          imagePath = `products/${uniqueFileName}`;
          console.log(`Image sauvegardée: ${imagePath} (Type: ${mimeType})`);
        } catch (writeError) {
          console.error("Erreur d'écriture du fichier:", writeError);
          imagePath = "placeholder.jpg";
        }
      } catch (error) {
        console.error("Erreur lors de l'enregistrement de l'image:", error);
        // En cas d'erreur, utiliser l'image par défaut
        imagePath = "placeholder.jpg";
      }
    } else {
      imagePath = "placeholder.jpg";
    }

    // Préparer les contenus
    let contents = [];
    if (isComposite) {
      try {
        const contentsStr = formData.get('contents');
        if (contentsStr && typeof contentsStr === 'string') {
          contents = JSON.parse(contentsStr);
        }
      } catch (error) {
        console.error("Erreur d'analyse des contenus:", error);
        return NextResponse.json(
          { error: "Format invalide pour les contenus du produit composite" },
          { status: 400 }
        );
      }
    }

    // Créer le produit avec Prisma
    try {
      const newProduct = await prisma.product.create({
        data: {
          name,
          price: price,
          category_id: categoryId,
          quantity: quantity,
          unit,
          origin,
          description,
          image: imagePath,
          is_composite: isComposite,
          is_active: isActive,
          // Si c'est un produit composite, ajouter les contenus
          contents: isComposite && contents.length > 0 ? {
            create: contents.map((content: any) => ({
              name: content.name,
              quantity: content.quantity,
              origin: content.origin || null
            }))
          } : undefined
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
          is_active: true,
          created_at: true,
          category: {
            select: {
              id: true,
              name: true
            }
          },
          contents: true
        }
      });

      // Création du produit réussie
      await triggerRevalidation();
      return NextResponse.json(newProduct, { headers });
    } catch (prismaError) {
      console.error("Erreur Prisma lors de la création du produit:", prismaError);
      return NextResponse.json(
        { error: "Erreur de base de données: " + (prismaError instanceof Error ? prismaError.message : "erreur inconnue") },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Erreur lors de l'ajout du produit:", error);
    return NextResponse.json(
      { error: "Une erreur s'est produite lors de l'ajout du produit: " + (error instanceof Error ? error.message : "erreur inconnue") },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  // ... existing PUT code ...
  
  // Si l'opération est réussie, régénérer les pages
  await triggerRevalidation()
}

export async function DELETE(request: Request) {
  // ... existing DELETE code ...
  
  // Si l'opération est réussie, régénérer les pages
  await triggerRevalidation()
} 