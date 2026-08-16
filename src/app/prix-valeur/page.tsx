import React from 'react';
import { Metadata } from 'next';
import { ValuationDashboard } from '@/components/valuation/ValuationDashboard';

export const metadata: Metadata = {
  title: 'Prix ≠ Valeur — Cours de Bourse vs Bénéfices & Chiffre d\'Affaires (20 Valeurs)',
  description: 'Outil institutionnel de suivi et d\'évaluation boursière pour 20 valeurs : mémoire persistante, consensus analystes, modèle chiffre d\'affaires et diagnostic Gemini 3.7 Flash.',
};

export default function PrixValeurPage() {
  return (
    <main className="min-h-screen bg-[#080a10] text-[#e9ecf4]">
      <ValuationDashboard />
    </main>
  );
}
