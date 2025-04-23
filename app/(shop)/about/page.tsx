"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

export default function AboutPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Sayfa yüklendikten sonra animasyonları etkinleştir
  useEffect(() => {
    setIsLoaded(true)
  }, [])
  
  return (
    <div className="container mx-auto px-4 py-16 space-y-32">
      <section className={`mb-16 opacity-0 translate-y-4 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : ''}`}>
        <h1 className="text-4xl font-bold mb-12 text-center text-secondary">À Propos de Philippe Primeurs</h1>
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="mb-8 text-lg">
              Philippe Primeurs a été fondé en 2010 avec une mission simple : apporter les produits les plus frais et locaux
              à notre communauté. Ce qui a commencé comme un petit stand de marché fermier est devenu une épicerie de
              quartier bien-aimée, mais notre engagement envers la qualité et la durabilité reste inchangé.
            </p>
            <p className="text-lg">
              Nous travaillons directement avec les agriculteurs et producteurs locaux pour garantir que chaque fruit,
              légume et produit sur nos étagères répond à nos normes élevées de fraîcheur et de saveur. Notre équipe est
              passionnée par la bonne nourriture et nous nous engageons à partager cette passion avec nos clients.
            </p>
          </div>
          <div className="transition-transform duration-300 hover:scale-105 will-change-transform">
            <Image
              src="/about/store-front.webp"
              alt="Philippe Primeurs storefront"
              width={500}
              height={300}
              className="rounded-lg shadow-md"
              loading="eager"
              priority
            />
          </div>
        </div>
      </section>

      <section className={`opacity-0 translate-y-4 transition-all duration-700 ease-out delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : ''}`}>
        <h2 className="text-3xl font-bold mb-12 text-center text-secondary">Nos Valeurs</h2>
        <div className="grid md:grid-cols-3 gap-16">
          <div className="bg-white p-8 rounded-lg shadow-md text-center transition-transform duration-300 hover:scale-105 will-change-transform">
            <h3 className="text-xl font-semibold mb-6 text-primary">Fraîcheur</h3>
            <p>
              Nous nous engageons à fournir les produits les plus frais possible, directement issus des fermes locales.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md text-center transition-transform duration-300 hover:scale-105 will-change-transform">
            <h3 className="text-xl font-semibold mb-6 text-primary">Durabilité</h3>
            <p>
              Nous privilégions les pratiques respectueuses de l'environnement dans tous les aspects de notre activité.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md text-center transition-transform duration-300 hover:scale-105 will-change-transform">
            <h3 className="text-xl font-semibold mb-6 text-primary">Communauté</h3>
            <p>
              Nous sommes fiers de soutenir les agriculteurs et producteurs locaux, renforçant ainsi notre système
              alimentaire local.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

