"use client"

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { X, Minus, Plus, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { getImageUrl } from "@/lib/api-config";
import { useCart, useCartItems, useCartTotals, type CartItem } from "@/lib/cart"
import { formatSingleQuantity } from "@/lib/cart"

// Mini sepeti kontrol etmek için Zustand store'a yeni bir action
import { create } from "zustand"

interface MiniCartState {
  isVisible: boolean
  setVisible: (visible: boolean) => void
  isProcessing: boolean
  setProcessing: (processing: boolean) => void
}

// Mini sepet için tamamen bağımsız bir global state
const useMiniCartStore = create<MiniCartState>((set) => ({
  isVisible: false,
  setVisible: (visible) => set({ isVisible: visible }),
  isProcessing: false,
  setProcessing: (processing) => set({ isProcessing: processing })
}))

// Sepet içindeki öğeyi render eden ayrı bir bileşen
const CartItemComponent = memo(({ 
  item, 
  onRemove, 
  onUpdateQuantity
}: { 
  item: CartItem, 
  onRemove: (name: string) => void,
  onUpdateQuantity: (name: string, quantity: number) => void
}) => {
  const { setProcessing } = useMiniCartStore()
  
  const handleDecrease = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // İşlem esnasında mini sepetin kapanmasını engellemek için
    setProcessing(true)
    
    // Miktar azaltma işlemi
    onUpdateQuantity(item.name, (item.quantity || 1) - 1)
    
    // İşlem tamamlandığında processingi kapat (timing sorunlarını önlemek için timeout kullanıyoruz)
    setTimeout(() => {
      setProcessing(false)
    }, 100)
  }, [item.name, item.quantity, onUpdateQuantity, setProcessing])

  const handleIncrease = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // İşlem esnasında mini sepetin kapanmasını engellemek için
    setProcessing(true)
    
    // Miktar artırma işlemi
    onUpdateQuantity(item.name, (item.quantity || 1) + 1)
    
    // İşlem tamamlandığında processingi kapat
    setTimeout(() => {
      setProcessing(false)
    }, 100)
  }, [item.name, item.quantity, onUpdateQuantity, setProcessing])

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // İşlem esnasında mini sepetin kapanmasını engellemek için
    setProcessing(true)
    
    // Ürünü sepetten kaldırma işlemi
    onRemove(item.name)
    
    // İşlem tamamlandığında processingi kapat
    setTimeout(() => {
      setProcessing(false)
    }, 100)
  }, [item.name, onRemove, setProcessing])

  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3 flex-grow">
        <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-gray-50">
          <img
            src={getImageUrl(item.image) || "/placeholder.svg"}
            alt={item.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              console.error("Resim yüklenemedi:", item.image);
              e.currentTarget.src = "/placeholder.svg";
              // Resim yolu hatalıysa, alternatif yolu deneyin
              if (item.image && !item.image.startsWith('/products/') && !item.image.startsWith('/')) {
                e.currentTarget.src = `/products/${item.image}`;
              }
            }}
          />
        </div>
        <div className="flex-grow min-w-0">
          <p className="text-sm font-medium truncate">{item.name}</p>
          <div className="flex items-center gap-1 mt-1">
            <p className="text-xs text-gray-500">
              {formatSingleQuantity(item.unit, item.weight)}
            </p>
            <span className="text-xs text-gray-400">×</span>
            <p className="text-xs font-medium">
              {item.price.toFixed(2)} €
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center border rounded">
          <button
            type="button"
            onClick={handleDecrease}
            className="px-1 py-0.5 text-gray-500 hover:bg-gray-100"
          >
            <Minus size={12} />
          </button>
          <span className="px-2 text-xs font-medium">{item.quantity}</span>
          <button
            type="button"
            onClick={handleIncrease}
            className="px-1 py-0.5 text-gray-500 hover:bg-gray-100"
          >
            <Plus size={12} />
          </button>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="text-gray-400 hover:text-red-500"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
});

CartItemComponent.displayName = 'CartItemComponent'

// Mini sepet açma/kapama butonu bileşeni
function CartToggleButton({ itemCount }: { itemCount: number }) {
  const { isVisible, setVisible } = useMiniCartStore()
  
  const toggleCart = useCallback(() => {
    setVisible(!isVisible)
  }, [isVisible, setVisible])
  
  return (
    <button
      type="button"
      className="flex items-center focus:outline-none"
      onClick={toggleCart}
      aria-label="Panier"
    >
      <div className="relative p-2">
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
            {itemCount}
          </span>
        )}
      </div>
    </button>
  )
}

// Mini sepet içerik bileşeni
function CartContent() {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const { isVisible, setVisible, isProcessing } = useMiniCartStore()
  
  const items = useCartItems() as CartItem[];
  const { clearCart, removeFromCart, updateQuantity } = useCart();
  const { estimatedTotal } = useCartTotals();
  
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Client-side rendering için
  useEffect(() => {
    setIsMounted(true);
    
    // Global buton referansını bul
    const button = document.querySelector('[aria-label="Panier"]') as HTMLButtonElement;
    if (button) {
      buttonRef.current = button;
    }
  }, []);
  
  // Sepet pozisyonunu hesapla
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      
      setPosition({
        top: rect.bottom,
        right: window.innerWidth - rect.right
      });
    }
  }, []);
  
  // Sepet açıldığında pozisyonu güncelle
  useEffect(() => {
    if (isVisible) {
      updatePosition();
      
      const handleScroll = () => {
        requestAnimationFrame(updatePosition);
      };
      
      const handleResize = () => {
        requestAnimationFrame(updatePosition);
      };
      
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleResize, { passive: true });

      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible, updatePosition]);
  
  // Dışarıda herhangi bir yere tıklandığında sepeti kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !isProcessing && // İşlem sırasında kapatmayı engelle
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible, isProcessing, setVisible]);
  
  function handleRemoveFromCart(name: string) {
    removeFromCart(name);
    toast.success("Retiré du panier");
  }

  function handleClearCart() {
    clearCart();
    toast.success("Panier vidé");
    setVisible(false);
  }

  function handleQuantityUpdate(name: string, quantity: number) {
    if (quantity <= 0) {
      handleRemoveFromCart(name);
    } else {
      updateQuantity(name, quantity);
    }
  }
  
  function handleClose(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    setVisible(false);
  }
  
  if (!isMounted) return null;
  
  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={dropdownRef}
          className="fixed w-[320px] bg-white rounded-lg shadow-lg p-3 border border-gray-200 max-h-[80vh] overflow-auto z-[9999]"
          style={{
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            position: 'fixed',
            top: `${position.top}px`,
            right: `${position.right}px`,
            transform: 'translateY(5px)',
            maxHeight: 'calc(100vh - 150px)'
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-base font-semibold">Votre Panier</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleClearCart();
                }}
                className="text-xs text-red-600 hover:text-red-700 px-2 py-1"
              >
                Vider
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Fermer le panier"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div 
            className="max-h-[40vh] overflow-y-auto pr-1 mb-2 border-t border-b py-1"
          >
            {items.length > 0 ? (
              items.map((item) => (
                <CartItemComponent
                  key={item.id}
                  item={item}
                  onRemove={handleRemoveFromCart}
                  onUpdateQuantity={handleQuantityUpdate}
                />
              ))
            ) : (
              <div className="py-8 text-center text-gray-500">
                Votre panier est vide
              </div>
            )}
          </div>

          <div className="pt-2">
            <div className="flex justify-between font-medium text-base">
              <span>Total estimé:</span>
              <span>{estimatedTotal.toFixed(2)} €</span>
            </div>
            <Link 
              href="/cart" 
              className="mt-3 block w-full py-2 px-4 bg-primary text-white text-center rounded-md hover:bg-primary/90 transition-colors text-sm"
              onClick={() => {
                // URL değiştiği zaman sepeti kapat
                setTimeout(() => {
                  setVisible(false);
                }, 100); // Yönlendirme gerçekleştikten sonra kapanmasını sağlamak için küçük bir gecikme
              }}
              prefetch={true}
              shallow={true}
            >
              Voir le panier
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// Ana MiniCart bileşeni - basitleştirilmiş
export default function MiniCart() {
  const items = useCartItems() as CartItem[];
  const itemCount = items.reduce((sum: number, item: CartItem) => sum + (item.quantity || 1), 0);
  
  return (
    <div className="relative">
      <CartToggleButton itemCount={itemCount} />
      <CartContent />
    </div>
  );
}

