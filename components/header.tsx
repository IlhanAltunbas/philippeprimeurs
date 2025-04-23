"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, memo } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Search, MapPin, Clock, Facebook, Instagram, Menu, X, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { DeliveryInfoModal } from "@/components/delivery-info-modal"
import MiniCart from "./mini-cart"
import { useCart, type CartItem } from "@/lib/cart"
import { Toaster } from "@/components/ui/toaster"
import { useDeliveryHours, formatDeliveryHours } from '@/lib/delivery-hours'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { items } = useCart()
  const headerRef = useRef<HTMLElement>(null)
  const lastScrollY = useRef(0)
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)
  const SHOW_THRESHOLD = 100 // Header'ın görünür olacağı eşik
  const HIDE_THRESHOLD = 150 // Header'ın gizleneceği eşik
  const isTransitioning = useRef(false)
  const cartRef = useRef<HTMLDivElement>(null)
  const { hours, fetchHours } = useDeliveryHours()

  const totalItems = items.length > 0
    ? items.reduce((sum: number, item: CartItem) => sum + (item.quantity ?? 1), 0)
    : 0

  useEffect(() => {
    let prevScrollY = window.scrollY
    let ticking = false

    const updateHeader = () => {
      const currentScrollY = window.scrollY
      
      // Header durumunu güncelle
      if (currentScrollY > 80) {
        if (!isScrolled) {
          setIsScrolled(true)
          document.body.classList.add('header-compact')
          // Özel bir olay gönder, böylece hero section bu durumu yakalayabilir
          window.dispatchEvent(new CustomEvent('headerSizeChange', { detail: { isCompact: true } }))
        }
      } else {
        if (isScrolled) {
          setIsScrolled(false)
          document.body.classList.remove('header-compact')
          // Özel bir olay gönder, böylece hero section bu durumu yakalayabilir
          window.dispatchEvent(new CustomEvent('headerSizeChange', { detail: { isCompact: false } }))
        }
      }

      prevScrollY = currentScrollY
      ticking = false
    }

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateHeader()
        })
        ticking = true
      }
    }

    // Sadece class değişimi yapılıyor, CSS değişkeni güncellenmeden
    if (window.scrollY > 80) {
      setIsScrolled(true)
      document.body.classList.add('header-compact')
    }
    
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isScrolled])

  useEffect(() => {
    fetchHours()
  }, [fetchHours])

  const today = new Date()
  const dayOfWeek = today.getDay() || 7 // 0 = Pazar = 7
  const todayHours = hours.find(h => h.day_of_week === dayOfWeek)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`)
      setIsSearchFocused(false)
      setSearchTerm("")
    }
  }

  const CartIcon = memo(() => (
    <div 
      className="mini-cart-wrapper"
      style={{ 
        position: 'relative',
        zIndex: 99999,
        isolation: 'isolate',
        transform: 'translateZ(0)'
      }}
    >
      <MiniCart />
    </div>
  ))

  CartIcon.displayName = 'CartIcon'

  return (
    <>
      <header 
        ref={headerRef}
        className={`header sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-visible click-shield ${isScrolled ? 'header-scrolled' : ''}`}
        style={{ transform: 'translateZ(0)', pointerEvents: 'none' }}
      >
        {/* Top Bar */}
        <div className="bg-secondary overflow-hidden transition-all duration-500 ease-in-out"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-10 text-sm text-white">
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span className="hidden md:inline">Rue de la Broche de Fer 263, 7712 Mouscron</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden md:inline">Suivez-nous</span>
                <div className="flex items-center gap-3">
                  <Link href="https://www.facebook.com/share/1ARVsrKJhZ/?mibextid=wwXIfr" target="_blank" className="hover:text-white/80 transition-colors">
                    <Facebook size={16} />
                  </Link>
                  <Link href="https://www.instagram.com/philippeprimeursbyfauve?igsh=bXR5dnF0cDdxYm83" target="_blank" className="hover:text-white/80 transition-colors">
                    <Instagram size={16} />
                  </Link>
                  <Link href="https://www.tiktok.com/@philippeprimeursbyfauve?_t=ZN-8uK8hfrKY58&_r=1" target="_blank" className="hover:text-white/80 transition-colors">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                    >
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section */}
        <div className="header-middle border-b border-gray-200 overflow-visible"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-[110px]">
              <Link
                href="/"
                className="inline-flex items-center gap-4"
                onClick={(e) => {
                  if (pathname === "/") {
                    e.preventDefault()
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                }}
              >
                <div className="w-[100px] h-[100px] relative overflow-hidden">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-PqQjfEwmE03vBUap7SvsrQ0Yh2BoQY.png"
                    alt="Philippe Primeurs Logo"
                    width={100}
                    height={100}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl md:text-3xl font-playfair font-bold text-secondary">Philippe Primeurs</span>
                  <span className="text-sm text-secondary/80 font-medium -mt-1">by Fauve</span>
                </div>
              </Link>
              <div className="flex items-center gap-8">
                <div className="hidden md:flex items-center gap-3 bg-primary/10 rounded-full px-4 py-2">
                  <div className="bg-primary rounded-full p-2">
                    <Phone size={20} className="text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-primary text-xs font-medium">Appelez-nous</span>
                    <span className="text-secondary font-bold">056 55 66 15</span>
                  </div>
                </div>
                {!isScrolled && (
                  <div className="relative" style={{ isolation: 'isolate', zIndex: 99999 }}>
                    <CartIcon />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className={`header-nav relative ${isScrolled ? 'h-[60px]' : ''}`} style={{ isolation: 'isolate', zIndex: 99999, position: 'relative', pointerEvents: 'auto' }}>
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-[60px]">
              {/* Show logo in nav bar when scrolled */}
              {isScrolled && (
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 clickable"
                  onClick={(e) => {
                    if (pathname === "/") {
                      e.preventDefault()
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                  }}
                >
                  <div className="w-[40px] h-[40px] relative overflow-hidden">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-PqQjfEwmE03vBUap7SvsrQ0Yh2BoQY.png"
                      alt="Philippe Primeurs Logo"
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <span className="font-playfair font-bold text-secondary">Philippe Primeurs</span>
                </Link>
              )}
              <nav className="hidden md:block">
                <ul className="flex gap-8">
                  <NavLink href="/">Accueil</NavLink>
                  <NavLink href="/products">Produits</NavLink>
                  <NavLink href="/about">À Propos</NavLink>
                  <NavLink href="/contact">Contact</NavLink>
                </ul>
              </nav>
              <div className="flex items-center gap-4">
                <Button
                  className="hidden md:flex bg-secondary hover:bg-secondary/90 text-white"
                  onClick={() => setIsDeliveryModalOpen(true)}
                >
                  <Clock className="mr-2" size={20} />
                  HEURES D'OUVERTURE
                </Button>
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      {isMobileMenuOpen ? <X /> : <Menu />}
                    </Button>
                  </SheetTrigger>
                  <SheetContent 
                    side="left" 
                    className="w-[300px] sm:w-[400px]"
                  >
                    <div className="flex items-center">
                      <Image
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-PqQjfEwmE03vBUap7SvsrQ0Yh2BoQY.png"
                        alt="Philippe Primeurs Logo"
                        width={40}
                        height={40}
                        className="object-contain mr-2"
                      />
                      <SheetTitle>Menu</SheetTitle>
                    </div>
                    <nav className="mt-8">
                      <ul className="space-y-4">
                        <MobileNavLink href="/" setIsMobileMenuOpen={setIsMobileMenuOpen}>Accueil</MobileNavLink>
                        <MobileNavLink href="/products" setIsMobileMenuOpen={setIsMobileMenuOpen}>Produits</MobileNavLink>
                        <MobileNavLink href="/about" setIsMobileMenuOpen={setIsMobileMenuOpen}>À Propos</MobileNavLink>
                        <MobileNavLink href="/contact" setIsMobileMenuOpen={setIsMobileMenuOpen}>Contact</MobileNavLink>
                      </ul>
                    </nav>
                  </SheetContent>
                </Sheet>
                {isScrolled && (
                  <div className="relative" style={{ isolation: 'isolate', zIndex: 99999 }}>
                    <CartIcon />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <DeliveryInfoModal isOpen={isDeliveryModalOpen} onClose={() => setIsDeliveryModalOpen(false)} />
      </header>
      <Toaster />
    </>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isActive) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <li>
      <Link
        href={href}
        className={`hover:text-primary transition-smooth ${isActive ? "text-primary border-b-2 border-primary" : ""}`}
        onClick={handleClick}
      >
        {children}
      </Link>
    </li>
  )
}

function MobileNavLink({ href, children, setIsMobileMenuOpen }: { href: string; children: React.ReactNode; setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>> }) {
  const pathname = usePathname()
  const router = useRouter()
  const isActive = pathname === href

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Menüyü kapat
    setIsMobileMenuOpen(false)
    
    // Aynı sayfadaysa, sayfayı yeniden yüklemek yerine üste kaydır
    if (isActive) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <li>
      <Link
        href={href}
        className={`block py-2 text-lg hover:text-primary transition-smooth ${isActive ? "text-primary" : ""}`}
        onClick={handleClick}
      >
        {children}
      </Link>
    </li>
  )
}

