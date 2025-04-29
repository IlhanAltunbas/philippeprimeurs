import type { Metadata } from 'next';
import ContactPageClient from './ContactPageClient'; // Client Component'i import et

// İletişim sayfası için metadata
export const metadata: Metadata = {
  title: "Contactez-Nous - Philippe Primeurs | Mouscron, Belgique",
  description: "Contactez Philippe Primeurs à Mouscron pour toute question ou demande. Retrouvez notre adresse, numéro de téléphone et formulaire de contact.",
  openGraph: {
    title: "Nous Contacter - Philippe Primeurs",
    description: "Adresse, téléphone et formulaire de contact.",
    type: 'website',
    locale: 'fr_BE',
    url: 'https://www.philippeprimeurs.be/contact', // Placeholder URL güncellendi
    // images: [ // İletişim sayfası için uygun bir OG görseli ekleyin (örn. harita veya mağaza resmi)
    //   {
    //     url: 'https://www.philippeprimeurs.be/og-contact.jpg', // Placeholder URL güncellendi
    //     width: 1200,
    //     height: 630,
    //     alt: 'Contacter Philippe Primeurs',
    //   },
    // ],
  },
  // twitter: { ... } // İsteğe bağlı
};

// Server Component
export default function ContactPage() {
  // Client Component'i render et
  return <ContactPageClient />;
}

