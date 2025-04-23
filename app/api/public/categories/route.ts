import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    console.log(`[API] GET /api/public/categories - ${new Date().toISOString()}`);
    
    // En-têtes pour empêcher la mise en cache
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Timestamp': Date.now().toString()
    };

    // Récupérer les catégories actives de la base de données - triées par ID
    const categories = await prisma.category.findMany({
      where: {
        is_active: true
      },
      orderBy: {
        id: 'asc', // Tri par ID
      },
    });

    // Renvoyer la réponse des catégories
    return NextResponse.json(categories, { headers });
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories publiques:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des catégories." },
      { status: 500, headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
      }}
    );
  }
} 