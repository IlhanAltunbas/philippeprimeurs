import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité | Philippe Primeurs',
  description: 'Politique de confidentialité de Philippe Primeurs - Découvrez comment nous traitons vos données personnelles.',
};

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-secondary">Politique de confidentialité</h1>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="mb-6">
            Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD).
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3 text-primary">1. Qui sommes-nous ?</h2>
          <p className="mb-6">
            Nous sommes un magasin de fruits et légumes local basé en Belgique. Ce site web est utilisé pour traiter vos commandes et livrer vos produits.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3 text-primary">2. Données collectées</h2>
          <ul className="list-disc ml-6 mb-6">
            <li className="mb-1">Nom et prénom</li>
            <li className="mb-1">Numéro de téléphone</li>
            <li className="mb-1">Adresse de livraison</li>
            <li className="mb-1">Détails de la commande</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-3 text-primary">3. Utilisation des données</h2>
          <p className="mb-6">
            Vos données sont utilisées uniquement dans le but de traiter et de livrer vos commandes. Aucune donnée n'est utilisée à des fins publicitaires ou d'analyse.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3 text-primary">4. Durée de conservation</h2>
          <p className="mb-6">
            Les données personnelles sont conservées uniquement pendant la durée nécessaire au traitement des commandes, puis supprimées régulièrement.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-3 text-primary">5. Vos droits</h2>
          <p className="mb-4">
            Conformément au RGPD, vous avez le droit de :
          </p>
          <ul className="list-disc ml-6 mb-6">
            <li className="mb-1">Consulter vos données personnelles</li>
            <li className="mb-1">Demander la correction ou la suppression de vos données</li>
            <li className="mb-1">Retirer votre consentement à tout moment</li>
            <li className="mb-1">Nous contacter pour toute demande relative à vos données</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-3 text-primary">6. Contact</h2>
          <p className="mb-6">
            Pour toute question ou demande concernant vos données, veuillez nous contacter à : <a href="mailto:infos@philippeprimeurs.be" className="text-blue-500 underline">infos@philippeprimeurs.be</a>
          </p>

          <p className="text-sm text-gray-600 mt-8">Dernière mise à jour : avril 2025</p>
        </div>
      </div>
    </div>
  );
} 