'use client';

import React, { useState } from 'react';
import { AuraSavingsPocketCard } from './funnel/AuraSavingsPocketCard';
import { AuraWindfallAddModal } from './funnel/AuraWindfallAddModal';

export interface SavingsPocket {
  id: string;
  name: string;
  target: number;
  current: number;
  icon: string;
  color: string;
  description: string;
}

export interface WindfallEvent {
  id: string;
  label: string;
  amount: number;
  date: string;
  type: 'bonus' | 'tontine' | 'refund' | 'other';
}

interface AuraSavingsFunnelViewProps {
  netSalary: number;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AuraSavingsFunnelView: React.FC<AuraSavingsFunnelViewProps> = ({
  onShowToast,
}) => {
  const [pockets] = useState<SavingsPocket[]>([
    {
      id: 'p-tampon',
      name: '1. Matelas de Sécurité (Tampon & Livret A)',
      target: 6900,
      current: 1600,
      icon: '🛡️',
      color: '#f59e0b',
      description: 'Protection immédiate contre les imprévus (6 mois de charges incompressibles).',
    },
    {
      id: 'p-pea',
      name: '2. Investissement PEA (DCA ETF World)',
      target: 10000,
      current: 1800,
      icon: '🚀',
      color: '#10b981',
      description: 'Croissance long terme du capital par versements réguliers mensuels.',
    },
    {
      id: 'p-plaisir',
      name: '3. Sas Plaisir & Projets (Vacances)',
      target: 1500,
      current: 450,
      icon: '🎉',
      color: '#06b6d4',
      description: 'Enveloppe dédiée aux sorties, voyages et achats coups de cœur sans culpabilité.',
    },
    {
      id: 'p-tontine',
      name: '4. Tontine Solidaire & Soutien',
      target: 1200,
      current: 300,
      icon: '🤝',
      color: '#8b5cf6',
      description: 'Épargne tournante communautaire et contributions familiales programmées.',
    },
  ]);

  const [windfalls, setWindfalls] = useState<WindfallEvent[]>([
    { id: 'w-1', label: 'Prime Intéressement 2026', amount: 1450, date: '2026-06-15', type: 'bonus' },
    { id: 'w-2', label: 'Rachat RTT non pris', amount: 320, date: '2026-05-30', type: 'bonus' },
  ]);

  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  const handleAddWindfall = (item: WindfallEvent) => {
    setWindfalls([item, ...windfalls]);
    setIsAddEventOpen(false);
    onShowToast(`🎉 Revenu exceptionnel "${item.label}" (+${item.amount} €) enregistré !`, 'success');
  };

  const totalSaved = pockets.reduce((acc, p) => acc + p.current, 0);
  const totalTarget = pockets.reduce((acc, p) => acc + p.target, 0);
  const globalRatio = Math.min(100, Math.round((totalSaved / (totalTarget || 1)) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 🌊 EN-TÊTE ENTONNOIR D'ÉPARGNE GLOBAL */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: 14,
          padding: 22,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: 17, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
              🎯 Entonnoir d'Épargne &amp; Pockets (Aura Funnel)
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Aiguillez chaque euro selon les priorités financières : Matelas &rarr; PEA &rarr; Projets &rarr; Solidarité.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsAddEventOpen(true)}
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontWeight: 700 }}
          >
            🎁 + Rentrée Exceptionnelle
          </button>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Progression globale de l'entonnoir :</span>
            <strong style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
              {totalSaved.toLocaleString('fr-FR')} € / {totalTarget.toLocaleString('fr-FR')} € ({globalRatio}%)
            </strong>
          </div>
          <div style={{ width: '100%', height: 10, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 5, overflow: 'hidden' }}>
            <div
              style={{
                width: `${globalRatio}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #f59e0b, #10b981, #06b6d4)',
                borderRadius: 5,
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* 🧭 LES 4 ÉTAPES DE L'ENTONNOIR (POCKETS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {pockets.map((p) => (
          <AuraSavingsPocketCard key={p.id} pocket={p} />
        ))}
      </div>

      {/* 🎁 HISTORIQUE DES RENTRÉES EXCEPTIONNELLES */}
      <div className="card" style={{ padding: 20 }}>
        <h4 style={{ fontSize: 15, margin: '0 0 12px 0', fontWeight: 800, color: 'var(--text-primary)' }}>
          🎁 Historique des Primes &amp; Rentrées Exceptionnelles ({windfalls.length})
        </h4>

        {windfalls.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
            Aucun événement exceptionnel consigné.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {windfalls.map((w) => (
              <div
                key={w.id}
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>{w.label}</strong>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Reçu le {w.date} &bull; Catégorie : {w.type.toUpperCase()}
                  </div>
                </div>

                <strong style={{ fontSize: 16, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                  +{w.amount.toLocaleString('fr-FR')} €
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🎁 MODAL D'AJOUT DE RENTRÉE */}
      <AuraWindfallAddModal
        isOpen={isAddEventOpen}
        onClose={() => setIsAddEventOpen(false)}
        onAdd={handleAddWindfall}
      />
    </div>
  );
};
