'use client';

import React from 'react';
import type { BoursoAccountConfig } from '../IntegrationsHubModal';

export interface ProcessedBoursoAccount {
  id: string;
  displayName: string;
  ibanMasked?: string;
  accountType: string;
  balanceEUR: number;
  customAlias: string;
  effectiveCategory: BoursoAccountConfig['category'];
  isIncluded: boolean;
}

interface BoursoAccountCardProps {
  acc: ProcessedBoursoAccount;
  onSaveBoursoConfig: (accId: string, cfg: Partial<BoursoAccountConfig>) => void;
  formatEUR: (val: number) => string;
}

export function BoursoAccountCard({
  acc,
  onSaveBoursoConfig,
  formatEUR,
}: BoursoAccountCardProps) {
  const isIncluded = acc.isIncluded;

  return (
    <div
      style={{
        padding: '16px 18px',
        borderRadius: 14,
        background: isIncluded ? 'var(--bg-tertiary)' : 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${
          isIncluded
            ? acc.effectiveCategory === 'tontine'
              ? 'rgba(129, 140, 248, 0.4)'
              : acc.effectiveCategory === 'tampon'
              ? 'rgba(16, 185, 129, 0.4)'
              : 'var(--border-subtle)'
            : 'rgba(255, 255, 255, 0.08)'
        }`,
        opacity: isIncluded ? 1 : 0.65,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 6,
                background:
                  acc.effectiveCategory === 'tontine'
                    ? 'rgba(129, 140, 248, 0.15)'
                    : acc.effectiveCategory === 'tampon'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : acc.effectiveCategory === 'checking'
                    ? 'rgba(6, 182, 212, 0.15)'
                    : 'rgba(156, 163, 175, 0.15)',
                color:
                  acc.effectiveCategory === 'tontine'
                    ? '#818cf8'
                    : acc.effectiveCategory === 'tampon'
                    ? 'var(--accent-emerald)'
                    : acc.effectiveCategory === 'checking'
                    ? 'var(--accent-cyan)'
                    : 'var(--text-muted)',
              }}
            >
              {acc.effectiveCategory === 'tontine'
                ? '🤝 Tontine'
                : acc.effectiveCategory === 'tampon'
                ? '⚡ Tampon / Surplus'
                : acc.effectiveCategory === 'checking'
                ? '💳 Courant'
                : '🚫 Exclu'}
            </span>
            {acc.ibanMasked && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                IBAN {acc.ibanMasked}
              </span>
            )}
          </div>

          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 6 }}>
            {acc.customAlias}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Libellé banque : {acc.displayName}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: acc.balanceEUR < 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)',
            }}
          >
            {formatEUR(acc.balanceEUR)}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Solde direct</span>
        </div>
      </div>

      {/* Role selector and toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 10,
          borderTop: '1px solid var(--border-subtle)',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Rôle :</label>
          <select
            value={acc.effectiveCategory}
            onChange={(e) => {
              const newCat = e.target.value as any;
              onSaveBoursoConfig(acc.id, {
                category: newCat,
                included: newCat !== 'excluded',
              });
            }}
            style={{
              padding: '4px 8px',
              borderRadius: 8,
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-medium)',
              fontSize: 12,
              fontWeight: 600,
              flex: 1,
            }}
          >
            <option value="checking">💳 Compte Courant (Dépenses)</option>
            <option value="tampon">⚡ Compte Tampon (Surplus &amp; DCA)</option>
            <option value="tontine">🤝 Compte Tontine (M ou Mme)</option>
            <option value="savings">🛡️ Épargne &amp; Réserves</option>
            <option value="investment">📈 Compte Titres / Courtage</option>
            <option value="excluded">🚫 Exclure des calculs</option>
          </select>
        </div>

        <button
          onClick={() => {
            const newAlias = prompt('Renommer ce compte :', acc.customAlias);
            if (newAlias !== null && newAlias.trim()) {
              onSaveBoursoConfig(acc.id, { alias: newAlias.trim() });
            }
          }}
          className="btn btn-ghost btn-sm"
          type="button"
          style={{ fontSize: 11, padding: '4px 8px' }}
        >
          ✏️ Renommer
        </button>
      </div>
    </div>
  );
}
