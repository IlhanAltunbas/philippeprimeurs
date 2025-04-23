import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { stat } from 'fs/promises';

// API endpoint servant les images
export async function GET(
  request: NextRequest
) {
  try {
    // Extract path from URL
    const url = new URL(request.url);
    const pathWithPrefix = url.pathname.replace('/api/products/', '');
    const pathSegments = pathWithPrefix.split('/');
    
    // Construire le chemin du fichier
    const imagePath = path.join(process.cwd(), 'public', 'products', ...pathSegments);
    
    // Déterminer le type MIME
    let contentType = 'image/jpeg'; // Par défaut
    if (imagePath.endsWith('.png')) contentType = 'image/png';
    if (imagePath.endsWith('.gif')) contentType = 'image/gif';
    if (imagePath.endsWith('.svg')) contentType = 'image/svg+xml';
    if (imagePath.endsWith('.webp')) contentType = 'image/webp';

    // Vérifier si le fichier existe
    try {
      await stat(imagePath);
    } catch (err) {
      // Fichier non trouvé, renvoyer l'image par défaut
      const placeholderPath = path.join(process.cwd(), 'public', 'placeholder.svg');
      const placeholderData = fs.readFileSync(placeholderPath);
      return new NextResponse(placeholderData, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400', // Cache d'un jour
        },
      });
    }

    // Lire le fichier
    const fileBuffer = fs.readFileSync(imagePath);
    
    // Renvoyer l'image
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache d'un jour
      },
    });
  } catch (error) {
    console.error('Erreur de service d\'image:', error);
    return NextResponse.json(
      { error: 'Erreur de chargement d\'image' },
      { status: 500 }
    );
  }
} 