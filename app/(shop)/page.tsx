// app/(shop)/page.tsx

// "use client" direktifi kaldırıldı

import type { Metadata } from 'next';
import HomePageClient from './HomePageClient'; // Yeni Client Component'i import et

// Statik derleme yapılandırması burada kalabilir veya kaldırılabilir
// export const dynamic = 'force-static';

// Metadata objesi burada dışa aktarılıyor
export const metadata: Metadata = {
  title: "Philippe Primeurs - Fruits et Légumes Frais, Produits Locaux à Mouscron, Belgique",
  description: "Découvrez Philippe Primeurs, votre spécialiste en fruits et légumes frais, produits locaux et de saison à Mouscron, Belgique. Qualité, fraîcheur et service de confiance.",
  openGraph: {
    title: "Philippe Primeurs - Votre Primeur de Confiance",
    description: "Qualité, fraîcheur et produits locaux à Mouscron, Belgique.",
    type: 'website',
    locale: 'fr_BE',
    url: 'https://www.philippeprimeurs.be',
    // images: [ // Ana sayfa için uygun bir OG görseli ekleyin!
    //   {
    //     url: 'https://www.philippeprimeurs.be/og-accueil.jpg',
    //     width: 1200,
    //     height: 630,
    //     alt: 'Philippe Primeurs - Fruits et Légumes Frais',
    //   },
    // ],
  },
  // twitter: { // İsterseniz Twitter kartları için de benzer bilgiler ekleyebilirsiniz.
  //   card: 'summary_large_image',
  //   title: "Philippe Primeurs - Votre Primeur de Confiance",
  //   description: "Qualité, fraîcheur et produits locaux à Mouscron, Belgique.",
  //   images: ['https://www.philippeprimeurs.be/twitter-accueil.jpg'],
  // },
};

// Bu artık bir Server Component
export default function HomePage() {
  // Tüm state, effect ve diğer hook'lar kaldırıldı.
  // Sadece Client Component'i render ediyoruz.
  return <HomePageClient />;
}

// AnimatedSection gibi Client Component gerektiren yardımcı bileşenler
// HomePageClient.tsx içine taşındı veya oradan import edilebilir.

