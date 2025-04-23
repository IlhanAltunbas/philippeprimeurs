import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 dakika
})

export function getCachedData(key: string) {
  return cache.get(key)
}

export function setCachedData(key: string, data: any) {
  cache.set(key, data)
}

export function deleteCachedData(key: string) {
  cache.delete(key)
}

export function clearCache() {
  cache.clear()
} 