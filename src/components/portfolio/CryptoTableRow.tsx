'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';
import AssetLogo from '@/components/AssetLogo';
import PlatformBadge from '@/components/PlatformBadge';
import { getActiveDCATranche } from '@/utils/dcaHistoryHelper';
import { cleanWalletProviderName } from '@/utils/cryptoWalletEngine';

interface CryptoTableRowProps {
  pos: Position;
  totalNetWorthEUR: number;
  onEditPosition: (pos: Position) => void;
  onDeletePosition: (id: string) => void;
  onOpenLotModal: (pos: Position) => void;
}

export function CryptoTableRow({
  pos,
  totalNetWorthEUR,
  onEditPosition,
  onDeletePosition,
  onOpenLotModal,
}: CryptoTableRowProps) {
  const price = pos.currentPrice || pos.avgPrice;
  const value = pos.quantity * price;
  const cost = (pos.quantity * pos.avgPrice) + (pos.totalFeesEUR || 0);
  const pl = value - cost;
  const plPct = cost > 0 ? (pl / cost) * 100 : 0;
  const assetWeightPct = totalNetWorthEUR > 0 ? (value / totalNetWorthEUR) * 100 : 0;

  const activeCryptoTranche = pos.dcaHistory && pos.dcaHistory.length > 0
    ? getActiveDCATranche(pos.dcaHistory)
    : null;
  const effectiveMonthlyDCA = activeCryptoTranche ? activeCryptoTranche.amount : (pos.monthlyDCA || (pos.annualBudget ? Math.round(pos.annualBudget / 12) : 0));
  const hasActiveDCA = Boolean((effectiveMonthlyDCA && effectiveMonthlyDCA > 0) || (pos.dcaHistory && pos.dcaHistory.length > 0));

  const walletBadges = (() => {
    const seen = new Set<string>();
    const list: string[] = [];
    if (pos.institutionName) {
      const raw = cleanWalletProviderName(pos.institutionName);
      if (raw && !seen.has(raw.toLowerCase())) {
        seen.add(raw.toLowerCase());
        list.push(raw);
      }
    }
    if (pos.cryptoWallets && pos.cryptoWallets.length > 0) {
      pos.cryptoWallets.forEach((w) => {
        const raw = cleanWalletProviderName(w.institution || w.walletName);
        if (raw && !seen.has(raw.toLowerCase())) {
          seen.add(raw.toLowerCase());
          list.push(raw);
        }
      });
    }
    return list;
  })();

  const maxLimit = typeof pos.maxWeight === 'number' && pos.maxWeight > 0 ? pos.maxWeight * 100 : null;
  const isOver = maxLimit !== null ? assetWeightPct > maxLimit : false;
  const barMax = maxLimit || 100;
  const barFill = Math.min(100, (assetWeightPct / barMax) * 100);

  return (
    <tr style={{ cursor: 'pointer' }} onClick={() => onEditPosition(pos)}>
      <td style={{ minWidth: 180, maxWidth: 280 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AssetLogo
            ticker={pos.ticker}
            name={pos.name}
            envelope="CRYPTO"
            institutionName={pos.institutionName}
            size={32}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <strong
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={pos.name}
            >
              {pos.name}
            </strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent-cyan)', fontWeight: 600 }}>
                🏷️ {pos.ticker}
              </span>
              {walletBadges.map((badge, idx) => (
                <PlatformBadge key={idx} name={badge} />
              ))}
            </div>
          </div>
        </div>
      </td>

      <td>
        <span className="envelope-tag crypto" style={{ fontSize: 11, padding: '2px 7px' }}>
          CRYPTO
        </span>
      </td>

      <td className="mono" style={{ whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <strong style={{ color: 'var(--text-primary)', fontSize: 13 }}>
            {price > 0 ? `${price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: price < 1 ? 4 : 2 })} €` : '—'}
          </strong>
          <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', fontWeight: 700 }}>
            Live
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', marginTop: 1 }}>
          PRU {pos.avgPrice > 0 ? `${pos.avgPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: pos.avgPrice < 1 ? 4 : 2 })} €` : '—'}
        </span>
      </td>

      <td className="mono" style={{ whiteSpace: 'nowrap' }}>
        <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: 14, fontWeight: 800 }}>
          {value > 0 ? `${value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}` : '—'}
        </strong>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
          {pos.quantity.toLocaleString('fr-FR', { maximumFractionDigits: 8 })} {pos.ticker.replace('-EUR', '').replace('-USD', '')}
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
            title={`Plus/Moins-value brute : ${pl >= 0 ? '+' : ''}${pl.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
          >
            <div style={{ fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 2 }}>
              <span>{pl >= 0 ? '↑' : '↓'}</span>
              <span>{pl >= 0 ? '+' : ''}{plPct.toFixed(1)}%</span>
            </div>
            <div style={{ fontSize: 10, opacity: 0.95, fontWeight: 600, marginTop: 1 }}>
              ({pl >= 0 ? '+' : ''}{pl.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €)
            </div>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </td>

      <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
        {hasActiveDCA ? (
          <div>
            <span style={{ color: 'var(--accent-amber)', fontWeight: 700, fontSize: 13 }}>
              +{effectiveMonthlyDCA.toLocaleString('fr-FR')} €/m
            </span>
            {activeCryptoTranche?.startDate && (
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', fontFamily: 'var(--font-sans)' }}>
                depuis {activeCryptoTranche.startDate}
              </span>
            )}
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </td>

      <td style={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 44, height: 5, borderRadius: 3, background: 'var(--border-subtle)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${barFill}%`,
                height: '100%',
                background: isOver ? '#ef4444' : maxLimit ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                borderRadius: 3,
              }}
            />
          </div>
          <div>
            <strong className="mono" style={{ fontSize: 11, color: 'var(--text-primary)', display: 'block' }}>
              {assetWeightPct.toFixed(1)}%{' '}
              <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
                {maxLimit !== null ? `/ ${maxLimit.toFixed(0)}% max` : '(sans plafond)'}
              </span>
            </strong>
            <span style={{ fontSize: 9, color: isOver ? '#f87171' : 'var(--accent-emerald)', fontWeight: 600 }}>
              {isOver ? '⚠️ Élevé' : '✔ OK'}
            </span>
          </div>
        </div>
      </td>

      <td onClick={(e) => e.stopPropagation()} style={{ width: 90, textAlign: 'center' }}>
        <div className="row-actions" style={{ justifyContent: 'center' }}>
          <button
            type="button"
            className="row-action-btn"
            onClick={() => onOpenLotModal(pos)}
            data-tooltip="Gérer les poches &amp; wallets (Revolut X, Trust Wallet, Ledger)"
            style={{ fontSize: 12, padding: '3px 6px', fontWeight: 700, color: 'var(--accent-amber)' }}
          >
            + Lot
          </button>
          <button
            type="button"
            className="row-action-btn"
            onClick={() => onEditPosition(pos)}
            data-tooltip="Éditer la position crypto (Quantité, PRU, DCA)"
          >
            ✏️
          </button>
          <button
            type="button"
            className="row-action-btn danger"
            onClick={() => {
              if (confirm(`Supprimer la crypto ${pos.name} (${pos.ticker}) ?`)) {
                onDeletePosition(pos.id);
              }
            }}
            data-tooltip="Supprimer cette ligne du portefeuille"
          >
            🗑
          </button>
        </div>
      </td>
    </tr>
  );
}
