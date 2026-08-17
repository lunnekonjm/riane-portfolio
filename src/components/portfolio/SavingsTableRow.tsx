'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';
import type { SavingsInterestResult } from '@/engines/savingsInterestEngine';
import AssetLogo from '@/components/AssetLogo';
import PlatformBadge from '@/components/PlatformBadge';
import { getActiveDCATranche } from '@/utils/dcaHistoryHelper';

interface SavingsTableRowProps {
  position: Position;
  interest: SavingsInterestResult;
  onEditPosition: (pos: Position) => void;
  onDeletePosition?: (id: string) => void;
}

export function SavingsTableRow({
  position,
  interest,
  onEditPosition,
  onDeletePosition,
}: SavingsTableRowProps) {
  const envClass = position.envelope.toLowerCase();
  const activeTranche = position.dcaHistory && position.dcaHistory.length > 0
    ? getActiveDCATranche(position.dcaHistory)
    : null;
  const effectiveMonthlyDCA = activeTranche ? activeTranche.amount : (position.monthlyDCA || (position.annualBudget ? Math.round(position.annualBudget / 12) : 0));
  const hasActiveDCA = Boolean((effectiveMonthlyDCA && effectiveMonthlyDCA > 0) || (position.dcaHistory && position.dcaHistory.length > 0));
  const depositsCount = position.depositsHistory?.length || 0;
  const totalAdhocDeposits = position.depositsHistory?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

  return (
    <tr style={{ cursor: 'pointer' }} onClick={() => onEditPosition(position)}>
      <td style={{ minWidth: 170, maxWidth: 260 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AssetLogo
            name={position.name}
            envelope={position.envelope}
            institutionName={position.institutionName}
            size={32}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: 13, fontWeight: 700, lineHeight: 1.3, wordBreak: 'break-word', whiteSpace: 'normal' }} title={position.name}>
              {position.name}
            </strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
              {position.institutionName && (
                <PlatformBadge name={position.institutionName} />
              )}
              {depositsCount > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--accent-cyan)',
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    padding: '1px 5px',
                    borderRadius: 4,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  📥 {depositsCount} vers.
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td>
        <span className={`envelope-tag ${envClass}`} style={{ fontSize: 11, padding: '2px 7px' }}>{position.envelope}</span>
      </td>
      <td style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontSize: 13 }}>
        {interest.effectiveRatePercent.toFixed(2)} %
      </td>
      <td style={{ fontWeight: 800, fontSize: 14 }} className="mono">
        {interest.currentBalance.toLocaleString('fr-FR', { style: 'currency', currency: position.currency })}
      </td>
      {/* 📊 Intérêts Générés */}
      <td style={{ whiteSpace: 'nowrap' }}>
        <div
          style={{
            background: 'rgba(6, 182, 212, 0.12)',
            color: 'var(--accent-cyan)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '3px 8px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
            lineHeight: 1.2,
          }}
          title={`Intérêts acquis : +${interest.interestEarnedToDate.toFixed(2)} €`}
        >
          <div style={{ fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 2 }}>
            <span>↑</span>
            <span>+{interest.interestEarnedToDate.toFixed(2)} €</span>
          </div>
          <div style={{ fontSize: 10, opacity: 0.95, fontWeight: 600, marginTop: 1 }}>
            {interest.isQuinzaineRule ? `(${interest.quinzainesCount} qz.)` : `(${interest.daysCount} j.)`}
          </div>
        </div>
      </td>
      {/* 🔄 DCA Column */}
      <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
        {hasActiveDCA ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--accent-amber)', fontWeight: 700, fontSize: 13 }}>
                +{effectiveMonthlyDCA.toLocaleString('fr-FR')} €/m
              </span>
              {position.dcaHistory && position.dcaHistory.length > 1 && (
                <span
                  style={{
                    fontSize: 9,
                    padding: '1px 4px',
                    borderRadius: 4,
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: 'var(--accent-cyan)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    fontWeight: 700,
                  }}
                >
                  {position.dcaHistory.length} pal.
                </span>
              )}
            </div>
            {(activeTranche?.startDate || position.dcaStartDate) && (
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1, display: 'block', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
                depuis {activeTranche?.startDate || position.dcaStartDate}
              </span>
            )}
            {totalAdhocDeposits > 0 && (
              <span style={{ fontSize: 10, color: 'var(--accent-cyan)', marginTop: 1, display: 'block', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
                +{totalAdhocDeposits.toLocaleString('fr-FR')} € libre
              </span>
            )}
          </div>
        ) : depositsCount > 0 ? (
          <div>
            <span style={{ color: 'var(--accent-cyan)', fontSize: 12, fontWeight: 700, display: 'block' }}>
              Libres ({totalAdhocDeposits.toLocaleString('fr-FR')} €)
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'block', fontFamily: 'var(--font-sans)' }}>
              {depositsCount} apport{depositsCount > 1 ? 's' : ''}
            </span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </td>
      {/* 🛡️ Plafond Légal */}
      <td style={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
        {interest.legalCap ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 105, maxWidth: 115 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              <strong style={{ color: interest.isCapExceeded ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                {Math.round(interest.principalDeposited).toLocaleString('fr-FR')} €
              </strong>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                /{Math.round(interest.legalCap / 1000)}k€
              </span>
            </div>

            <div style={{ height: 4, width: '100%', background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, interest.capUtilizationPercent || 0)}%`,
                  background: interest.isCapExceeded
                    ? 'var(--accent-rose)'
                    : (interest.capUtilizationPercent || 0) >= 85
                    ? 'var(--accent-amber)'
                    : 'var(--accent-emerald)',
                  borderRadius: 2,
                }}
              />
            </div>

            <div>
              {interest.isCapExceeded ? (
                <span
                  className="badge badge-rose"
                  style={{ fontSize: 10, padding: '1px 5px', fontWeight: 700 }}
                  title="Plafond légal de versement atteint ou dépassé"
                >
                  ⚠️ Plafond ({interest.capUtilizationPercent}%)
                </span>
              ) : (interest.capUtilizationPercent || 0) >= 85 ? (
                <span
                  className="badge badge-amber"
                  style={{ fontSize: 10, padding: '1px 5px', fontWeight: 700 }}
                  title={`Proche du plafond max : ${interest.capUtilizationPercent}% consommé`}
                >
                  ⚡ {interest.capUtilizationPercent}%
                </span>
              ) : (
                <span
                  className="badge badge-emerald"
                  style={{ fontSize: 10, padding: '1px 5px', fontWeight: 700 }}
                  title={`Niveau de versement normal : ${interest.capUtilizationPercent}% du plafond`}
                >
                  ✓ OK ({interest.capUtilizationPercent}%)
                </span>
              )}
            </div>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sans plafond</span>
        )}
      </td>
      {/* Actions Column */}
      <td onClick={(e) => e.stopPropagation()} style={{ width: 64, textAlign: 'center' }}>
        <div className="row-actions" style={{ justifyContent: 'center' }}>
          <button
            className="row-action-btn"
            onClick={() => onEditPosition(position)}
            data-tooltip="Éditer le compte (Versements, DCA, Taux)"
          >
            ✏️
          </button>
          {onDeletePosition && (
            <button
              className="row-action-btn danger"
              onClick={() => {
                if (confirm(`Supprimer le compte ${position.name} ?`)) {
                  onDeletePosition(position.id);
                }
              }}
              data-tooltip="Supprimer ce compte"
            >
              🗑
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
