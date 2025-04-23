"use client"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart"
import { toast } from "@/components/ui/use-toast"
import { Info, ShoppingCart, Package } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getImageUrl } from "@/lib/api-config"

// Basit bir gri placeholder resmi base64 formatında
const PLACEHOLDER_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

interface ProductItem {
  name: string
  quantity: string
  origin?: string
}

interface ProductCardProps {
  id: string
  name: string
  price: number
  image?: string
  type?: string
  quantity?: string
  origin?: string
  contents?: ProductItem[]
}

export default function ProductCard({
  id,
  name,
  price,
  image = "/placeholder.jpg", // Doğrudan public klasöründen al
  type = "",
  quantity = "",
  origin = "",
  contents = []
}: ProductCardProps) {
  const { addToCart } = useCart()
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const popoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Bileşik ürün kontrolü
  const isComposite = Array.isArray(contents) && contents.length > 0
  
  // Popover'ı açma fonksiyonu
  const handlePopoverOpen = () => {
    if (popoverTimeoutRef.current) {
      clearTimeout(popoverTimeoutRef.current)
      popoverTimeoutRef.current = null
    }
    setIsPopoverOpen(true)
  }
  
  // Popover'ı kapatma fonksiyonu
  const handlePopoverClose = () => {
    popoverTimeoutRef.current = setTimeout(() => {
      setIsPopoverOpen(false)
    }, 300) // Küçük bir gecikme ekleyerek kullanıcının içeriğe geçişini kolaylaştırıyoruz
  }

  const formatQuantity = (quantity: string) => {
    // Bileşik ürünler için içerik sayısını göster
    if (isComposite) {
      return `${contents.length} article${contents.length > 1 ? 's' : ''}`
    }
    
    const match = quantity.match(/(\d+)\s*([a-zA-Z]+)/)
    if (match) {
      const [_, amount, unit] = match
      if (unit.toLowerCase() === 'g') {
        return `${amount}g`
      }
      return `1 pièce`
    }
    return quantity
  }

  const handleAddToCart = () => {
    // Bileşik ürün ise içerikleriyle birlikte ekle
    if (isComposite && contents && contents.length > 0) {
      const cartItem = {
        id,
        name,
        price: Number(price),
        image,
        unit: 'pc',
        isComposite: true,
        contents: contents,
        origin: origin || undefined
      }
      
      addToCart(cartItem)
    } else {
      // Normal ürün ise ağırlık bilgisiyle ekle
      const match = quantity.match(/(\d+)\s*([a-zA-Z]+)/)
      if (match) {
        const weight = parseInt(match[1])
        const unit = match[2].toLowerCase() === 'g' ? 'g' : 'pc'

        const cartItem = {
          id,
          name,
          price: Number(price),
          image,
          unit,
          weight: unit === 'g' ? weight : undefined,
          origin: origin || undefined
        }
        
        addToCart(cartItem)
      } else {
        const cartItem = {
          id,
          name,
          price: Number(price),
          image,
          unit: 'pc',
          weight: undefined,
          origin: origin || undefined
        }
        
        addToCart(cartItem)
      }
    }

    toast({
      title: "Ajouté au panier",
      description: name,
      duration: 2000,
      variant: "success",
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <div className="relative aspect-square bg-slate-200">
        {/* Görüntü sorunu çözmek için doğrudan img etiketini kullanıyoruz */}
        <img 
          src={getImageUrl(image) || "/placeholder.jpg"}
          alt={name}
          className="w-full h-full object-cover absolute"
          onError={(e) => {
            console.error(`Resim yüklenemedi: ${e.currentTarget.src}, ÜRÜN: ${name}, ID: ${id}`);
            
            // Önce placeholder.jpg'yi deneyelim
            if (!e.currentTarget.src.includes('placeholder.jpg') && !e.currentTarget.src.startsWith('data:')) {
              console.log(`Alternatif resme yönlendiriliyor: /placeholder.jpg`);
              e.currentTarget.src = "/placeholder.jpg";
            } 
            // Eğer placeholder.jpg de yüklenmezse base64 kullan
            else if (!e.currentTarget.src.startsWith('data:')) {
              console.log(`Base64 placeholder resmine yönlendiriliyor`);
              e.currentTarget.src = PLACEHOLDER_IMAGE_BASE64;
            }
          }}
        />
        {type && (
          <Badge className="absolute top-2 left-2 bg-primary/90 z-10">
            {type}
          </Badge>
        )}
        {isComposite && (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-2 right-2 bg-white hover:bg-white/90 rounded-full shadow-md z-10"
                onClick={() => setIsPopoverOpen(true)}
                onMouseEnter={handlePopoverOpen}
                onMouseLeave={handlePopoverClose}
              >
                <Info className="h-5 w-5 text-primary" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-72 p-3"
              onMouseEnter={handlePopoverOpen}
              onMouseLeave={handlePopoverClose}
            >
              <div className="space-y-2">
                <h4 className="font-medium">Contenu du produit</h4>
                <ul className="text-sm space-y-1">
                  {contents.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary mr-1">•</span>
                      <span>
                        {item.name} - {item.quantity}
                        {item.origin && ` (${item.origin})`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-2">
          <h3 className="text-lg font-semibold">{name}</h3>
          {(quantity || isComposite) && (
            <p className="text-sm text-gray-600">
              {isComposite ? `${contents.length} article${contents.length > 1 ? 's' : ''}` : formatQuantity(quantity)}
            </p>
          )}
          {origin && !isComposite && (
            <p className="text-sm text-gray-600">
              Origine: {origin}
            </p>
          )}
        </div>
        <div className="flex justify-between items-center mt-auto">
          <span className="text-xl font-bold text-secondary">
            {typeof price === 'number' ? price.toFixed(2) : Number(price || 0).toFixed(2)} €
          </span>
          <Button
            onClick={handleAddToCart}
            className="bg-primary hover:bg-primary/90"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  )
}

