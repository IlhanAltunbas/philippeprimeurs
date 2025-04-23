import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Récupérer une catégorie spécifique
export async function GET(
  request: NextRequest
) {
  try {
    // En-têtes pour empêcher la mise en cache
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Timestamp': Date.now().toString()
    };

    // Get categoryId from request URL instead of params
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    // The categoryId should be the last segment of the path
    const categoryIdStr = pathSegments[pathSegments.length - 1];
    const categoryId = parseInt(categoryIdStr);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: "ID de catégorie invalide" },
        { status: 400 }
      );
    }
    
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    
    if (!category) {
      return NextResponse.json(
        { error: "Catégorie non trouvée" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(category, { headers });
  } catch (error) {
    console.error("Erreur lors de la récupération de la catégorie:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération de la catégorie" },
      { status: 500 }
    );
  }
}

// Mettre à jour une catégorie
export async function PUT(
  request: NextRequest
) {
  try {
    // En-têtes pour empêcher la mise en cache
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Timestamp': Date.now().toString()
    };

    // Get categoryId from request URL instead of params
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    // The categoryId should be the last segment of the path
    const categoryIdStr = pathSegments[pathSegments.length - 1];
    const categoryId = parseInt(categoryIdStr);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: "ID de catégorie invalide" },
        { status: 400 }
      );
    }
    
    // Vérifier si la catégorie existe
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: "Catégorie non trouvée" },
        { status: 404 }
      );
    }
    
    // Lire le corps de la requête et faire la validation
    let data;
    try {
      data = await request.json();
    } catch (parseError) {
      console.error("Erreur d'analyse JSON:", parseError);
      return NextResponse.json(
        { error: "Format de requête invalide" },
        { status: 400 }
      );
    }
    
    // Vérifier les données
    if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim() === '')) {
      return NextResponse.json(
        { error: "Nom de catégorie invalide" },
        { status: 400 }
      );
    }
    
    // Mettre à jour la catégorie
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        description: data.description !== undefined ? data.description : undefined,
        is_active: data.is_active !== undefined ? data.is_active : undefined,
      },
    });
    
    return NextResponse.json(updatedCategory, { headers });
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour de la catégorie:", error);
    
    // Erreur de contrainte unique Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Une catégorie avec ce nom existe déjà" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la mise à jour de la catégorie" },
      { status: 500 }
    );
  }
}

// Supprimer une catégorie
export async function DELETE(
  request: NextRequest
) {
  try {
    // En-têtes pour empêcher la mise en cache
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Timestamp': Date.now().toString()
    };

    // Get categoryId from request URL instead of params
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    // The categoryId should be the last segment of the path
    const categoryIdStr = pathSegments[pathSegments.length - 1];
    const categoryId = parseInt(categoryIdStr);
    
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { error: "ID de catégorie invalide" },
        { status: 400 }
      );
    }
    
    // Vérifier si la catégorie existe
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: "Catégorie non trouvée" },
        { status: 404 }
      );
    }
    
    // Supprimer la catégorie
    await prisma.category.delete({
      where: { id: categoryId },
    });
    
    return NextResponse.json({ message: "Catégorie supprimée avec succès" }, { headers });
  } catch (error: any) {
    console.error("Erreur lors de la suppression de la catégorie:", error);
    
    // Prisma constraint error - Category has related products
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Impossible de supprimer cette catégorie car elle est liée à des produits" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression de la catégorie" },
      { status: 500 }
    );
  }
} 