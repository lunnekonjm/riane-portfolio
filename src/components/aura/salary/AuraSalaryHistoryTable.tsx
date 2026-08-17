'use client';

import React from 'react';
import type { SalaryRecord } from '@/types/revenue';
import { formatSalaryPeriodLabel } from '@/engines/salaryAnalyticsEngine';

interface AuraSalaryHistoryTableProps {
  records: SalaryRecord[];
  onDeleteRecord: (id: string) => Promise<void>;
  onOpenUpload: () => void;
}

export function AuraSalaryHistoryTable({
  records,
  onDeleteRecord,
  onOpenUpload,
}: AuraSalaryHistoryTableProps) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ fontSize: 15, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
          📋 Historique Exhaustif des Bulletins de Salaire ({records.length})
        </h4>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenUpload}>
          ➕ Importer un autre bulletin
        </button>
      </div>

      {records.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: 10 }}>
          Aucun bulletin de paie enregistré.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
          <table className="table" style={{ width: '100%', margin: 0 }}>
            <thead>
              <tr>
                <th>Période</th>
                <th>Employeur</th>
                <th>Net à Payer</th>
                <th>Brut</th>
                <th>Primes</th>
                <th>Taux PAS</th>
                <th>Investi PEA</th>
                <th style={{ width: 60 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.periodLabel || formatSalaryPeriodLabel(r.period)}</strong></td>
                  <td>{r.employerName || 'Tech Solutions'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                    +{r.netSalary.toLocaleString('fr-FR')} €
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {r.grossSalary ? `${r.grossSalary.toLocaleString('fr-FR')} €` : '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: r.bonusAmount ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                    {r.bonusAmount ? `+${r.bonusAmount.toLocaleString('fr-FR')} €` : '0 €'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#818cf8' }}>
                    {r.incomeTaxRatePercent ? `${r.incomeTaxRatePercent}%` : '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    {r.regularInvestableAmount ? `${r.regularInvestableAmount.toLocaleString('fr-FR')} €` : '—'}
                  </td>
                  <td>
                    <button type="button" className="btn-ghost" onClick={() => onDeleteRecord(r.id)} title="Supprimer">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
