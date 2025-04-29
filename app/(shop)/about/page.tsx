import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient'; // Client Component'i import et

// Hakkımızda sayfası için metadata
export const metadata: Metadata = {
  title: "À Propos de Nous - Notre Histoire et Nos Valeurs | Philippe Primeurs",
  description: "Découvrez l'histoire de Philippe Primeurs à Mouscron, notre engagement envers la fraîcheur, la durabilité et le soutien aux producteurs locaux depuis 2010.",
  openGraph: {
    title: "Notre Histoire - Philippe Primeurs",
    description: "Apprenez-en plus sur notre engagement envers la qualité et la communauté.",
    type: 'website', // veya 'profile'
    locale: 'fr_BE',
    url: 'https://www.philippeprimeurs.be/about', // Placeholder URL güncellendi
    // images: [ // Hakkımızda sayfası için uygun bir OG görseli ekleyin!
    //   {
    //     url: 'https://www.philippeprimeurs.be/og-about.jpg', // Placeholder URL güncellendi
    //     width: 1200,
    //     height: 630,
    //     alt: 'Magasin Philippe Primeurs',
    //   },
    // ],
  },
  // twitter: { ... } // İsteğe bağlı
};

// Server Component
export default function AboutPage() {
  // Client Component'i render et
  return <AboutPageClient />;
}

