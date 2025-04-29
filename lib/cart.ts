import { create } from 'zustand'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { getImageUrl } from "@/lib/api-config";
import Cookies from 'js-cookie';

export const formatSingleQuantity = (unit: string, weight?: number) => {
  if (!unit || weight === undefined || weight === null) return '1 pièce';
  
  switch(unit) {
    case 'kg':
      return `${weight} kg`;
    case 'g':
      return `${weight}g`;
    case 'bouquet':
      return `${weight} bouquet`;
    case 'barquette':
      return `${weight} barquette`;
    case 'piece':
      return `${weight} pièce`;
    case 'pc':
      return `${weight} pièce`;
    default:
      return `${weight} ${unit}`;
  }
}

export interface CartItem {
  id: string
  name: string
  price: number // Birim fiyat
  quantity?: number
  unit: string
  weight?: number
  image?: string
  isComposite?: boolean
  contents?: Array<{
    name: string
    quantity: string
    origin?: string
  }>
}

interface CartState {
  isOpen: boolean
  items: CartItem[]
  total: number
  estimatedTotal: number
}

interface CartActions {
  setIsOpen: (isOpen: boolean) => void
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
  updateQuantity: (name: string, quantity: number) => void
  removeFromCart: (name: string) => void
  getTotal: () => number
  getEstimatedTotal: () => number
  clearCart: () => void
  recalculateTotals: () => void
  persistCart: () => void
}

type CartStore = CartState & CartActions

// Toplam hesaplama fonksiyonu
const calculateTotal = (items: CartItem[]): number => {
  return Number(items.reduce((total, item) => total + item.price * (item.quantity || 0), 0).toFixed(2))
}

// Tahmini toplam hesaplama fonksiyonu
const calculateEstimatedTotal = (total: number): number => {
  return Number(total.toFixed(2))
}

// Koşullu depolama: Sadece çerez onayı varsa localStorage kullan
const conditionalLocalStorage: StateStorage = {
  getItem: (name) => {
    const consentGiven = Cookies.get('philippePrimeursCookieConsent'); 
    // CookieConsent'in varsayılan değeri "true" string'idir.
    if (consentGiven === 'true') { 
      return localStorage.getItem(name);
    }
    console.log('Cookie consent not given, skipping localStorage getItem.');
    return null; 
  },
  setItem: (name, value) => {
    const consentGiven = Cookies.get('philippePrimeursCookieConsent');
    if (consentGiven === 'true') {
      localStorage.setItem(name, value);
    } else {
      console.log('Cookie consent not given, skipping localStorage setItem.');
    }
  },
  removeItem: (name) => {
    const consentGiven = Cookies.get('philippePrimeursCookieConsent');
    if (consentGiven === 'true') {
      localStorage.removeItem(name);
    } else {
      console.log('Cookie consent not given, skipping localStorage removeItem.');
    }
  },
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      total: 0,
      estimatedTotal: 0,

      setIsOpen: (open) => set({ isOpen: open }),
      
      addToCart: (newItem) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.name === newItem.name)
          let updatedItems
          
          if (existingItem) {
            updatedItems = state.items.map((item) =>
              item.name === newItem.name
                ? { ...item, quantity: (item.quantity || 0) + 1 }
                : item
            )
          } else {
            const fixedImage = newItem.image || '/placeholder.svg'
            const imageUrl = fixedImage.startsWith('/') 
              ? fixedImage 
              : `/products/${fixedImage}`
            
            updatedItems = [...state.items, { 
              ...newItem, 
              image: getImageUrl(newItem.image),
              quantity: 1 
            }]
          }
          
          const newTotal = calculateTotal(updatedItems)
          
          return {
            items: updatedItems,
            total: newTotal,
            estimatedTotal: calculateEstimatedTotal(newTotal)
          }
        })
      },
      
      updateQuantity: (name, quantity) => {
        set((state) => {
          const updatedItems = state.items.map((item) => 
            item.name === name ? { ...item, quantity: Math.max(0, quantity) } : item
          ).filter(item => (item.quantity || 0) > 0)
          
          const newTotal = calculateTotal(updatedItems)
          
          return { 
            items: updatedItems,
            total: newTotal,
            estimatedTotal: calculateEstimatedTotal(newTotal)
          }
        })
      },
      
      removeFromCart: (name) => {
        set((state) => {
          const updatedItems = state.items.filter((item) => item.name !== name)
          const newTotal = calculateTotal(updatedItems)
          
          return {
            items: updatedItems,
            total: newTotal,
            estimatedTotal: calculateEstimatedTotal(newTotal)
          }
        })
      },
      
      clearCart: () => {
        set({ 
          items: [],
          total: 0,
          estimatedTotal: 0
        })
      },
      
      getTotal: () => {
        return get().total
      },
      
      getEstimatedTotal: () => {
        return get().estimatedTotal
      },
      
      recalculateTotals: () => {
        set((state) => {
          const newTotal = calculateTotal(state.items)
          return {
            total: newTotal,
            estimatedTotal: calculateEstimatedTotal(newTotal)
          }
        })
      },

      // Kullanıcı onay verdiğinde çağrılacak fonksiyon
      persistCart: () => {
        console.log("Cookie consent given. Triggering cart persistence (reload).");
        // En basit yöntem: Sayfayı yeniden yükle
        // Bu, persist middleware'inin localStorage'ı okumasını sağlar.
        // Not: Bu, kullanıcı deneyimini biraz kesintiye uğratabilir.
        window.location.reload(); 
      }
    }),
    {
      name: 'cart-storage',
      version: 7,
      storage: createJSONStorage(() => conditionalLocalStorage), // Koşullu depolamayı kullan
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) {
	  // Sepetteki ürünlerin resim URL'lerini düzelt
	    if (state.items && state.items.length > 0) {
	      state.items = state.items.map(item => {
	        // Resim yolu kontrolü ve düzeltme
	        if (item.image) {
	          // Resim yolunu düzelt (eğer gerekiyorsa)
	          if (!item.image.startsWith('/') && !item.image.startsWith('http')) {
	            item.image = getImageUrl(item.image);
	          }
	        } else {
	          item.image = '/placeholder.svg';
	        }
	        return item;
	      });
	    }
          // Sepet yüklendiğinde toplamları yeniden hesapla
          const total = calculateTotal(state.items)
          state.total = total
          state.estimatedTotal = calculateEstimatedTotal(total)
        }
      },
      // skipHydration: Cookies.get('philippePrimeursCookieConsent') !== 'true' // Hydration'ı sadece onay yoksa atla?
    }
  )
)

// Performans için seçici fonksiyonlar - useMemo ile değerleri memoize ediyoruz
export const useCartItems = () => useCart((state) => state.items)

export const useCartTotals = () => {
  const store = useCart()
  const total = store.total
  const estimatedTotal = store.estimatedTotal
  
  return {
    total,
    estimatedTotal
  }
}

export const useCartOpen = () => useCart((state) => state.isOpen) 
