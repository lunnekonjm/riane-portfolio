'use client';

import React from 'react';

interface DashboardDcaKpiCardProps {
  cumulativeInflationFactor: number;
  dcaBreakdown: any;
  showDcaFrequencyDropdown: boolean;
  setShowDcaFrequencyDropdown: (v: boolean) => void;
  openGlossary: (term: string) => void;
  setShowConfigEditor: (v: boolean) => void;
}

export function DashboardDcaKpiCard({
  cumulativeInflationFactor,
  dcaBreakdown,
  showDcaFrequencyDropdown,
  setShowDcaFrequencyDropdown,
  openGlossary,
  setShowConfigEditor,
}: DashboardDcaKpiCardProps) {
  return (
    <div className="card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => setShowConfigEditor(true)} data-tooltip="Somme totale de vos versements d'accumulation">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <span className="card-title text-sm font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>DCA &amp; Épargne</span>
          <div style={{ marginTop: 4 }}>
            <span className="badge-real">
              <span className="dot"></span> RÉEL
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm text-sm font-semibold"
            style={{ padding: '2px 8px', color: 'var(--accent-cyan)' }}
            onClick={(e) => {
              e.stopPropagation();
              openGlossary('DCA');
            }}
            title="Qu'est-ce que le DCA et la fréquence de versement ?"
          >
            💡 DCA
          </button>
          <span className="text-lg text-muted">⚙️</span>
        </div>
      </div>

      <div className="card-value font-extrabold text-3xl" style={{ color: dcaBreakdown.monthlyEquivalent > 0 ? 'var(--accent-emerald)' : 'var(--text-muted)', display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        <span>
          {dcaBreakdown.monthlyEquivalent > 0
            ? (dcaBreakdown.monthlyEquivalent / cumulativeInflationFactor).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
            : '0,00 €'}
        </span>
        <span className="text-md font-semibold text-secondary">
          {dcaBreakdown.monthlyEquivalent > 0 ? '/mois (lissés)' : ''}
        </span>
      </div>
      <div className="card-subtitle" style={{ marginTop: 8, marginBottom: 12 }}>
        Moyenne annualisée de vos versements programmés — pas un flux mensuel littéral.
      </div>

      {/* Interactive Mini Dropdown Badge Button */}
      <div style={{ marginTop: 6, position: 'relative' }}>
        {dcaBreakdown.activeFrequenciesCount > 0 ? (
          <button
            type="button"
            className="btn btn-secondary btn-sm text-xs font-semibold"
            style={{
              padding: '5px 10px',
              background: 'rgba(6, 182, 212, 0.15)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowDcaFrequencyDropdown(!showDcaFrequencyDropdown);
            }}
          >
            <span>📊 Détail des Fréquences ({dcaBreakdown.activeFrequenciesCount})</span>
            <span className="text-xs">{showDcaFrequencyDropdown ? '▲' : '▼'}</span>
          </button>
        ) : (
          <span className="badge badge-amber" style={{ fontSize: 'var(--text-xs)', padding: '4px 8px' }}>
            Aucun DCA configuré
          </span>
        )}

        {showDcaFrequencyDropdown && (
          <div className="popover-card">
            <div className="popover-header">
              <span>Fréquences des Versements DCA</span>
            </div>
            {dcaBreakdown.monthlyCount > 0 && (
              <div className="popover-row">
                <span className="text-secondary">📅 Mensuel ({dcaBreakdown.monthlyCount} actif{dcaBreakdown.monthlyCount > 1 ? 's' : ''})</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>
                  {(dcaBreakdown.monthlySum / cumulativeInflationFactor).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €/mois
                </strong>
              </div>
            )}
            {dcaBreakdown.quarterlyCount > 0 && (
              <div className="popover-row">
                <span className="text-secondary">🗓️ Trimestriel ({dcaBreakdown.quarterlyCount} actif{dcaBreakdown.quarterlyCount > 1 ? 's' : ''})</span>
                <strong style={{ color: 'var(--accent-blue)' }}>
                  {(dcaBreakdown.quarterlySum / cumulativeInflationFactor).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €/trimestre
                </strong>
              </div>
            )}
            {dcaBreakdown.semestrialCount > 0 && (
              <div className="popover-row">
                <span className="text-secondary">📆 Semestriel ({dcaBreakdown.semestrialCount} actif{dcaBreakdown.semestrialCount > 1 ? 's' : ''})</span>
                <strong style={{ color: 'var(--accent-amber)' }}>
                  {(dcaBreakdown.semestrialSum / cumulativeInflationFactor).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €/semestre
                </strong>
              </div>
            )}
            {dcaBreakdown.annualCount > 0 && (
              <div className="popover-row">
                <span className="text-secondary">🎯 Annuel ({dcaBreakdown.annualCount} actif{dcaBreakdown.annualCount > 1 ? 's' : ''})</span>
                <strong style={{ color: 'var(--accent-emerald)' }}>
                  {(dcaBreakdown.annualSum / cumulativeInflationFactor).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €/an
                </strong>
              </div>
            )}
            <div className="popover-row" style={{ borderTop: '1px dashed var(--border-subtle)', marginTop: 6, paddingTop: 6 }}>
              <span className="text-secondary font-bold">Total Annuel Cumulé</span>
              <strong style={{ color: 'var(--accent-emerald)' }}>
                {(dcaBreakdown.totalAnnualCumulative / cumulativeInflationFactor).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €/an
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
