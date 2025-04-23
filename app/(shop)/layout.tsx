"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import ScrollToTopButton from "@/components/scroll-to-top-button"

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith("/admin")
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAdminRoute) {
      // Önce scroll'u en üste al ve header'ın tam boyutunu göster
      window.scrollTo({
        top: 0,
        behavior: "instant"
      })

      // Header'ın tam yüksekliğinin hesaplanması için biraz bekle
      const timer = setTimeout(() => {
        const headerElement = headerRef.current
        if (headerElement) {
          // Header'ın tam yüksekliğini al (scroll edilmemiş hali)
          const headerHeight = headerElement.getBoundingClientRect().height
          
          // Sayfayı header'ın altından başlat
          window.scrollTo({
            top: 0,
            behavior: "instant"
          })
        }
      }, 50) // 50ms yeterli olmalı

      return () => clearTimeout(timer)
    }
  }, [pathname, isAdminRoute])

  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="mt-[180px] flex-grow pb-8">{children}</main>
      <Footer />
      <ScrollToTopButton />
    </div>
  )
} 