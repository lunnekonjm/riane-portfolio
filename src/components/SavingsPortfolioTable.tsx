'use client';

import type { Position } from '@/types/portfolio';
import { computeSavingsPositionInterest } from '@/engines/savingsInterestEngine';

interface SavingsPortfolioTableProps {
  positions: Position[];
  onEditPosition: (position: Position) => void;
  onAddSavingsPosition: () => void;
}

export default function SavingsPortfolioTable({
  positions,
  onEditPosition,
  onAddSavingsPosition,
}: SavingsPortfolioTableProps) {
  const savingsPositions = positions.filter(
    (p) => p.envelope === 'LIVRET' || p.envelope === 'ASSURANCE_VIE' || p.envelope === 'PER' || p.envelope === 'PEE' || p.envelope === 'IMMOBILIER'
  );

  const calculations = savingsPositions.map((p) => ({
    position: p,
    interest: computeSavingsPositionInterest(p),
  }));

  const totalValue = calculations.reduce((acc, c) => acc + c.interest.currentBalance, 0);
  const totalAnnualInterest = calculations.reduce((acc, c) => acc + c.interest.projectedAnnualInterest, 0);
  const totalMonthlyDCA = savingsPositions.reduce((acc, p) => acc + (p.monthlyDCA || 0), 0);

  if (savingsPositions.length === 0) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', marginBottom: 24, border: '1px dashed var(--border-accent)' }}>
        <h3 style={{ fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>🛡️ Épargne, Livrets, PEE &amp; Patrimoine</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Ajoutez vos Livrets A, LDDS, PEE (Natixis), Assurance-Vie ou SCPI pour suivre votre patrimoine hors-bourse et calculer vos intérêts réels.
        </p>
        <button className="btn btn-primary" onClick={onAddSavingsPosition}>
          ➕ Ajouter un compte épargne / livret
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 28, borderLeft: '4px solid var(--accent-emerald)' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🛡️</span>
            <h3 style={{ fontSize: 18, margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>
              Épargne &amp; Patrimoine Hors-Bourse
            </h3>
            <span className="badge badge-emerald" style={{ fontSize: 11 }}>Règle des Quinzaines (Livrets) &amp; Plus-Value Latente</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Suivi des livrets réglementés, fonds d&apos;épargne salariale (Natixis, Amundi ESR) et assurance-vie.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onAddSavingsPosition} style={{ fontSize: 12 }}>
          ➕ Ajouter un compte épargne
        </button>
      </div>

      {/* KPI Cards Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
        <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Solde Épargne Total</span>
          <strong className="mono" style={{ fontSize: 18, color: 'var(--accent-emerald)' }}>
            {totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </strong>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Intérêts Estimés / An</span>
          <strong className="mono" style={{ fontSize: 18, color: 'var(--accent-cyan)' }}>
            +{totalAnnualInterest.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} /an
          </strong>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Épargne Mensuelle (DCA)</span>
          <strong className="mono" style={{ fontSize: 18, color: 'var(--accent-amber)' }}>
            +{totalMonthlyDCA.toLocaleString('fr-FR')} € /mois
          </strong>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
          <thead>
            <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', textTransform: 'uppercase', fontSize: 11 }}>
              <th style={{ padding: '8px 10px' }}>Compte / Actif</th>
              <th style={{ padding: '8px 10px' }}>Organisme</th>
              <th style={{ padding: '8px 10px' }}>Enveloppe</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rendement</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Solde Actuel</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Intérêts Générés</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Versements DCA</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Plafond Léguel</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {calculations.map(({ position, interest }) => {
              const envClass = position.envelope.toLowerCase();
              return (
                <tr key={position.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px' }}>
                    <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{position.name}</strong>
                    {position.dcaStartDate && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Début DCA : {position.dcaStartDate}</span>
                    )}
                  </td>
                  <td style={{ padding: '10px', color: 'var(--text-secondary)', fontSize: 12 }}>
                    {position.institutionName || '—'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span className={`envelope-tag ${envClass}`}>{position.envelope}</span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: 'var(--accent-emerald)' }}>
                    {interest.effectiveRatePercent.toFixed(2)} %
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }} className="mono">
                    {interest.currentBalance.toLocaleString('fr-FR', { style: 'currency', currency: position.currency })}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }} className="mono">
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      +{interest.interestEarnedToDate.toFixed(2)} €
                    </span>
                    <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)' }}>
                      {interest.isQuinzaineRule ? `(${interest.quinzainesCount} quinzaines)` : `(${interest.daysCount} jours)`}
                    </span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }} className="mono">
                    {position.monthlyDCA && position.monthlyDCA > 0 ? (
                      <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>+{position.monthlyDCA} €/mois</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {interest.legalCap ? (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: interest.isCapExceeded ? 'var(--accent-rose)' : 'var(--text-secondary)' }}>
                          {interest.principalDeposited.toLocaleString('fr-FR')} / {interest.legalCap.toLocaleString('fr-FR')} €
                        </div>
                        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 4, height: 4, width: 80, margin: '3px auto 0 auto', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(100, interest.capUtilizationPercent || 0)}%`,
                            height: '100%',
                            background: interest.isCapExceeded ? 'var(--accent-rose)' : 'var(--accent-emerald)'
                          }} />
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sans plafond</span>
                    )}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11, padding: '2px 6px' }}
                      onClick={() => onEditPosition(position)}
                    >
                      ✏️ Éditer
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
