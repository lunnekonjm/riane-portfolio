'use client';

import { useState, useMemo } from 'react';
import type { Position } from '@/types/portfolio';
import { computeSavingsPositionInterest } from '@/engines/savingsInterestEngine';
import AssetLogo from '@/components/AssetLogo';

interface SavingsPortfolioTableProps {
  positions: Position[];
  onEditPosition: (position: Position) => void;
  onDeletePosition?: (id: string) => void;
  onAddSavingsPosition: () => void;
}

export default function SavingsPortfolioTable({
  positions,
  onEditPosition,
  onDeletePosition,
  onAddSavingsPosition,
}: SavingsPortfolioTableProps) {
  const [selectedSavingsEnvelope, setSelectedSavingsEnvelope] = useState<string>('ALL');

  const savingsPositions = useMemo(() => {
    return positions.filter(
      (p) => p.envelope === 'LIVRET' || p.envelope === 'ASSURANCE_VIE' || p.envelope === 'PER' || p.envelope === 'PEE' || p.envelope === 'IMMOBILIER'
    );
  }, [positions]);

  const calculations = useMemo(() => {
    return savingsPositions.map((p) => ({
      position: p,
      interest: computeSavingsPositionInterest(p),
    }));
  }, [savingsPositions]);

  // Filter tabs dynamically generated with exact counts
  const savingsFilterTabs = useMemo(() => {
    const tabs = [
      { id: 'ALL', label: `🌐 Tout (${savingsPositions.length})` }
    ];
    if (savingsPositions.some(p => p.envelope === 'LIVRET')) {
      const count = savingsPositions.filter(p => p.envelope === 'LIVRET').length;
      tabs.push({ id: 'LIVRET', label: `🛡️ Livrets (${count})` });
    }
    if (savingsPositions.some(p => p.envelope === 'PEE')) {
      const count = savingsPositions.filter(p => p.envelope === 'PEE').length;
      tabs.push({ id: 'PEE', label: `🏢 PEE & Salariale (${count})` });
    }
    if (savingsPositions.some(p => p.envelope === 'ASSURANCE_VIE')) {
      const count = savingsPositions.filter(p => p.envelope === 'ASSURANCE_VIE').length;
      tabs.push({ id: 'ASSURANCE_VIE', label: `📜 Assurance-Vie (${count})` });
    }
    if (savingsPositions.some(p => p.envelope === 'PER')) {
      const count = savingsPositions.filter(p => p.envelope === 'PER').length;
      tabs.push({ id: 'PER', label: `🎯 PER (${count})` });
    }
    if (savingsPositions.some(p => p.envelope === 'IMMOBILIER')) {
      const count = savingsPositions.filter(p => p.envelope === 'IMMOBILIER').length;
      tabs.push({ id: 'IMMOBILIER', label: `🏠 Immobilier (${count})` });
    }
    return tabs;
  }, [savingsPositions]);

  const filteredCalculations = useMemo(() => {
    if (selectedSavingsEnvelope === 'ALL') return calculations;
    return calculations.filter(({ position }) => position.envelope === selectedSavingsEnvelope);
  }, [calculations, selectedSavingsEnvelope]);

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
    <div className="card" style={{ marginBottom: 28, padding: 18 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 24 }}>🛡️</span>
            <h3 style={{ fontSize: 18, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
              Épargne &amp; Patrimoine Hors-Bourse ({savingsPositions.length})
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

      {/* Filter Tabs Bar (Strictement identique au tableau Bourse) */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, padding: '0 4px' }}>
        {savingsFilterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`btn ${selectedSavingsEnvelope === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 'var(--text-xs)', padding: '4px 10px', borderRadius: 20 }}
            onClick={() => setSelectedSavingsEnvelope(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table with Touch Responsive Scrolling and Shared portfolio-table Design */}
      <div className="table-responsive" style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', borderRadius: 'var(--radius-md)' }}>
        <table className="portfolio-table">
          <thead>
            <tr>
              <th><span data-tooltip="Nom complet du compte et établissement teneur">Actif</span></th>
              <th><span data-tooltip="Enveloppe fiscale (Livret, PEE, Assurance-Vie, PER, SCPI...)">Enveloppe</span></th>
              <th><span data-tooltip="Taux de rendement net ou projeté annuel">Prix / Rendement</span></th>
              <th><span data-tooltip="Solde total actuel valorisé">Valeur / Solde</span></th>
              <th><span data-tooltip="Intérêts acquis depuis l'ouverture (calcul par quinzaine ou journalier)">Gains &amp; Performance</span></th>
              <th><span data-tooltip="Budget mensuel ou annuel programmé de versement">DCA</span></th>
              <th><span data-tooltip="Utilisation du plafond légal de dépôt réglementé">Plafond &amp; Risque</span></th>
              <th style={{ width: 64, textAlign: 'center' }}><span data-tooltip="Actions rapides : Édition et Suppression">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredCalculations.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-secondary)' }}>
                  🔍 Aucun compte épargne ne correspond au filtre sélectionné.
                </td>
              </tr>
            ) : (
              filteredCalculations.map(({ position, interest }) => {
              const envClass = position.envelope.toLowerCase();
              const activeTranche = position.dcaHistory && position.dcaHistory.length > 0
                ? (position.dcaHistory.find(t => !t.endDate || t.endDate >= new Date().toISOString().split('T')[0]) || position.dcaHistory[position.dcaHistory.length - 1])
                : null;
              const effectiveMonthlyDCA = activeTranche ? activeTranche.amount : (position.monthlyDCA || (position.annualBudget ? Math.round(position.annualBudget / 12) : 0));
              const hasActiveDCA = Boolean((effectiveMonthlyDCA && effectiveMonthlyDCA > 0) || (position.dcaHistory && position.dcaHistory.length > 0));
              const depositsCount = position.depositsHistory?.length || 0;
              const totalAdhocDeposits = position.depositsHistory?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

              return (
                <tr key={position.id} style={{ cursor: 'pointer' }} onClick={() => onEditPosition(position)}>
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
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              🏦 {position.institutionName}
                            </span>
                          )}
                          {depositsCount > 0 && (
                            <span style={{
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
                            }}>
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
                  {/* 📊 Intérêts Générés - Uniformisé avec le badge P&L Bourse */}
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
                  {/* 🔄 DCA Column - Strictement identique au tableau Bourse */}
                  <td className="mono" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {hasActiveDCA ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ color: 'var(--accent-amber)', fontWeight: 700, fontSize: 13 }}>
                            +{effectiveMonthlyDCA.toLocaleString('fr-FR')} €/m
                          </span>
                          {position.dcaHistory && position.dcaHistory.length > 1 && (
                            <span style={{
                              fontSize: 9,
                              padding: '1px 4px',
                              borderRadius: 4,
                              background: 'rgba(6, 182, 212, 0.15)',
                              color: 'var(--accent-cyan)',
                              border: '1px solid rgba(6, 182, 212, 0.3)',
                              fontWeight: 700,
                            }}>
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
                  {/* 🛡️ Plafond Légal - Uniformisé avec la Jauge Part / Cap Max */}
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
                  {/* Actions Column - Uniformisé avec row-actions du tableau Bourse */}
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
            }))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

