'use client';

import React, { useState } from 'react';

interface Pocket {
  id: string;
  name: string;
  icon: string;
  color: string;
  currentAmount: number;
  targetAmount: number;
  category: 'SECURITY' | 'INVEST' | 'LEISURE' | 'SOLIDARITY';
}

interface PocketsRulesViewProps {
  monthlySalary: number;
  onSyncMonthlyBudget?: (budget: number) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const PocketsRulesView: React.FC<PocketsRulesViewProps> = ({
  monthlySalary,
  onSyncMonthlyBudget,
  onShowToast,
}) => {
  // Pockets d'épargne Aura Budget
  const [pockets, setPockets] = useState<Pocket[]>([
    {
      id: 'p-tampon',
      name: 'Matelas de Sécurité (Tampon & Livret A)',
      icon: '🛡️',
      color: '#f59e0b',
      currentAmount: 1600,
      targetAmount: 6900,
      category: 'SECURITY',
    },
    {
      id: 'p-pea',
      name: 'Investissement PEA (DCA ETF World)',
      icon: '🚀',
      color: '#10b981',
      currentAmount: 1800,
      targetAmount: 10000,
      category: 'INVEST',
    },
    {
      id: 'p-leisure',
      name: 'Plaisir & Voyages (Sas Loisirs)',
      icon: '🎉',
      color: '#06b6d4',
      currentAmount: 450,
      targetAmount: 1500,
      category: 'LEISURE',
    },
    {
      id: 'p-tontine',
      name: 'Tontine & Soutien Solidaire',
      icon: '🤝',
      color: '#818cf8',
      currentAmount: 300,
      targetAmount: 1200,
      category: 'SOLIDARITY',
    },
  ]);

  // Règle 50/30/20
  const [needsPercent, setNeedsPercent] = useState(50);
  const [wantsPercent, setWantsPercent] = useState(30);
  const [savingsPercent, setSavingsPercent] = useState(20);

  // Cascade settings
  const [cascadeEnabled, setCascadeEnabled] = useState(true);
  const [cascadeThreshold, setCascadeThreshold] = useState(6900);

  const safeSalary = Math.max(1000, monthlySalary || 2861);
  const needsAmount = Math.round((safeSalary * needsPercent) / 100);
  const wantsAmount = Math.round((safeSalary * wantsPercent) / 100);
  const savingsAmount = Math.round((safeSalary * savingsPercent) / 100);

  const handleApplyDcaFromRules = async () => {
    if (onSyncMonthlyBudget) {
      await onSyncMonthlyBudget(savingsAmount);
      onShowToast(`🎯 Règle de cascade appliquée : Budget DCA PEA fixé à ${savingsAmount} €/m !`, 'success');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 🎯 SECTION 1 : POChes d'épargne (AURA POCKETS) */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(10, 14, 25, 0.98) 100%)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 14,
          padding: 22,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h4 style={{ fontSize: 16, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
              🎯 Pockets d'Épargne &amp; Enveloppes Dédiées (Aura Pro)
            </h4>
            <p style={{ margin: '3px 0 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Compartimentez votre épargne par objectif pour protéger votre matelas et discipliner vos projets.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {pockets.map((p) => {
            const fillRatio = p.targetAmount > 0 ? Math.min(100, Math.round((p.currentAmount / p.targetAmount) * 100)) : 0;
            return (
              <div
                key={p.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: p.color, fontFamily: 'var(--font-mono)' }}>
                    {fillRatio}%
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Solde actuel :</span>
                    <strong style={{ color: p.color, fontFamily: 'var(--font-mono)' }}>
                      {p.currentAmount.toLocaleString('fr-FR')} € / {p.targetAmount.toLocaleString('fr-FR')} €
                    </strong>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${fillRatio}%`,
                        height: '100%',
                        background: p.color,
                        borderRadius: 3,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ⚖️ SECTION 2 : RÈGLE 50/30/20 & CASCADE AUTOMATIQUE */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 14,
          padding: 22,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div>
            <h4 style={{ fontSize: 16, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
              ⚖️ Règle de Ventilation du Salaire &amp; Cascade Automatique
            </h4>
            <p style={{ margin: '3px 0 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
              Ventilation théorique sur base d'un salaire net de <strong>{Math.round(safeSalary).toLocaleString('fr-FR')} €</strong>.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleApplyDcaFromRules}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              fontWeight: 700,
            }}
          >
            ⚡ Synchroniser avec le DCA PEA ({savingsAmount} €/m)
          </button>
        </div>

        {/* 3 Blocs 50 / 30 / 20 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
          {/* 1. Besoins */}
          <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                🏠 Besoins Vitaux ({needsPercent}%)
              </span>
              <strong style={{ fontSize: 18, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {needsAmount} €
              </strong>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
              Loyer, factures, alimentation, transports incompressibles.
            </p>
          </div>

          {/* 2. Envies */}
          <div style={{ background: 'rgba(129, 140, 248, 0.08)', border: '1px solid rgba(129, 140, 248, 0.25)', borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase' }}>
                🎉 Envies &amp; Plaisir ({wantsPercent}%)
              </span>
              <strong style={{ fontSize: 18, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                {wantsAmount} €
              </strong>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
              Sorties, loisirs, abonnements, achats plaisir.
            </p>
          </div>

          {/* 3. Épargne & Invest */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
                🚀 Épargne &amp; PEA ({savingsPercent}%)
              </span>
              <strong style={{ fontSize: 18, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                {savingsAmount} €
              </strong>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: 11, color: 'var(--text-secondary)' }}>
              DCA ETF PEA, renforcement du sas tampon et réserve de précaution.
            </p>
          </div>
        </div>

        {/* Protocole de Cascade Automatique */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🌊</span>
            <div>
              <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>Cascade Automatique du Surplus :</strong>
              <p style={{ margin: '2px 0 0 0', fontSize: 11.5, color: 'var(--text-secondary)' }}>
                Dès que le matelas de sécurité atteint <strong>{cascadeThreshold.toLocaleString('fr-FR')} € (6 mois)</strong>, 100% du surplus mensuel est automatiquement injecté dans le PEA.
              </p>
            </div>
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-emerald)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
            }}
          >
            ✅ Protocole Actif
          </span>
        </div>
      </div>
    </div>
  );
};
