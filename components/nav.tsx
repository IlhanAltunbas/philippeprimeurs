"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ShoppingCart, Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"

export default function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            Fresh Greens Market
          </Link>
          <div className="hidden md:flex space-x-8">
            <NavLink href="/">Accueil</NavLink>
            <NavLink href="/products">Produits</NavLink>
            <NavLink href="/about">À Propos</NavLink>
            <NavLink href="/contact">Contact</NavLink>
            <NavLink href="/cart">
              <ShoppingCart className="inline-block mr-2" />
              Panier
            </NavLink>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <MobileNavLink href="/">Accueil</MobileNavLink>
            <MobileNavLink href="/products">Produits</MobileNavLink>
            <MobileNavLink href="/about">À Propos</MobileNavLink>
            <MobileNavLink href="/contact">Contact</MobileNavLink>
            <MobileNavLink href="/cart">
              <ShoppingCart className="inline-block mr-2" />
              Panier
            </MobileNavLink>
          </div>
        </div>
      )}
    </nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`text-gray-600 hover:text-primary transition-smooth ${
        isActive ? "text-primary border-b-2 border-primary" : ""
      }`}
      scroll={true}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`block py-3 px-4 text-base font-medium rounded-md ${
        isActive ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
      }`}
      scroll={true}
    >
      {children}
    </Link>
  )
}

