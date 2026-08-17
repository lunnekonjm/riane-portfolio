'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';

interface WealthBreakdownCardsProps {
  boursePos: Position[];
  cryptoPos: Position[];
  savingsPos: Position[];
  displayBourseVal: number;
  displayBourseCostVal: number;
  displayBourseGain: number;
  displayBourseGainPct: number;
  bourseDCAVal: number;
  displayCryptoVal: number;
  displayCryptoCostVal: number;
  displayCryptoGain: number;
  displayCryptoGainPct: number;
  cryptoDCAVal: number;
  displaySavingsVal: number;
  displaySavingsCostVal: number;
  displaySavingsGain: number;
  displaySavingsAnnualInt: number;
  savingsDCAVal: number;
}

export default function WealthBreakdownCards({
  boursePos,
  cryptoPos,
  savingsPos,
  displayBourseVal,
  displayBourseCostVal,
  displayBourseGain,
  displayBourseGainPct,
  bourseDCAVal,
  displayCryptoVal,
  displayCryptoCostVal,
  displayCryptoGain,
  displayCryptoGainPct,
  cryptoDCAVal,
  displaySavingsVal,
  displaySavingsCostVal,
  displaySavingsGain,
  displaySavingsAnnualInt,
  savingsDCAVal,
}: WealthBreakdownCardsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginTop: 14, marginBottom: 18 }}>
      {/* 1. Actions & ETF */}
      <div className="card" style={{ borderLeft: '4px solid var(--accent-cyan)', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)', padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            <span style={{ fontSize: 18 }}>📈</span>
            <strong className="text-sm font-bold text-primary" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Actions &amp; ETF
            </strong>
          </div>
          <span
            className="badge text-xs font-semibold text-primary"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '2px 8px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              borderRadius: 12,
            }}
          >
            {boursePos.length} position{boursePos.length > 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '4px 0 10px 0', gap: 8 }}>
          <span className="mono font-extrabold text-2xl" style={{ color: 'var(--accent-cyan)', whiteSpace: 'nowrap' }}>
            {displayBourseVal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </span>
          {displayBourseCostVal > 0 ? (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="text-sm font-bold" style={{ color: displayBourseGain >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', whiteSpace: 'nowrap' }}>
                {displayBourseGain >= 0 ? '+' : ''}{displayBourseGain.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </div>
              <div className="text-xs font-bold" style={{ color: displayBourseGain >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', whiteSpace: 'nowrap' }}>
                {displayBourseGainPct >= 0 ? '↑' : '↓'} {Math.abs(displayBourseGainPct).toFixed(2)} %
              </div>
            </div>
          ) : (
            <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>PEA, PEA-PME, CTO</span>
          )}
        </div>
        <div className="card-footer-stats" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, borderTop: '1px dashed var(--border-subtle)', paddingTop: 10, marginTop: 10, gap: 6, flexWrap: 'wrap' }}>
          <span style={{ whiteSpace: 'nowrap' }}>Coût PRU : <strong className="text-primary">{displayBourseCostVal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</strong></span>
          <span style={{ whiteSpace: 'nowrap' }}>DCA : <strong className="text-primary">{bourseDCAVal.toLocaleString('fr-FR')} €/mois</strong></span>
        </div>
      </div>

      {/* 2. Cryptomonnaies */}
      <div className="card" style={{ borderLeft: '4px solid var(--accent-amber)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)', padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            <span style={{ fontSize: 18 }}>🪙</span>
            <strong className="text-sm font-bold text-primary" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Cryptomonnaies
            </strong>
          </div>
          <span
            className="badge text-xs font-semibold text-primary"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '2px 8px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              borderRadius: 12,
            }}
          >
            {cryptoPos.length} position{cryptoPos.length > 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '4px 0 10px 0', gap: 8 }}>
          <span className="mono font-extrabold text-2xl" style={{ color: 'var(--accent-amber)', whiteSpace: 'nowrap' }}>
            {displayCryptoVal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </span>
          {displayCryptoCostVal > 0 ? (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="text-sm font-bold" style={{ color: displayCryptoGain >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', whiteSpace: 'nowrap' }}>
                {displayCryptoGain >= 0 ? '+' : ''}{displayCryptoGain.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </div>
              <div className="text-xs font-bold" style={{ color: displayCryptoGain >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', whiteSpace: 'nowrap' }}>
                {displayCryptoGainPct >= 0 ? '↑' : '↓'} {Math.abs(displayCryptoGainPct).toFixed(2)} %
              </div>
            </div>
          ) : (
            <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>Wallets &amp; CEX</span>
          )}
        </div>
        <div className="card-footer-stats" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, borderTop: '1px dashed var(--border-subtle)', paddingTop: 10, marginTop: 10, gap: 6, flexWrap: 'wrap' }}>
          <span style={{ whiteSpace: 'nowrap' }}>Coût PRU : <strong className="text-primary">{displayCryptoCostVal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</strong></span>
          <span style={{ whiteSpace: 'nowrap' }}>DCA : <strong className="text-primary">{cryptoDCAVal.toLocaleString('fr-FR')} €/mois</strong></span>
        </div>
      </div>

      {/* 3. Épargne */}
      <div className="card" style={{ borderLeft: '4px solid var(--accent-emerald)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)', padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            <span style={{ fontSize: 18 }}>🛡️</span>
            <strong className="text-sm font-bold text-primary" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Épargne
            </strong>
          </div>
          <span
            className="badge text-xs font-semibold text-primary"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '2px 8px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              borderRadius: 12,
            }}
          >
            {savingsPos.length} compte{savingsPos.length > 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '4px 0 10px 0' }}>
          <span className="mono font-extrabold text-2xl" style={{ color: 'var(--accent-emerald)', whiteSpace: 'nowrap' }}>
            {displaySavingsVal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 6 }}>
          <span className="text-xs text-secondary font-medium" style={{ whiteSpace: 'nowrap' }}>Intérêts acquis</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span className="badge-real" style={{ padding: '1px 6px', fontSize: 10 }}>
              <span className="dot" style={{ width: 5, height: 5 }}></span> RÉEL
            </span>
            <strong className="text-sm font-bold" style={{ color: 'var(--accent-emerald)', whiteSpace: 'nowrap' }}>+{displaySavingsGain.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, gap: 6 }}>
          <span className="text-xs text-secondary font-medium" data-tooltip="Estimation des intérêts annuels perçus si les soldes actuels sont conservés sur 12 mois" style={{ whiteSpace: 'nowrap' }}>
            Projection 12m
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span className="badge-projected" style={{ padding: '1px 6px', fontSize: 10 }}>
              <span className="dot" style={{ width: 5, height: 5 }}></span> PROJETÉ
            </span>
            <strong className="text-sm font-bold" style={{ color: 'var(--accent-purple, #a855f7)', whiteSpace: 'nowrap' }}>+{displaySavingsAnnualInt.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
          </div>
        </div>
        
        <div className="card-footer-stats" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, borderTop: '1px dashed var(--border-subtle)', paddingTop: 10, marginTop: 10, gap: 6, flexWrap: 'wrap' }}>
          <span style={{ whiteSpace: 'nowrap' }}>Apports : <strong className="text-primary">{displaySavingsCostVal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</strong></span>
          <span style={{ whiteSpace: 'nowrap' }}>DCA : <strong className="text-primary">{savingsDCAVal.toLocaleString('fr-FR')} €/mois</strong></span>
        </div>
      </div>
    </div>
  );
}
