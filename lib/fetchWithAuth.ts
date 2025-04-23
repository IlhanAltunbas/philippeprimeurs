import { cookies } from "next/headers";

/**
 * Auth token ile API'ye istek gönderen yardımcı fonksiyon
 * Her zaman cache'i devre dışı bırakacak şekilde düzenlenmiştir
 * @param url API endpoint URL'i
 * @param options Fetch seçenekleri
 * @returns Fetch response
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  // URL'e timestamp ekle (önbellek bypass için)
  const urlWithTimestamp = url.includes('?') 
    ? `${url}&_=${Date.now()}` 
    : `${url}?_=${Date.now()}`;
  
  // Varsayılan önbellek kontrolü başlıkları
  const cacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Timestamp': Date.now().toString(),
  };
  
  return fetch(urlWithTimestamp, {
    ...options,
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
      ...cacheHeaders,
      ...options?.headers,
    },
    cache: 'no-store',
  });
} 