import { useAuth } from './auth'
import { API_BASE_URL } from './api-config'

// API URL depuis la variable d'environnement ou api-config
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';

// Cache pour les requêtes
interface CacheEntry {
  data: any;
  timestamp: number;
}

const apiCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60000; // 60 secondes

// Obtenir le token d'authentification
const getAuthToken = (): string | null => {
  const { token } = useAuth.getState();
  return token;
};

// Fonction fetch avec authentification
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  cache: boolean = false,
  cacheTTL: number = CACHE_TTL
): Promise<Response> {
  // Créer une clé de cache
  const cacheKey = `${url}_${JSON.stringify(options.body || '')}`;
  
  // Vérification du cache
  if (cache && options.method === 'GET' && apiCache.has(cacheKey)) {
    const cachedEntry = apiCache.get(cacheKey)!;
    const now = Date.now();
    
    // Le cache est-il encore valide?
    if (now - cachedEntry.timestamp < cacheTTL) {
      // Retourner la réponse en cache
      return new Response(JSON.stringify(cachedEntry.data), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    // Cache expiré, le supprimer
    apiCache.delete(cacheKey);
  }

  // Obtenir le token
  const token = getAuthToken();

  // Créer les en-têtes
  const headers = new Headers(options.headers || {});
  
  // Ajouter le token s'il existe
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Ajouter Content-Type s'il n'est pas spécifié
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Options fetch
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    // Ajouter credentials
    credentials: 'include',
  };

  // Envoyer la requête fetch
  const response = await fetch(`${apiBaseUrl}${url}`, fetchOptions);
  
  // Mettre en cache les réponses GET réussies
  if (cache && options.method === 'GET' && response.ok) {
    const responseClone = response.clone();
    const data = await responseClone.json();
    
    // Ajouter les données au cache
    apiCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }
  
  return response;
}

// Vider le cache
export function clearApiCache(urlPattern?: string): void {
  if (urlPattern) {
    // Vider les entrées du cache correspondant au modèle d'URL
    Array.from(apiCache.keys()).forEach(key => {
      if (key.startsWith(urlPattern)) {
        apiCache.delete(key);
      }
    });
  } else {
    // Vider tout le cache
    apiCache.clear();
  }
}

// Cache qui se nettoie automatiquement après un certain temps
export function initApiCacheCleanup(interval: number = 300000): () => void {
  const cleanup = () => {
    const now = Date.now();
    Array.from(apiCache.entries()).forEach(([key, entry]) => {
      if (now - entry.timestamp > CACHE_TTL) {
        apiCache.delete(key);
      }
    });
  };
  
  // Démarrer l'intervalle de nettoyage
  const intervalId = setInterval(cleanup, interval);
  
  // Fonction pour arrêter le nettoyage
  return () => clearInterval(intervalId);
}

// Fonction auxiliaire pour les requêtes parallèles
export async function fetchParallel<T>(
  urls: string[],
  options: RequestInit = {},
  cache: boolean = false
): Promise<T[]> {
  return Promise.all(
    urls.map(url => 
      fetchWithAuth(url, options, cache)
        .then(res => res.json())
    )
  );
} 