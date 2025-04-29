import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions d\'Utilisation | Philippe Primeurs',
  description: 'Consultez les conditions d\'utilisation du site web de Philippe Primeurs à Mouscron.',
  robots: { 
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Conditions d\'Utilisation - Philippe Primeurs',
    description: 'Règles d\'utilisation de notre site web.',
    type: 'website',
    locale: 'fr_BE',
    url: 'https://www.philippeprimeurs.be/terms-of-service',
  },
};

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-secondary">Conditions d'utilisation</h1>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="mb-6">
            Les présentes conditions régissent l'utilisation de notre site de commande en ligne. En passant une commande, vous acceptez ces conditions.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3 text-primary">1. Commandes</h2>
          <p className="mb-6">
            Toutes les commandes sont traitées sous réserve de disponibilité. Nous nous réservons le droit d'annuler une commande en cas d'erreur ou de rupture de stock.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3 text-primary">2. Prix</h2>
          <p className="mb-6">
            Les prix affichés sont en euros et incluent la TVA. Nous nous réservons le droit de modifier les prix à tout moment.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3 text-primary">3. Livraison</h2>
          <p className="mb-6">
            La livraison est disponible dans certaines zones géographiques. Les délais peuvent varier selon la disponibilité des produits.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3 text-primary">4. Données personnelles</h2>
          <p className="mb-6">
            En utilisant ce site, vous consentez à la collecte de vos données pour le traitement de votre commande. Voir notre <a href="/privacy-policy" className="underline text-blue-500 hover:text-blue-700 transition-colors">Politique de confidentialité</a>.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3 text-primary">5. Cookies</h2>
          <p className="mb-6">
            Ce site utilise uniquement des cookies essentiels pour assurer son bon fonctionnement. Ces cookies sont strictement nécessaires à la fourniture de notre service et ne collectent pas d'informations utilisées à des fins de marketing.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3 text-primary">6. Contact</h2>
          <p className="mb-6">
            Pour toute question, veuillez nous contacter à : <a href="mailto:infos@philippeprimeurs.be" className="text-blue-500 underline hover:text-blue-700 transition-colors">infos@philippeprimeurs.be</a>
          </p>

          <p className="text-sm text-gray-600 mt-8">Dernière mise à jour : avril 2025</p>
        </div>
      </div>
    </div>
  );
} 