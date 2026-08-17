'use client';

import React from 'react';

interface BoursoManualAssetsSectionProps {
  livretABalanceInput: string;
  setLivretABalanceInput: (val: string) => void;
  livretARateInput: string;
  setLivretARateInput: (val: string) => void;
  peaPmeBalanceInput: string;
  setPeaPmeBalanceInput: (val: string) => void;
  tontineBalanceInput: string;
  setTontineBalanceInput: (val: string) => void;
  livretAYearlyInterest: number;
  onSaveManualAssets: () => void;
  manualSavedSuccess: boolean;
  formatEUR: (val: number) => string;
}

export function BoursoManualAssetsSection({
  livretABalanceInput,
  setLivretABalanceInput,
  livretARateInput,
  peaPmeBalanceInput,
  setPeaPmeBalanceInput,
  tontineBalanceInput,
  setTontineBalanceInput,
  livretAYearlyInterest,
  onSaveManualAssets,
  manualSavedSuccess,
  formatEUR,
}: BoursoManualAssetsSectionProps) {
  return (
    <div
      style={{
        padding: '20px',
        borderRadius: 16,
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 24 }}>🛡️</span>
        <div>
          <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Comptes d&apos;Épargne RIANE (Livret A, PEA-PME, Tontine)
          </h4>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Certaines enveloppes (Livret A, PEA-PME) nécessitent une valorisation déclarative si non agrégées par le protocole bancaire direct.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        {/* Livret A Inputs */}
        <div
          style={{
            padding: '14px',
            borderRadius: 12,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>
              Livret A BoursoBank (€)
            </label>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Taux net : {livretARateInput}%</span>
          </div>
          <input
            type="text"
            value={livretABalanceInput}
            onChange={(e) => setLivretABalanceInput(e.target.value)}
            placeholder="0,00"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              fontWeight: 700,
              width: '100%',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
            <span>Intérêts nets annuels :</span>
            <strong style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
              +{formatEUR(livretAYearlyInterest)} / an
            </strong>
          </div>
        </div>

        {/* PEA-PME Input */}
        <div
          style={{
            padding: '14px',
            borderRadius: 12,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
            PEA-PME Déclaratif (€)
          </label>
          <input
            type="text"
            value={peaPmeBalanceInput}
            onChange={(e) => setPeaPmeBalanceInput(e.target.value)}
            placeholder="0,00"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              fontWeight: 700,
              width: '100%',
            }}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Enveloppe PME BoursoBank (Indépendance ES, Riber, Memscap)
          </div>
        </div>

        {/* Tontine Indicative Input */}
        <div
          style={{
            padding: '14px',
            borderRadius: 12,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>
              Compte Tontine Indicatif (€)
            </label>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Échéance : Septembre</span>
          </div>
          <input
            type="text"
            value={tontineBalanceInput}
            onChange={(e) => setTontineBalanceInput(e.target.value)}
            placeholder="0,00 (laisser 0 pour masquer)"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              fontWeight: 700,
              width: '100%',
            }}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
            Épargne collective rotative (1 rotation par an en Septembre). À titre indicatif : n&apos;est pas comptabilisée dans vos liquidités quotidiennes et sera virée sur le Compte Tampon lors de sa perception.
          </div>
        </div>
      </div>

      {/* Save button and success confirmation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <button
          onClick={onSaveManualAssets}
          className="btn btn-primary btn-sm"
          type="button"
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          💾 Enregistrer mes soldes manuels
        </button>

        {manualSavedSuccess && (
          <span style={{ fontSize: 12, color: 'var(--accent-emerald)', fontWeight: 700, animation: 'fadeIn 0.2s ease' }}>
            ✓ Soldes enregistrés et actualisés avec succès !
          </span>
        )}
      </div>
    </div>
  );
}
