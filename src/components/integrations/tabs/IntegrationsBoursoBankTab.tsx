'use client';

import React from 'react';
import type { BoursoAccountConfig } from '../IntegrationsHubModal';
import { BoursoAccountCard, type ProcessedBoursoAccount } from '../bourso/BoursoAccountCard';
import { BoursoManualAssetsSection } from '../bourso/BoursoManualAssetsSection';

interface IntegrationsBoursoBankTabProps {
  connectingBourso: boolean;
  onConnectBourso: () => void;
  boursoTotalEUR: number;
  boursoCheckingEUR: number;
  boursoTamponEUR: number;
  boursoTontineEUR: number;
  processedBoursoAccounts: ProcessedBoursoAccount[];
  onSaveBoursoConfig: (accId: string, cfg: Partial<BoursoAccountConfig>) => void;
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

export function IntegrationsBoursoBankTab({
  connectingBourso,
  onConnectBourso,
  boursoTotalEUR,
  boursoCheckingEUR,
  boursoTamponEUR,
  boursoTontineEUR,
  processedBoursoAccounts,
  onSaveBoursoConfig,
  livretABalanceInput,
  setLivretABalanceInput,
  livretARateInput,
  setLivretARateInput,
  peaPmeBalanceInput,
  setPeaPmeBalanceInput,
  tontineBalanceInput,
  setTontineBalanceInput,
  livretAYearlyInterest,
  onSaveManualAssets,
  manualSavedSuccess,
  formatEUR,
}: IntegrationsBoursoBankTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          padding: '20px',
          borderRadius: 14,
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🏦</span>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              BoursoBank (Open Banking DSP2 &amp; Épargne)
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Gestion multi-comptes : <strong>Compte Courant</strong>, <strong>Compte Tampon (Surplus)</strong>, <strong>Compte Tontine</strong> et suivi <strong>Livret A / PEA-PME</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={onConnectBourso}
          disabled={connectingBourso}
          className="btn btn-primary btn-sm"
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 10,
            fontWeight: 600,
            cursor: connectingBourso ? 'wait' : 'pointer',
          }}
        >
          <span>{connectingBourso ? 'Ouverture...' : 'Re-synchroniser BoursoBank DSP2'}</span>
          <span>↗</span>
        </button>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL RETENU APPLI</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {formatEUR(boursoTotalEUR)}
          </div>
        </div>
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>COMPTE COURANT</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: boursoCheckingEUR < 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {formatEUR(boursoCheckingEUR)}
          </div>
        </div>
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>COMPTE TAMPON (SURPLUS)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {formatEUR(boursoTamponEUR)}
          </div>
        </div>
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>COMPTE TONTINE</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {formatEUR(boursoTontineEUR)}
          </div>
        </div>
      </div>

      {/* Accounts List */}
      {processedBoursoAccounts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📋</span> Comptes Bancaires Détectés ({processedBoursoAccounts.length}) :
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {processedBoursoAccounts.map((acc) => (
              <BoursoAccountCard
                key={acc.id}
                acc={acc}
                onSaveBoursoConfig={onSaveBoursoConfig}
                formatEUR={formatEUR}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Manual Livret A, PEA-PME & Tontine Indicative Section */}
      <BoursoManualAssetsSection
        livretABalanceInput={livretABalanceInput}
        setLivretABalanceInput={setLivretABalanceInput}
        livretARateInput={livretARateInput}
        setLivretARateInput={setLivretARateInput}
        peaPmeBalanceInput={peaPmeBalanceInput}
        setPeaPmeBalanceInput={setPeaPmeBalanceInput}
        tontineBalanceInput={tontineBalanceInput}
        setTontineBalanceInput={setTontineBalanceInput}
        livretAYearlyInterest={livretAYearlyInterest}
        onSaveManualAssets={onSaveManualAssets}
        manualSavedSuccess={manualSavedSuccess}
        formatEUR={formatEUR}
      />
    </div>
  );
}
