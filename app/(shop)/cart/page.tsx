import type { Metadata } from 'next';
import CartPageClient from './CartPageClient'; // Client Component'i import et

// Sepet sayfası için metadata
export const metadata: Metadata = {
  title: "Mon Panier - Finaliser ma commande | Philippe Primeurs",
  description: "Vérifiez le contenu de votre panier et finalisez votre commande de fruits, légumes et produits frais chez Philippe Primeurs à Mouscron.",
  robots: { // Arama motorlarının bu sayfayı indekslemesini engelle
    index: false,
    follow: true, // Sayfadaki linkleri takip etmesine izin ver (isteğe bağlı)
  },
  openGraph: {
    title: "Mon Panier - Philippe Primeurs",
    description: "Finalisez votre commande de produits frais.",
    type: 'website',
    locale: 'fr_BE',
    url: 'https://www.philippeprimeurs.be/cart', // Placeholder URL güncellendi
  },
};

// Server Component
export default function CartPage() {
  // Client Component'i render et
  // Suspense burada gerekli değil çünkü CartPageClient kendi içinde Suspense kullanmıyor (gibi görünüyor)
  // Eğer CartPageClient içinde Suspense gerektiren bir async işlem olsaydı, burada da gerekirdi.
  return <CartPageClient />;
}

