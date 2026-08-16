'use client';

import React, { useState } from 'react';

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
  netSalary,
  onShowToast,
}) => {
  const [pockets, setPockets] = useState<SavingsPocket[]>([
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
  const [newEventLabel, setNewEventLabel] = useState('');
  const [newEventAmount, setNewEventAmount] = useState<number>(500);
  const [newEventType, setNewEventType] = useState<'bonus' | 'tontine' | 'refund' | 'other'>('bonus');

  const handleAddWindfall = () => {
    if (!newEventLabel.trim() || newEventAmount <= 0) return;
    const item: WindfallEvent = {
      id: `w-${Date.now()}`,
      label: newEventLabel.trim(),
      amount: newEventAmount,
      date: new Date().toISOString().slice(0, 10),
      type: newEventType,
    };
    setWindfalls([item, ...windfalls]);
    setIsAddEventOpen(false);
    setNewEventLabel('');
    setNewEventAmount(500);
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
        {pockets.map((p) => {
          const ratio = Math.min(100, Math.round((p.current / (p.target || 1)) * 100));
          return (
            <div
              key={p.id}
              className="card"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <span>{p.name}</span>
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: p.color, fontFamily: 'var(--font-mono)' }}>
                  {ratio}%
                </span>
              </div>

              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {p.description}
              </p>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Montant accumulé :</span>
                  <strong style={{ color: p.color, fontFamily: 'var(--font-mono)' }}>
                    {p.current.toLocaleString('fr-FR')} € / {p.target.toLocaleString('fr-FR')} €
                  </strong>
                </div>
                <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${ratio}%`,
                      height: '100%',
                      background: p.color,
                      borderRadius: 3,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
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
      {isAddEventOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 460,
              padding: 24,
              borderRadius: 16,
              border: '1px solid var(--accent-emerald)',
              background: 'var(--bg-primary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
                Ajouter un Revenu Exceptionnel
              </h3>
              <button type="button" className="btn-ghost" onClick={() => setIsAddEventOpen(false)}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Libellé (ex: Prime, Virement Tontine)
                </label>
                <input
                  type="text"
                  className="input"
                  value={newEventLabel}
                  onChange={(e) => setNewEventLabel(e.target.value)}
                  placeholder="ex: Prime de performance"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Montant Net (€)
                </label>
                <input
                  type="number"
                  className="input"
                  value={newEventAmount}
                  onChange={(e) => setNewEventAmount(Number(e.target.value))}
                  style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Type
                </label>
                <select
                  className="input"
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value as any)}
                  style={{ width: '100%' }}
                >
                  <option value="bonus">Prime / Bonus d'entreprise</option>
                  <option value="tontine">Gain / Retour Tontine</option>
                  <option value="refund">Remboursement / Avoir</option>
                  <option value="other">Autre rentrée</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddEventOpen(false)}
                  style={{ flex: 1 }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddWindfall}
                  style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontWeight: 700 }}
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
