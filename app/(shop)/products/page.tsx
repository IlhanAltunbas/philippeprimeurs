import type { Metadata } from 'next';
import ProductsPageClient from './ProductsPageClient'; // Yeni Client Component'i import et

// Server Component olduğu için Suspense burada kullanılabilir
import { Suspense } from 'react'; 

// Dinamik davranış için bu kalabilir veya duruma göre ayarlanabilir
export const dynamic = 'force-dynamic'; 

// Metadata objesi
export const metadata: Metadata = {
  title: "Nos Produits - Fruits, Légumes et Produits Locaux | Philippe Primeurs",
  description: "Parcourez notre sélection complète de fruits frais, légumes de saison, produits faits maison et paniers garnis chez Philippe Primeurs à Mouscron, Belgique.",
  openGraph: {
    title: "Découvrez Tous Nos Produits Frais - Philippe Primeurs",
    description: "Fruits, légumes, colis, fait maison et paniers disponibles.",
    type: 'website', // veya 'product.group' olabilir
    locale: 'fr_BE',
    url: 'https://www.philippeprimeurs.be/products', // Placeholder URL güncellendi
    // images: [ // Ürünler sayfası için uygun bir OG görseli ekleyin!
    //   {
    //     url: 'https://www.philippeprimeurs.be/og-products.jpg', // Placeholder URL güncellendi
    //     width: 1200,
    //     height: 630,
    //     alt: 'Assortiment de produits frais - Philippe Primeurs',
    //   },
    // ],
  },
  // twitter: { ... } // İsteğe bağlı
};

// Bu artık bir Server Component
export default function ProductsPage() {
  // Client Component'i render ediyoruz
  // searchParams okuma işlemi Client Component'e taşındığı için 
  // ProductsPageClient Suspense ile sarmalanmalıdır.
  return (
    <Suspense fallback={<div>Chargement des produits...</div>}> 
      <ProductsPageClient />
    </Suspense>
  );
}

