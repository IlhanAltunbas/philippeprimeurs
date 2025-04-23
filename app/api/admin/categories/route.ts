import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// API complètement désactivée du cache
export async function GET(request: Request) {
  try {
    // API complètement désactivée du cache
    console.log(`[API] GET /api/admin/categories - ${new Date().toISOString()}`);
    
    // En-têtes pour empêcher la mise en cache
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Timestamp': Date.now().toString()
    };

    // Récupérer les catégories de la base de données - triées par ID
    const categories = await prisma.category.findMany({
      orderBy: {
        id: 'asc', // Tri par ID
      },
    });

    // Renvoyer la réponse des catégories
    return NextResponse.json(categories, { headers });
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des catégories." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Lire le corps de la requête et faire la validation
    let data;
    try {
      data = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Format de requête invalide" },
        { status: 400 }
      );
    }

    // Vérifier si le nom de la catégorie est valide
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      return NextResponse.json(
        { error: "Nom de catégorie invalide" },
        { status: 400 }
      );
    }

    // Vérifier si une catégorie avec ce nom existe déjà
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: 'insensitive', // Pour une recherche insensible à la casse
        },
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Une catégorie avec ce nom existe déjà" },
        { status: 400 }
      );
    }

    // Créer la nouvelle catégorie
    const newCategory = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description || '',
        is_active: data.is_active !== undefined ? data.is_active : true,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la catégorie:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création de la catégorie." },
      { status: 500 }
    );
  }
} 