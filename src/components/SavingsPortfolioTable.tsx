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
        <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8, fontWeight: 700 }}>🛡️ Épargne, Livrets, PEE &amp; Patrimoine</h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 18 }}>
          Ajoutez vos Livrets A, LDDS, PEE (Natixis), Assurance-Vie ou SCPI pour suivre votre patrimoine hors-bourse et calculer vos intérêts réels.
        </p>
        <button className="btn btn-primary" onClick={onAddSavingsPosition} style={{ fontSize: 14 }}>
          ➕ Ajouter un compte épargne / livret
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 28, borderLeft: '4px solid var(--accent-emerald)', padding: 18 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 24 }}>🛡️</span>
            <h3 style={{ fontSize: 18, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
              Épargne &amp; Patrimoine Hors-Bourse
            </h3>
            <span className="badge badge-emerald" style={{ fontSize: 12, padding: '4px 10px', fontWeight: 600 }}>Règle des Quinzaines &amp; Plus-Value Latente</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
            Suivi des livrets réglementés (Art. R221-3 CMF), fonds d&apos;épargne salariale et assurance-vie.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onAddSavingsPosition} style={{ fontSize: 13, padding: '8px 14px' }}>
          ➕ Ajouter un compte épargne
        </button>
      </div>

      {/* KPI Cards Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 18 }}>
        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>Solde Épargne Total</span>
          <strong className="mono" style={{ fontSize: 20, color: 'var(--accent-emerald)', fontWeight: 800, marginTop: 4, display: 'block' }}>
            {totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </strong>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>Intérêts Estimés / An</span>
          <strong className="mono" style={{ fontSize: 20, color: 'var(--accent-cyan)', fontWeight: 800, marginTop: 4, display: 'block' }}>
            +{totalAnnualInterest.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} /an
          </strong>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.4px' }}>Épargne Mensuelle (DCA)</span>
          <strong className="mono" style={{ fontSize: 20, color: 'var(--accent-amber)', fontWeight: 800, marginTop: 4, display: 'block' }}>
            +{totalMonthlyDCA.toLocaleString('fr-FR')} € /mois
          </strong>
        </div>
      </div>

      {/* Table with Touch Responsive Scrolling */}
      <div className="table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, textAlign: 'left', minWidth: 700 }}>
          <thead>
            <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-medium)', textTransform: 'uppercase', fontSize: 12, fontWeight: 700, letterSpacing: '0.5px' }}>
              <th style={{ padding: '10px 12px' }}>Compte / Actif</th>
              <th style={{ padding: '10px 12px' }}>Organisme</th>
              <th style={{ padding: '10px 12px' }}>Enveloppe</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Rendement</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Solde Actuel</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Intérêts Générés</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Versements DCA</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Plafond Légal</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {calculations.map(({ position, interest }) => {
              const envClass = position.envelope.toLowerCase();
              const hasActiveDCA = Boolean((position.monthlyDCA && position.monthlyDCA > 0) || (position.annualBudget && position.annualBudget > 0));
              const depositsCount = position.depositsHistory?.length || 0;
              const totalAdhocDeposits = position.depositsHistory?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

              return (
                <tr key={position.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}>
                  <td style={{ padding: '12px' }}>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: 14 }}>{position.name}</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 3 }}>
                      {hasActiveDCA && position.dcaStartDate && (
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <span>🔄</span> DCA depuis le {position.dcaStartDate}
                        </span>
                      )}
                      {depositsCount > 0 && (
                        <span style={{
                          fontSize: 11,
                          color: 'var(--accent-cyan)',
                          background: 'rgba(6, 182, 212, 0.1)',
                          border: '1px solid rgba(6, 182, 212, 0.25)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                        }}>
                          📥 {depositsCount} versement{depositsCount > 1 ? 's' : ''} libre{depositsCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: 13 }}>
                    {position.institutionName || '—'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span className={`envelope-tag ${envClass}`} style={{ fontSize: 12, padding: '3px 8px' }}>{position.envelope}</span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-emerald)', fontSize: 14 }}>
                    {interest.effectiveRatePercent.toFixed(2)} %
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, fontSize: 15 }} className="mono">
                    {interest.currentBalance.toLocaleString('fr-FR', { style: 'currency', currency: position.currency })}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }} className="mono">
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: 14 }}>
                      +{interest.interestEarnedToDate.toFixed(2)} €
                    </span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {interest.isQuinzaineRule ? `(${interest.quinzainesCount} quinzaines)` : `(${interest.daysCount} jours)`}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }} className="mono">
                    {hasActiveDCA ? (
                      <span style={{ color: 'var(--accent-amber)', fontWeight: 700, fontSize: 14 }}>
                        +{position.monthlyDCA || (position.annualBudget ? Math.round(position.annualBudget / 12) : 0)} €/mois
                      </span>
                    ) : depositsCount > 0 ? (
                      <span style={{ color: 'var(--accent-cyan)', fontSize: 12, fontWeight: 600 }}>
                        Libres ({totalAdhocDeposits.toLocaleString('fr-FR')} €)
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {interest.legalCap ? (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: interest.isCapExceeded ? 'var(--accent-rose)' : 'var(--text-secondary)' }}>
                          {interest.principalDeposited.toLocaleString('fr-FR')} / {interest.legalCap.toLocaleString('fr-FR')} €
                        </div>
                        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 4, height: 5, width: 90, margin: '4px auto 0 auto', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(100, interest.capUtilizationPercent || 0)}%`,
                            height: '100%',
                            background: interest.isCapExceeded ? 'var(--accent-rose)' : 'var(--accent-emerald)'
                          }} />
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Sans plafond</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 12, padding: '4px 10px', fontWeight: 600 }}
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
