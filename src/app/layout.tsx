import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RIANE Portfolio — Analyse Multi-Agents',
  description: 'Application multi-agents d\'analyse de portefeuille : veille, revue à la demande, allocation, simulations et gestion du risque.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
