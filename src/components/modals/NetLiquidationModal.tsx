'use client';

import React from 'react';

interface NetLiquidationModalProps {
  isOpen: boolean;
  netLiquidationDetails: {
    totalNetValue: number;
    totalGrossValue: number;
    totalGrossGain: number;
    totalEstimatedTax: number;
  };
  peaSeniority: 'under5' | 'over5';
  setPeaSeniority: (s: 'under5' | 'over5') => void;
  onNavigateEnvelopes: () => void;
  onClose: () => void;
}

export function NetLiquidationModal({
  isOpen,
  netLiquidationDetails,
  peaSeniority,
  setPeaSeniority,
  onNavigateEnvelopes,
  onClose,
}: NetLiquidationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card" style={{ maxWidth: 480, width: '90%' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            💰 Montant Net Réel si Retrait
          </h3>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 12, border: '2px solid var(--accent-emerald)', textAlign: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
            Somme nette virée sur votre compte bancaire aujourd&apos;hui
          </span>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-emerald)', margin: '8px 0' }}>
            {netLiquidationDetails.totalNetValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Après déduction de la fiscalité (PFU 31.4% et Prélèvements Sociaux)
          </span>
        </div>

        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid var(--accent-blue)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Hypothèse Fiscale PEA</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Ancienneté du PEA au retrait</span>
          </div>
          <div style={{ display: 'flex', gap: 6, background: 'var(--bg-primary)', padding: 4, borderRadius: 6 }}>
            <button
              type="button"
              className={`btn btn-sm ${peaSeniority === 'over5' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 11, padding: '4px 8px' }}
              onClick={() => setPeaSeniority('over5')}
            >
              &gt; 5 ans (18.6%)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${peaSeniority === 'under5' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 11, padding: '4px 8px' }}
              onClick={() => setPeaSeniority('under5')}
            >
              &lt; 5 ans (31.4%)
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
            <span style={{ color: 'var(--text-secondary)' }}>💵 Valeur brute totale</span>
            <strong>{netLiquidationDetails.totalGrossValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
            <span style={{ color: 'var(--text-secondary)' }}>📈 Plus-value brute réalisée</span>
            <strong style={{ color: netLiquidationDetails.totalGrossGain >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              {netLiquidationDetails.totalGrossGain >= 0 ? '+' : ''}{netLiquidationDetails.totalGrossGain.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
            <span style={{ color: 'var(--text-secondary)' }}>🏛️ Impôts &amp; Cotisations déduits</span>
            <strong style={{ color: 'var(--accent-rose)' }}>
              -{netLiquidationDetails.totalEstimatedTax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: 12 }}
            onClick={() => {
              onClose();
              onNavigateEnvelopes();
            }}
          >
            💼 Accéder à la simulation complète
          </button>
          <button type="button" className="btn btn-primary" style={{ fontSize: 12 }} onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
