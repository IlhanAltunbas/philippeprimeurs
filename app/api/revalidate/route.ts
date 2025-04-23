import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

// Cette clé secrète est utilisée pour empêcher les demandes de revalidation non autorisées
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'cle-secrete-philippe-primeurs'

// Statik olarak dışa aktarılabilir API yapılandırması
export const dynamic = 'force-static'
export const runtime = 'nodejs'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  const path = request.nextUrl.searchParams.get('path') || '/'
  const tag = request.nextUrl.searchParams.get('tag')
  
  // Vérification de sécurité
  if (secret !== REVALIDATE_SECRET) {
    return NextResponse.json(
      { 
        revalidated: false, 
        message: 'Clé de validation invalide' 
      },
      { 
        status: 401 
      }
    )
  }

  try {
    // Revalidation par tag ou chemin
    if (tag) {
      // Revalider le contenu associé à un tag spécifique
      revalidateTag(tag)
      return NextResponse.json({ 
        revalidated: true,
        message: `Tag revalidé avec succès: ${tag}`,
        timestamp: Date.now()
      })
    } else {
      // Revalider un chemin spécifique
      revalidatePath(path)
      return NextResponse.json({ 
        revalidated: true,
        message: `Chemin revalidé avec succès: ${path}`,
        timestamp: Date.now()
      })
    }
  } catch (error) {
    // Enregistrer l'erreur
    console.error(`Erreur de revalidation: ${tag ? `tag=${tag}` : `path=${path}`}`, error)
    return NextResponse.json(
      { 
        revalidated: false,
        message: `Échec de la revalidation: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
      },
      { 
        status: 500 
      }
    )
  }
} 