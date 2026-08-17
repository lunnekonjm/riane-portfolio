'use client';

import React from 'react';
import type { TaxEnvelopeType } from '@/engines/monteCarloEngine';

interface MonteCarloInputsBarProps {
  capitalInput: number;
  setCapitalInput: (val: number) => void;
  dcaInput: number;
  setDcaInput: (val: number) => void;
  horizonYears: number;
  setHorizonYears: (val: number) => void;
  taxEnvelope: TaxEnvelopeType;
  setTaxEnvelope: (val: TaxEnvelopeType) => void;
  expectedReturn: number;
  setExpectedReturn: (val: number) => void;
  volatility: number;
  setVolatility: (val: number) => void;
  setUseOwnAssumptions: (val: boolean) => void;
  numSimulations: number;
  setNumSimulations: (val: number) => void;
  onSync: () => void;
}

export function MonteCarloInputsBar({
  capitalInput,
  setCapitalInput,
  dcaInput,
  setDcaInput,
  horizonYears,
  setHorizonYears,
  taxEnvelope,
  setTaxEnvelope,
  expectedReturn,
  setExpectedReturn,
  volatility,
  setVolatility,
  setUseOwnAssumptions,
  numSimulations,
  setNumSimulations,
  onSync,
}: MonteCarloInputsBarProps) {
  return (
    <>
      {/* Sync Button & Precision Mode Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          Versements projetés : <strong style={{ color: 'var(--accent-cyan)' }}>{capitalInput.toLocaleString('fr-FR')} €</strong> (Départ) + <strong style={{ color: 'var(--accent-emerald)' }}>{(dcaInput * horizonYears * 12).toLocaleString('fr-FR')} €</strong> ({dcaInput} €/mois × {horizonYears * 12}m) = <strong style={{ color: 'white' }}>{(capitalInput + dcaInput * horizonYears * 12).toLocaleString('fr-FR')} €</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 500 }}>Précision Monte Carlo :</span>
          {[
            { label: '⚡ Fast (2.5k)', val: 2500, tooltip: 'Rendu ultra-rapide (5 ms)' },
            { label: '📊 Standard (10k)', val: 10000, tooltip: 'Étalon-or standard de l\'industrie (25 ms)' },
            { label: '🔬 Audit (50k)', val: 50000, tooltip: 'Précision maximale pour crash test P1 (120 ms)' },
          ].map((mode) => (
            <button
              key={mode.val}
              type="button"
              className="btn"
              style={{
                fontSize: 'var(--text-xs)',
                padding: '4px 8px',
                background: numSimulations === mode.val ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
                color: numSimulations === mode.val ? '#0a0e17' : 'var(--text-secondary)',
                fontWeight: numSimulations === mode.val ? 700 : 500,
                border: '1px solid var(--border-subtle)',
              }}
              onClick={() => setNumSimulations(mode.val)}
              data-tooltip={mode.tooltip}
            >
              {mode.label}
            </button>
          ))}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-cyan)', padding: '4px 8px', fontWeight: 600 }}
            onClick={onSync}
            data-tooltip="Réinitialiser les montants avec les valeurs réelles de votre portefeuille"
          >
            ⚡ Synchroniser
          </button>
        </div>
      </div>

      {/* Input Parameters Panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 14, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', margin: '6px 0 10px 0', border: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 120px', minWidth: 110 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
            Capital Initial (€)
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-cyan)', display: 'block', fontWeight: 600 }}>Placé au départ</span>
          </label>
          <input
            type="number"
            className="input mono"
            value={capitalInput}
            onChange={(e) => setCapitalInput(Number(e.target.value))}
            style={{ fontSize: 14, padding: '6px 10px', width: '100%', fontWeight: 700 }}
          />
        </div>
        <div style={{ flex: '1 1 110px', minWidth: 100 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
            DCA Mensuel (€)
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-emerald)', display: 'block', fontWeight: 600 }}>Ajout chaque mois</span>
          </label>
          <input
            type="number"
            className="input mono"
            value={dcaInput}
            onChange={(e) => setDcaInput(Number(e.target.value))}
            style={{ fontSize: 14, padding: '6px 10px', width: '100%', fontWeight: 700 }}
          />
        </div>
        <div style={{ flex: '1 1 140px', minWidth: 130 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Horizon (Ans)</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {[5, 10, 15, 20, 25].map((h) => (
              <button
                key={h}
                type="button"
                className={`btn btn-sm ${horizonYears === h ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setHorizonYears(h)}
                style={{ fontSize: 'var(--text-xs)', padding: '4px 4px', flex: 1, fontWeight: 600 }}
              >
                {h}a
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: '1.2 1 150px', minWidth: 140 }}>
          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Fiscalité Enveloppe</label>
          <select
            className="input"
            value={taxEnvelope}
            onChange={(e) => setTaxEnvelope(e.target.value as TaxEnvelopeType)}
            style={{ fontSize: 12, padding: '6px 6px', fontWeight: 700, width: '100%' }}
          >
            <option value="MIXED">📊 Mixte (PEA + CTO)</option>
            <option value="PEA">🏛️ PEA (18.6% PS)</option>
            <option value="CTO">💼 CTO (31.4% PFU)</option>
          </select>
        </div>
        <div style={{ flex: '0.8 1 80px', minWidth: 70 }}>
          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Rendement (%)</label>
          <input
            type="number"
            step="0.5"
            className="input mono"
            value={expectedReturn}
            onChange={(e) => { setExpectedReturn(Number(e.target.value)); setUseOwnAssumptions(true); }}
            style={{ fontSize: 13, padding: '6px 8px', width: '100%' }}
          />
        </div>
        <div style={{ flex: '0.8 1 80px', minWidth: 70 }}>
          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>Volatilité (%)</label>
          <input
            type="number"
            step="0.5"
            className="input mono"
            value={volatility}
            onChange={(e) => { setVolatility(Number(e.target.value)); setUseOwnAssumptions(true); }}
            style={{ fontSize: 13, padding: '6px 8px', width: '100%' }}
          />
        </div>
      </div>
    </>
  );
}
