"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Tag } from "lucide-react"

interface Category {
  id: number
  name: string
  isDefault?: boolean
  isActive?: boolean
}

export function CategoryFilter({ selectedCategory }: { selectedCategory?: string }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/api/public/categories`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Timestamp': Date.now().toString()
          }
        });

        if (response.ok) {
          const data = await response.json()
          // Sadece aktif kategorileri filtrele
          const activeCategories = data.filter((cat: Category) => cat.isActive !== false);
          // Tri des catégories par ID
          activeCategories.sort((a: Category, b: Category) => a.id - b.id)
          setCategories(activeCategories)
        } else {
          console.error("Kategori yükleme API hatası:", response.statusText)
          throw new Error("Kategoriler yüklenemedi")
        }
      } catch (error) {
        console.error("Kategori yükleme hatası:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(name, value)
    return params.toString()
  }

  const handleCategoryChange = (category: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Sayfa numarasını resetle
    params.set("page", "1")
    
    if (category) {
      params.set("category", category)
    } else {
      params.delete("category")
    }
    
    router.push(`${pathname}?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="scrollbar-hide -mx-4 px-4 overflow-x-auto py-2 mb-6">
        <div className="flex space-x-2 pb-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="category-filter-container relative -mx-4 px-4 sm:mx-0 sm:px-0 w-full">
      <div className="scrollbar-hide overflow-x-auto py-2 mb-4">
        <div className="flex flex-nowrap gap-2 pb-0.5 pr-6 sm:pr-0">
          <Button
            variant={!selectedCategory ? "default" : "outline"}
            className="rounded-full whitespace-nowrap flex-shrink-0 text-xs sm:text-sm h-auto py-1.5 sm:py-2"
            onClick={() => handleCategoryChange(null)}
          >
            <Tag className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Tous les produits
          </Button>
          
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.name ? "default" : "outline"}
              className="rounded-full whitespace-nowrap flex-shrink-0 text-xs sm:text-sm h-auto py-1.5 sm:py-2"
              onClick={() => handleCategoryChange(category.name)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none sm:hidden"></div>
    </div>
  )
} 