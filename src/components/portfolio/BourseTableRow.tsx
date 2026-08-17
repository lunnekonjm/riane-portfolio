'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';
import AssetLogo from '@/components/AssetLogo';
import PlatformBadge from '@/components/PlatformBadge';
import { getCleanAssetName } from '@/utils/assetMetadata';
import { BourseTableDcaCell } from './BourseTableDcaCell';
import { BourseTableWeightCapCell } from './BourseTableWeightCapCell';

interface BourseTableRowProps {
  pos: Position;
  fxRates: Record<string, number>;
  totalMarketValEUR: number;
  dcaGlobalStartDate?: string;
  onEditPosition: (pos: Position) => void;
  onDeletePosition: (id: string) => void;
  onOpenTransactions: (ticker?: string) => void;
}

export function BourseTableRow({
  pos,
  fxRates,
  totalMarketValEUR,
  dcaGlobalStartDate = '2024-01-01',
  onEditPosition,
  onDeletePosition,
  onOpenTransactions,
}: BourseTableRowProps) {
  const hasFilled = pos.quantity > 0 && pos.avgPrice > 0;
  const price = pos.currentPrice || pos.avgPrice;
  const value = pos.quantity * price;
  const cost = pos.quantity * pos.avgPrice;
  const pl = value - cost;
  const plPct = cost > 0 ? (pl / cost) * 100 : 0;

  const rateToEUR = fxRates[pos.currency] || 1.0;
  const posValueEUR = pos.quantity * price * rateToEUR;
  const currentWeightPct = totalMarketValEUR > 0 ? (posValueEUR / totalMarketValEUR) * 100 : 0;

  return (
    <tr
      style={{
        cursor: 'pointer',
        borderLeft: !hasFilled ? '3px solid var(--accent-amber)' : undefined,
        opacity: hasFilled ? 1 : 0.7,
      }}
      onClick={() => onEditPosition(pos)}
    >
      <td style={{ minWidth: 170, maxWidth: 260 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AssetLogo
            ticker={pos.ticker}
            name={pos.name}
            envelope={pos.envelope}
            institutionName={pos.institutionName}
            size={32}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <strong
              style={{
                color: 'var(--text-primary)',
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.3,
                wordBreak: 'break-word',
                whiteSpace: 'normal',
              }}
              title={pos.name}
            >
              {getCleanAssetName(pos.ticker, pos.name)}
            </strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 600 }}>
                🏷️ {pos.ticker}
              </span>
              {pos.institutionName && <PlatformBadge name={pos.institutionName} />}
              {!hasFilled && (
                <span style={{ fontSize: 10, color: 'var(--accent-amber)' }}>
                  ✍️ Renseigner
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td>
        <span className={`envelope-tag ${pos.envelope.toLowerCase()}`} style={{ fontSize: 11, padding: '2px 7px' }}>
          {pos.envelope}
        </span>
      </td>
      <td className="mono" style={{ whiteSpace: 'nowrap' }}>
        <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: 13 }}>
          {pos.currentPrice ? `${pos.currentPrice.toFixed(2)} ${pos.currency === 'EUR' ? '€' : '$'}` : '—'}
        </strong>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
          PRU {pos.avgPrice > 0 ? `${pos.avgPrice.toFixed(2)} ${pos.currency === 'EUR' ? '€' : '$'}` : '—'}
        </span>
      </td>
      <td className="mono" style={{ whiteSpace: 'nowrap' }}>
        <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: 14, fontWeight: 800 }}>
          {value > 0 ? `${Math.round(value).toLocaleString('fr-FR')} ${pos.currency === 'EUR' ? '€' : '$'}` : '—'}
        </strong>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
          {pos.quantity > 0 ? `${pos.quantity} part${pos.quantity > 1 ? 's' : ''}` : '0 part'}
        </span>
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        {cost > 0 ? (
          <div
            className={`stat-change ${pl >= 0 ? 'positive' : 'negative'}`}
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '3px 8px',
              borderRadius: 6,
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}
            title={`Plus/Moins-value : ${pl >= 0 ? '+' : ''}${pl.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${pos.currency === 'EUR' ? '€' : '$'}`}
          >
            <div style={{ fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 2 }}>
              <span>{pl >= 0 ? '↑' : '↓'}</span>
              <span>{pl >= 0 ? '+' : ''}{plPct.toFixed(1)}%</span>
            </div>
            <div style={{ fontSize: 10, opacity: 0.95, fontWeight: 600, marginTop: 1 }}>
              ({pl >= 0 ? '+' : ''}{Math.round(pl).toLocaleString('fr-FR')} {pos.currency === 'EUR' ? '€' : '$'})
            </div>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </td>
      <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
        <BourseTableDcaCell pos={pos} dcaGlobalStartDate={dcaGlobalStartDate} />
      </td>
      <td style={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
        <BourseTableWeightCapCell pos={pos} currentWeightPct={currentWeightPct} />
      </td>
      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 6px', fontSize: 12 }}
            onClick={() => onOpenTransactions(pos.ticker)}
            data-tooltip={`Historique des ordres ${pos.ticker}`}
            title="Historique des ordres"
          >
            📜
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 6px', fontSize: 12 }}
            onClick={() => onEditPosition(pos)}
            data-tooltip={`Modifier ${pos.ticker}`}
            title="Modifier la position"
          >
            ✏️
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 6px', fontSize: 12, color: 'var(--accent-rose)' }}
            onClick={() => onDeletePosition(pos.id)}
            data-tooltip={`Supprimer ${pos.ticker}`}
            title="Supprimer la position"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );
}
