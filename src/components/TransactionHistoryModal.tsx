'use client';

import { useState } from 'react';
import type { TransactionRecord } from '@/types/portfolio';

interface TransactionHistoryModalProps {
  transactions: TransactionRecord[];
  initialTicker?: string;
  onClose: () => void;
}

export default function TransactionHistoryModal({
  transactions,
  initialTicker,
  onClose,
}: TransactionHistoryModalProps) {
  const [filterTicker, setFilterTicker] = useState<string>(initialTicker || '');
  const [filterType, setFilterType] = useState<string>('ALL');

  const filtered = transactions.filter((t) => {
    const matchesTicker = filterTicker
      ? t.ticker.toLowerCase().includes(filterTicker.toLowerCase()) ||
        t.name.toLowerCase().includes(filterTicker.toLowerCase())
      : true;
    const matchesType = filterType === 'ALL' ? true : t.type === filterType;
    return matchesTicker && matchesType;
  });

  const exportCSV = () => {
    const headers = ['Date', 'Ticker', 'Nom', 'Type', 'Variation Parts', 'Prix', 'Montant Total', 'Devise', 'Motif'];
    const rows = filtered.map((t) => [
      `"${t.date}"`,
      `"${t.ticker}"`,
      `"${t.name}"`,
      `"${t.type}"`,
      t.sharesDelta,
      t.price,
      t.totalAmount,
      `"${t.currency}"`,
      `"${t.reason.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique_arbitrages_riane_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 900, width: '92vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title">📜 Historique des Arbitrages & Ajustements Ponctuels</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              Journal d&apos;audit complet de vos rééquilibrages, achats/ventes recommandés et ajustements DCA.
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {/* Toolbar & Filters */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 20px 8px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)' }}>
          <input
            type="text"
            className="input"
            style={{ width: 220, fontSize: 13 }}
            placeholder="🔍 Filtrer par Ticker (ex: COHR, PUST)..."
            value={filterTicker}
            onChange={(e) => setFilterTicker(e.target.value)}
          />

          <select
            className="select"
            style={{ width: 180, fontSize: 13 }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">Tous les types d&apos;opérations</option>
            <option value="REBALANCE">🎯 Rééquilibrages</option>
            <option value="CTA_ALERT">🛡️ Recommandations d&apos;Alertes</option>
            <option value="BUY">🟢 Achats</option>
            <option value="SELL">🔴 Ventes</option>
            <option value="DCA_AUTO">⚡ Simulations DCA</option>
            <option value="MANUAL_EDIT">✏️ Éditions Manuelles</option>
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={exportCSV} disabled={filtered.length === 0}>
              📥 Exporter CSV ({filtered.length})
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📜</div>
              <p style={{ margin: 0, fontSize: 14 }}>Aucun historique d&apos;ajustement enregistré pour le moment.</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Chaque rééquilibrage ou recommandation validée créera un enregistrement ici.</p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-medium)', background: 'var(--bg-tertiary)' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-secondary)' }} data-tooltip="Date et heure de l'opération">Date</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-secondary)' }} data-tooltip="Actif et ticker concerné">Actif</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-secondary)' }} data-tooltip="Nature de l'opération (Achat, Vente, Rééquilibrage)">Type d&apos;Opération</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-secondary)' }} data-tooltip="Nombre de parts ajoutées ou retirées">Variation</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-secondary)' }} data-tooltip="Prix unitaire de l'actif lors de l'opération">Prix U.</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-secondary)' }} data-tooltip="Montant financier total engagé (€/$)">Montant Total</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, color: 'var(--text-secondary)', minWidth: 200 }} data-tooltip="Contexte et justification de la recommandation">Motif & Contexte</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx) => {
                    const isPositive = tx.sharesDelta >= 0;
                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td className="mono" style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {tx.date}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{tx.name}</div>
                          <span className="badge badge-secondary mono" style={{ fontSize: 10 }}>{tx.ticker}</span>
                        </td>
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          {tx.type === 'REBALANCE' && <span className="badge badge-primary">🎯 Rééquilibrage</span>}
                          {tx.type === 'CTA_ALERT' && <span className="badge badge-warning">🛡️ Alerte CTA</span>}
                          {tx.type === 'BUY' && <span className="badge badge-success">🟢 Achat</span>}
                          {tx.type === 'SELL' && <span className="badge badge-danger">🔴 Vente</span>}
                          {tx.type === 'DCA_AUTO' && <span className="badge badge-info">⚡ DCA Auto</span>}
                          {tx.type === 'MANUAL_EDIT' && <span className="badge badge-secondary">✏️ Édition</span>}
                        </td>
                        <td className="mono" style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: isPositive ? 'var(--accent-emerald)' : 'var(--accent-rose)', whiteSpace: 'nowrap' }}>
                          {isPositive ? `+${tx.sharesDelta}` : tx.sharesDelta} part{Math.abs(tx.sharesDelta) > 1 ? 's' : ''}
                        </td>
                        <td className="mono" style={{ padding: '12px 14px', textAlign: 'right', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {tx.price.toFixed(2)} {tx.currency === 'USD' ? '$' : tx.currency === 'GBP' ? '£' : '€'}
                        </td>
                        <td className="mono" style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                          {tx.totalAmount.toFixed(2)} {tx.currency === 'USD' ? '$' : tx.currency === 'GBP' ? '£' : '€'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 280 }}>
                          {tx.reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Total : {filtered.length} opération{filtered.length > 1 ? 's' : ''} enregistrée{filtered.length > 1 ? 's' : ''}
          </span>
          <button className="btn btn-secondary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
