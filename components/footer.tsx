import Link from "next/link"
import { Facebook, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDeliveryHours, formatDeliveryHours } from '@/lib/delivery-hours'
import { useEffect } from 'react'

// Footer'da kullanılacak basit harita bileşeni - sadece başlık çubuğunu gizleyen versiyon
const FooterMap = () => {
  return (
    <div className="w-full h-40 rounded-lg overflow-hidden relative">
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ 
          height: '120%',  // Biraz daha yüksek bir iframe 
          marginTop: '-60px', // Başlık çubuğunu tamamen kırpmak için
        }}
      >
        <iframe 
          src="https://www.google.com/maps/d/u/1/embed?mid=1hSk318NamxxEUMSE11njru_PESEPGMk&ehbc=2E312F&noprof=1&ui=simplified" 
          width="100%" 
          height="100%" 
          style={{ border: 0 }}
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          title="Philippe Primeurs Harita"
        ></iframe>
      </div>
    </div>
  );
};

export default function Footer() {
  const { hours, fetchHours } = useDeliveryHours()

  useEffect(() => {
    fetchHours()
  }, [fetchHours])

  return (
    <footer className="bg-secondary text-white w-full">
      {/* Footer content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <h3 className="text-lg font-bold mb-3 text-white">Philippe Primeurs by Fauve</h3>
            <p className="mb-3 text-sm">Des produits frais et locaux, de la ferme à votre table.</p>
            <div className="flex space-x-4 mb-4">
              <Button variant="ghost" size="icon" onClick={() => window.open("https://www.facebook.com/share/1ARVsrKJhZ/?mibextid=wwXIfr", "_blank")}>
                <Facebook size={18} className="text-white hover:text-primary-foreground transition-smooth" />
                <span className="sr-only">Facebook</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => window.open("https://www.tiktok.com/@philippeprimeursbyfauve?_t=ZN-8uK8hfrKY58&_r=1", "_blank")}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  className="text-white hover:text-primary-foreground transition-smooth"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                <span className="sr-only">TikTok</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => window.open("https://www.instagram.com/philippeprimeursbyfauve?igsh=bXR5dnF0cDdxYm83", "_blank")}>
                <Instagram size={18} className="text-white hover:text-primary-foreground transition-smooth" />
                <span className="sr-only">Instagram</span>
              </Button>
            </div>
            <FooterMap />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-3 text-white">Liens Rapides</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/" className="text-white hover:text-primary-foreground transition-smooth">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-white hover:text-primary-foreground transition-smooth">
                  Produits
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-white hover:text-primary-foreground transition-smooth">
                  À Propos
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white hover:text-primary-foreground transition-smooth">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-white hover:text-primary-foreground transition-smooth">
                  Panier
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-3 text-white">Contact</h3>
            <div className="space-y-2">
              <p>Rue de la Broche de Fer 263</p>
              <p>7712 Mouscron</p>
              <p>Tel: 056 55 66 15</p>
              <p>Email: infos@philippeprimeurs.be</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-3 text-white">Horaires d'ouverture</h3>
            <div className="space-y-2">
              {hours.map((hour, index) => (
                <div key={`${hour.day}-${index}`} className="flex justify-between">
                  <span>{hour.day}</span>
                  <span className="text-muted-foreground">
                    {formatDeliveryHours(hour)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-white/30 text-center text-sm">
          <p className="mb-2">Ce site utilise uniquement des cookies essentiels pour les fonctionnalités de base. Pour plus d'informations, consultez notre <Link href="/privacy-policy" className="text-white hover:text-primary-foreground underline transition-smooth">Politique de Confidentialité</Link>.</p>
          <p>&copy; {new Date().getFullYear()} Philippe Primeurs. Tous droits réservés.</p>
          <div className="mt-2">
            <Link href="/privacy-policy" className="text-white hover:text-primary-foreground transition-smooth mr-4">
              Politique de confidentialité
            </Link>
            <Link href="/terms-of-service" className="text-white hover:text-primary-foreground transition-smooth mr-4">
              Conditions d'utilisation
            </Link>
            <Link href="/contact" className="text-white hover:text-primary-foreground transition-smooth">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

