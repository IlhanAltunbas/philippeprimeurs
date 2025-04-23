"use client"

import "@/app/globals.css"
import "./styles.css"
import { useAuth } from '@/lib/auth'
import { useRouter, usePathname } from 'next/navigation'
import { memo, useEffect, useState, useCallback, useMemo, Suspense } from 'react'
import dynamic from 'next/dynamic'
import Link from "next/link"
import { Leaf, ShoppingBasket, Clock, Package, Tag, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { initApiCacheCleanup } from '@/lib/api'

// Derleme zamanında statik oluşturulacak, dynamic adını dynamicConfig değiştirdim
export const dynamicConfig = 'force-static'

// Admin sayfaları için özel stil tanımlamaları
const adminStyles = `
  * {
    transition: none !important;
    animation: none !important;
    scroll-behavior: auto !important;
  }
`

// Dynamically import heavy components
const Toaster = dynamic(() => import('@/components/ui/toaster').then(mod => mod.Toaster), { 
  ssr: false
})

// Loading component
const Loading = () => (
  <div className="min-h-screen flex flex-col items-center justify-center">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-secondary">Chargement...</p>
  </div>
)

// Memoized sidebar component
const AdminSidebar = memo(({ onLogout }: { onLogout: () => void }) => {
  return (
    <aside className="w-64 bg-secondary text-white flex flex-col">
      <div className="p-4">
        <Link href="/admin" className="flex items-center space-x-2">
          <Leaf className="h-8 w-8" />
          <span className="text-2xl font-bold">Philippe Primeurs</span>
        </Link>
      </div>
      <nav className="mt-8 flex-grow overflow-y-auto">
        <NavLink href="/admin" icon={<Package size={18} />}>
          Tableau de Bord
        </NavLink>
        <NavLink href="/admin/categories" icon={<Tag size={18} />}>
          Catégories
        </NavLink>
        <NavLink href="/admin/products" icon={<Package size={18} />}>
          Produits
        </NavLink>
        <NavLink href="/admin/orders" icon={<ShoppingBasket size={18} />}>
          Commandes
        </NavLink>
        <NavLink href="/admin/delivery-hours" icon={<Clock size={18} />}>
          Horaires de Livraison
        </NavLink>
      </nav>
      <div className="p-4 mt-auto">
        <Button 
          variant="ghost" 
          className="w-full flex items-center justify-start text-white hover:bg-secondary-foreground/10"
          onClick={onLogout}
        >
          <LogOut size={18} className="mr-2" />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
});

AdminSidebar.displayName = 'AdminSidebar';

// Memoized NavLink component
const NavLink = memo(({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) => {
  const pathname = usePathname()
  const isActive = pathname === href || (pathname?.startsWith(href) && href !== '/admin')

  return (
    <Link
      href={href}
      className={`flex items-center py-2 px-4 ${
        isActive ? "bg-secondary-foreground/10" : "hover:bg-secondary-foreground/5"
      }`}
      prefetch={true}
    >
      {icon}
      <span className="ml-2">{children}</span>
    </Link>
  )
})

NavLink.displayName = 'NavLink'

// Login sayfası component
const LoginPage = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, logout, checkAuth } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // Logout fonksiyonu - useCallback ile optimize edildi
  const handleLogout = useCallback(() => {
    logout();
    router.push('/admin/login');
  }, [logout, router]);

  // Sayfa yüklendiğinde api cache temizleme işlemi başlat
  useEffect(() => {
    setIsMounted(true)
    const cleanup = initApiCacheCleanup()
    return () => cleanup()
  }, [])

  // Prefetch common admin routes
  useEffect(() => {
    if (isAuthenticated) {
      // Asenkron olarak önemli sayfaları prefetch et
      const prefetchRoutes = async () => {
        const routes = [
          '/admin', 
          '/admin/categories', 
          '/admin/products', 
          '/admin/orders', 
          '/admin/delivery-hours'
        ]
        
        // Her rotayı ardışık olarak prefetch et
        for (const route of routes) {
          await router.prefetch(route)
        }
      }
      
      prefetchRoutes()
    }
  }, [isAuthenticated, router])

  // Authentication kontrolü
  useEffect(() => {
    const isAuth = checkAuth()
    if (!isAuth && pathname !== '/admin/login') {
      router.replace(`/admin/login?from=${encodeURIComponent(pathname || '/admin')}`)
    } else {
      setIsLoading(false)
    }
  }, [checkAuth, pathname, router])

  // Login sayfasında ise direkt render et
  if (pathname === '/admin/login') {
    return <LoginPage>{children}</LoginPage>
  }

  // Authenticated değilse veya sayfa henüz yüklenmediyse loading göster
  const isDefinitelyAuth = checkAuth()
  if (!isDefinitelyAuth || isLoading || !isMounted) {
    return <Loading />
  }

  // Render optimize edilmiş admin layout
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <style jsx global>{adminStyles}</style>
      <AdminSidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        <div className="p-8 min-h-full">
          {children}
        </div>
      </main>
      
      <Suspense fallback={null}>
        <Toaster />
      </Suspense>
    </div>
  )
} 