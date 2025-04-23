"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import ProductCard from "@/components/product-card"

export function ProductList({
  page = 1,
  limit = 1000, // Yüksek limit ile pratik olarak tüm ürünleri getir
  category,
  search,
}: {
  page?: number
  limit?: number
  category?: string
  search?: string
}) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  
  const fetchProducts = async () => {
    try {
      // Önbelleği tamamen devre dışı bırakan headers oluştur
      const cacheControlHeaders = {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Timestamp': Date.now().toString()
      }
      
      // Her zaman taze veriler almak için zaman damgası ekleyerek ve önbelleği devre dışı bırakarak ürünleri getir
      const response = await fetch(getApiUrl(), {
        headers: cacheControlHeaders,
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error(`Ürünler yüklenirken bir hata oluştu: ${response.status}`)
      }
      
      const data = await response.json()
      
      setProducts(data.products || [])
      setError(null)
      setLoading(false)
    } catch (err) {
      console.error("Ürünler yüklenirken hata oluştu:", err)
      setError("Ürünler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
      setLoading(false)
    }
  }

  useEffect(() => {
    // Sayfa, kategori veya arama değiştiğinde tek seferlik veri çekme işlemi yap
    setLoading(true)
    fetchProducts()
    
    // Otomatik yenileme için interval ayarla (her 15 saniyede bir)
    // Bu, admin panelindeki değişikliklerin kullanıcı sayfasına yansıması için önemli
    const refreshInterval = setInterval(() => {
      console.log("Ürünler periyodik olarak tekrar yükleniyor...")
      fetchProducts()
    }, 15000) // 15 saniyede bir
    
    // Component unmount olduğunda interval'i temizle
    return () => clearInterval(refreshInterval)
    
  }, [page, limit, category, search])

  // API URL'sini oluştur ve her seferinde benzersiz bir parametre ekle (cache kontrolü için)
  const getApiUrl = () => {
    const url = new URL('/api/products', window.location.origin)
    url.searchParams.append('page', page.toString())
    url.searchParams.append('limit', limit.toString())
    
    if (category) {
      url.searchParams.append('category', category)
    }
    
    if (search) {
      url.searchParams.append('search', search)
    }
    
    // Önbelleği kırmak için her istekte benzersiz bir timestamp ekle
    url.searchParams.append('_', Date.now().toString())
    
    return url.toString()
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-100 h-80 rounded-md animate-pulse"></div>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium">Produit non trouvé</h3>
        <p className="text-gray-500 mt-2">Veuillez sélectionner un autre terme de recherche ou une autre catégorie.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            price={product.price}
            image={product.image}
            type={product.type}
            quantity={product.quantity}
            origin={product.origin}
            contents={product.contents}
          />
        ))}
      </div>
      
      {/* Sayfalama kontrolü kaldırıldı */}
    </div>
  )
}