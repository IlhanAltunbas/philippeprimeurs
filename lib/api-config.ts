export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''; 

// Fonction pour corriger les chemins d'images et résoudre les problèmes de build
export const getImageUrl = (imagePath: string | null | undefined): string => {
  try {
    // Vérification des valeurs nulles, non définies ou invalides
    if (!imagePath || 
        typeof imagePath !== 'string' || 
        imagePath.trim() === '' || 
        imagePath === 'null' || 
        imagePath === 'undefined' || 
        imagePath.includes('NaN')) {
      return '/placeholder.svg'; 
    }
    
    // Çift ön ek kontrolü ve düzeltme
    if (imagePath.includes('/api/products//api/')) {
      return imagePath.replace('/api/products//api/', '/api/');
    }
    
    // Eğer zaten /api/products/ ile başlıyorsa değiştirme
    if (imagePath.startsWith('/api/products/')) {
      return imagePath;
    }
    
    // Pour les URL complètes
    if (imagePath.startsWith('http')) return imagePath;
    
    // Pour les images encodées en base64
    if (imagePath.startsWith('data:')) return imagePath;
    
    // Pour les images placeholder
    if (imagePath.includes('placeholder')) {
      return '/placeholder.svg';
    }
    
    // Pour les chemins commençant par products/ ou /products/
    if (imagePath.includes('products/') || imagePath.includes('/products/')) {
      // Nettoyer le chemin pour extraire juste le nom du fichier et éventuels sous-répertoires
      const cleanPath = imagePath.replace(/^\/?(products\/)/i, '');
      
      // Si nous sommes en production ou après build, utiliser l'API pour servir l'image
      if (process.env.NODE_ENV === 'production') {
        return `/api/products/${cleanPath}`;
      }
      
      // En développement, utiliser le chemin normal pour une meilleure performance
      return `/products/${cleanPath}`;
    }
    
    // Pour les chemins commençant par /
    if (imagePath.startsWith('/')) {
      return imagePath;
    }
    
    // Pour les autres types de chemins, ajouter /
    return `/${imagePath}`;
  } catch (error) {
    // En cas d'erreur, renvoyer l'image par défaut
    console.error('Erreur dans getImageUrl:', error);
    return '/placeholder.svg';
  }
}; 
