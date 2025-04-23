import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { API_BASE_URL } from './api-config'

interface AuthState {
  token: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => boolean
}

// API URL'sini doğrudan ortam değişkeninden veya api-config'den al
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || API_BASE_URL || '';

// Optimize token storage
const tokenKey = 'auth-token';
const tokenStorageExpiry = 86400000; // 24 saat (ms)

// Optimize cookie operations
const setCookie = (value: string, days: number) => {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${tokenKey}=${encodeURIComponent(value)}; expires=${expires}; path=/`
}

// Optimize token retrieval with caching
let cachedToken: string | null = null;
const getTokenFromCookie = (): string | null => {
  if (typeof document === 'undefined') return null
  
  // Return cached token if available
  if (cachedToken) return cachedToken;
  
  const match = document.cookie.match(new RegExp(`(^| )${tokenKey}=([^;]+)`))
  cachedToken = match ? decodeURIComponent(match[2]) : null;
  return cachedToken;
}

// Clear token cache when needed
const clearTokenCache = () => {
  cachedToken = null;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      isAuthenticated: false,
      checkAuth: () => {
        const cookieToken = getTokenFromCookie(); // Cookie'yi (veya cache'i) oku
        const currentStateIsAuth = get().isAuthenticated; // Mevcut state'i oku

        // Eğer state 'false' ama cookie'de token varsa, state'i güncelle (asenkron)
        if (!currentStateIsAuth && cookieToken) {
          set({ token: cookieToken, isAuthenticated: true });
        }

        // Cookie'de token varsa HER ZAMAN true dön
        // (State güncellenmemiş olsa bile, kullanıcı teknik olarak giriş yapmıştır)
        return !!cookieToken; // !! ile boolean'a çevir
      },
      login: async (username: string, password: string) => {
        try {
          const response = await fetch(`/api/admin/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
          })

          if (!response.ok) {
            throw new Error('Giriş başarısız')
          }

          const data = await response.json()
          
          // Token'ı hem store'a hem cookie'ye kaydet
          setCookie(data.access_token, 1) // 1 gün geçerli
          
          // Token'ı cache'le
          cachedToken = data.access_token;

          // State'i güncelle
          set({
            token: data.access_token,
            isAuthenticated: true,
          })
          
          return data
        } catch (error) {
          console.error('Auth Store - Login error:', error)
          throw error
        }
      },
      logout: () => {
        // Cache'i temizle
        clearTokenCache();
        
        // State'i temizle
        set({ token: null, isAuthenticated: false })
        
        // Cookie'yi temizle
        if (typeof document !== 'undefined') {
          document.cookie = `${tokenKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
        }
      }
    }),
    {
      name: 'auth-storage',
      version: 1,
      storage: createJSONStorage(() => {
        // Client tarafında localStorage'ı kullan
        if (typeof window !== 'undefined') {
          return localStorage
        }
        // Server tarafında boş bir storage kullan
        return {
          getItem: () => null,
          setItem: () => null,
          removeItem: () => null
        }
      }),
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== 'undefined') {
          const cookieToken = getTokenFromCookie()
          if (cookieToken && !state.token) {
            state.token = cookieToken
            state.isAuthenticated = true
          }
        }
      },
      // Sadece token ve isAuthenticated değerlerini persist et
      partialize: (state) => ({ 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
) 