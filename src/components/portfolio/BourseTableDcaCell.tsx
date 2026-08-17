'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';
import { getActiveDCATranche } from '@/utils/dcaHistoryHelper';

interface BourseTableDcaCellProps {
  pos: Position;
  dcaGlobalStartDate?: string;
}

export function BourseTableDcaCell({ pos, dcaGlobalStartDate = '2024-01-01' }: BourseTableDcaCellProps) {
  const activeMarketTranche =
    pos.dcaHistory && pos.dcaHistory.length > 0 ? getActiveDCATranche(pos.dcaHistory) : null;
  const effectiveMarketMonthlyDCA = activeMarketTranche
    ? activeMarketTranche.amount
    : pos.monthlyDCA || (pos.annualBudget ? Math.round(pos.annualBudget / 12) : 0);
  const hasMarketActiveDCA = Boolean(
    (effectiveMarketMonthlyDCA && effectiveMarketMonthlyDCA > 0) ||
      (pos.annualBudget && pos.annualBudget > 0) ||
      (pos.dcaHistory && pos.dcaHistory.length > 0)
  );
  const marketDepositsCount = pos.depositsHistory?.length || 0;
  const totalMarketAdhocDeposits = pos.depositsHistory?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

  if (hasMarketActiveDCA) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: 'var(--accent-amber)', fontWeight: 700, fontSize: 13 }}>
            +{pos.dcaFrequency === 'annual' || (!pos.monthlyDCA && pos.annualBudget)
              ? `${(pos.annualBudget || (effectiveMarketMonthlyDCA ? effectiveMarketMonthlyDCA * 12 : 0)).toLocaleString('fr-FR')} €/an`
              : pos.dcaFrequency === 'quarterly'
              ? `${(effectiveMarketMonthlyDCA ? effectiveMarketMonthlyDCA * 3 : 0).toLocaleString('fr-FR')} €/trim`
              : pos.dcaFrequency === 'semestrial'
              ? `${(effectiveMarketMonthlyDCA ? effectiveMarketMonthlyDCA * 6 : 0).toLocaleString('fr-FR')} €/sem`
              : `${(effectiveMarketMonthlyDCA || 0).toLocaleString('fr-FR')} €/m`}
          </span>
          {pos.dcaHistory && pos.dcaHistory.length > 1 && (
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
              {pos.dcaHistory.length} pal.
            </span>
          )}
        </div>
        {(activeMarketTranche?.startDate || pos.dcaStartDate || dcaGlobalStartDate) && (
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1, display: 'block', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
            depuis {activeMarketTranche?.startDate || pos.dcaStartDate || dcaGlobalStartDate}
          </span>
        )}
        {totalMarketAdhocDeposits > 0 && (
          <span style={{ fontSize: 10, color: 'var(--accent-cyan)', marginTop: 1, display: 'block', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
            +{totalMarketAdhocDeposits.toLocaleString('fr-FR')} € apport
          </span>
        )}
      </div>
    );
  }

  if (marketDepositsCount > 0) {
    return (
      <div>
        <span style={{ color: 'var(--accent-cyan)', fontSize: 12, fontWeight: 700, display: 'block' }}>
          Apports ({totalMarketAdhocDeposits.toLocaleString('fr-FR')} €)
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'block', fontFamily: 'var(--font-sans)' }}>
          {marketDepositsCount} versement{marketDepositsCount > 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  return <span style={{ color: 'var(--text-muted)' }}>—</span>;
}
