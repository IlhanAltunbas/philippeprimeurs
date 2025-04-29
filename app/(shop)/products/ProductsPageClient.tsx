"use client"

// Cache'leme işlemlerini client side handle ediyoruz
// export const dynamic = 'force-dynamic' // Server Component tarafında kalabilir

import { Suspense, useState, useEffect, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ProductList } from "@/components/product-list"
import { ProductListSkeleton } from "@/components/product-list-skeleton"
import { CategoryFilter } from "@/components/category-filter"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

// useSearchParams için bir sarmalayıcı bileşen oluştur
function ProductPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams() // Bu artık Suspense içinde

  const currentCategory = searchParams.get('category') || undefined
  const currentSearch = searchParams.get('search') || undefined
  
  const [searchTerm, setSearchTerm] = useState(currentSearch ?? "")
  const [isFocused, setIsFocused] = useState(false)
  const limit = 1000

  // URL'den searchTerm'i güncelle (searchParams değiştiğinde)
  useEffect(() => {
    setSearchTerm(currentSearch ?? "")
  }, [currentSearch])

  // URL'yi güncelleme fonksiyonu
  const updateUrl = useCallback((params: { [key: string]: string | undefined }) => {
    const urlParams = new URLSearchParams(searchParams.toString())
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        urlParams.set(key, value)
      } else {
        urlParams.delete(key)
      }
    })
    
    const query = urlParams.toString()
    const url = query ? `${pathname}?${query}` : pathname || '/' 
    
    router.push(url, { scroll: false })

  }, [pathname, router, searchParams])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const trimmedSearch = searchTerm.trim()
    
    if (trimmedSearch === (currentSearch ?? "")) return

    if (!trimmedSearch) {
      if (currentSearch) {
        updateUrl({ search: undefined })
      }
      return
    }
    
    updateUrl({ search: trimmedSearch })
  }, [searchTerm, currentSearch, updateUrl])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchTerm("")
    if (currentSearch) {
      updateUrl({ search: undefined })
    }
  }, [currentSearch, updateUrl])

  return (
    <div className="container mx-auto px-4 py-8 pb-8 mt-10">
      <h1 className="text-3xl font-bold mb-6 mt-[10px]">Nos Produits</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-[1fr,280px] lg:grid-cols-[1fr,350px] gap-4 mb-8">
        <div className="overflow-hidden">
          <CategoryFilter selectedCategory={currentCategory} />
        </div>

        <div className="mb-2">
          <form onSubmit={handleSearch} className="relative">
            <Input
              id="searchInput"
              type="text"
              placeholder="Rechercher un produit..."
              className="w-full pr-16 border-gray-200 focus:border-primary h-10"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searchTerm && (
                <button 
                  type="button"
                  aria-label="Effacer la recherche"
                  className="text-gray-400 hover:text-primary transition-colors" 
                  onClick={handleClearSearch}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button 
                type="submit"
                aria-label="Rechercher"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form> 
        </div>
      </div>

      <Suspense fallback={<ProductListSkeleton />}>
        <ProductList 
          page={1} 
          limit={limit} 
          category={currentCategory}
          search={currentSearch}
        />
      </Suspense>
    </div>
  )
}

// Ana bileşen, artık Suspense ile sarmalanmış
export default function ProductsPageClient() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 pb-8 mt-10">
      <h1 className="text-3xl font-bold mb-6 mt-[10px]">Nos Produits</h1>
      <p>Chargement en cours...</p>
    </div>}>
      <ProductPageContent />
    </Suspense>
  )
} 