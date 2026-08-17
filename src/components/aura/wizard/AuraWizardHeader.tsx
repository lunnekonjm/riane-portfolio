'use client';

import React from 'react';

interface AuraWizardHeaderProps {
  periodDays: number;
  setPeriodDays: (days: number) => void;
  selectedAccount: string;
  setSelectedAccount: (acc: string) => void;
  availableAccounts: Array<{ id: string; name: string }>;
  onClose: () => void;
  onRefresh?: () => void;
  isSyncing?: boolean;
  learnedRulesCount?: number;
  onResetMemory?: () => void;
}

export function AuraWizardHeader({
  periodDays,
  setPeriodDays,
  selectedAccount,
  setSelectedAccount,
  availableAccounts,
  onClose,
  onRefresh,
  isSyncing,
  learnedRulesCount = 0,
  onResetMemory,
}: AuraWizardHeaderProps) {
  return (
    <div
      style={{
        padding: '16px 22px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(15, 23, 42, 0.8)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}
        >
          🪄
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: '#ffffff' }}>
              Radar &amp; Validation des Flux Bancaires
            </h3>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 6,
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: 'var(--accent-emerald)',
                fontSize: 10.5,
                fontWeight: 800,
              }}
            >
              BoursoBank DSP2
            </span>

            {/* AI Learning Memory Indicator & Reset */}
            {learnedRulesCount > 0 && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  color: '#c084fc',
                  fontSize: 10.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title="L'IA se souvient de vos désélections et choix précédents pour affiner les propositions."
              >
                🧠 Mémoire active ({learnedRulesCount})
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
            Contrôlez et réaffectez chaque transaction unitaire en 1 clic. L'IA apprend de vos validations.
          </p>
        </div>
      </div>

      {/* Account Selector, Period Filter & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Memory Reset Button */}
        {learnedRulesCount > 0 && onResetMemory && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Voulez-vous réinitialiser la mémoire d'apprentissage IA ? L'analyse repartira de zéro sur toutes les transactions brutes.")) {
                onResetMemory();
              }
            }}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Effacer la mémoire d'apprentissage et réanalyser sans historique"
          >
            🔄 Reset Mémoire IA
          </button>
        )}

        {/* Account Filter */}
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(10, 14, 23, 0.95)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#6ee7b7',
            fontSize: 11.5,
            fontWeight: 800,
            cursor: 'pointer',
          }}
          title="Filtrer l'analyse par compte bancaire"
        >
          <option value="PRINCIPAL">★ Compte Principal (M. Negem Richard)</option>
          <option value="ALL">Tous les comptes BoursoBank</option>
          {availableAccounts
            .filter((a) => a.id !== 'PRINCIPAL' && a.id !== 'ALL')
            .map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
        </select>

        {/* Period Filter */}
        <select
          value={periodDays}
          onChange={(e) => setPeriodDays(parseInt(e.target.value, 10))}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(10, 14, 23, 0.9)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            color: '#cbd5e1',
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <option value={30}>Dernier mois (30 jours)</option>
          <option value={90}>Moyenne 3 mois (90 jours)</option>
          <option value={0}>Toutes les transactions</option>
        </select>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isSyncing}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: isSyncing ? 'rgba(6, 182, 212, 0.1)' : 'rgba(6, 182, 212, 0.2)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              color: '#38bdf8',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: isSyncing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            {isSyncing ? '⏳ Sync...' : '🔄 Synchro'}
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#cbd5e1',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
