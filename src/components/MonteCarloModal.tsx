'use client';

import React from 'react';
import type { Position } from '@/types/portfolio';
import { useMonteCarloState } from '@/hooks/useMonteCarloState';
import { MonteCarloInputsBar } from './montecarlo/MonteCarloInputsBar';
import { MonteCarloResultsSection } from './montecarlo/MonteCarloResultsSection';

interface MonteCarloModalProps {
  initialCapital: number;
  monthlyDCA: number;
  positions?: Position[];
  fxRates?: Record<string, number>;
  onClose: () => void;
}

export default function MonteCarloModal({
  initialCapital,
  monthlyDCA,
  positions = [],
  fxRates = { EUR: 1.0, USD: 0.92 },
  onClose,
}: MonteCarloModalProps) {
  const {
    riskProfile,
    hasRealPositions,
    capitalInput,
    setCapitalInput,
    dcaInput,
    setDcaInput,
    horizonYears,
    setHorizonYears,
    expectedReturn,
    setExpectedReturn,
    volatility,
    setVolatility,
    useOwnAssumptions,
    setUseOwnAssumptions,
    taxEnvelope,
    setTaxEnvelope,
    numSimulations,
    setNumSimulations,
    resetToPortfolioAssumptions,
    syncWithPortfolio,
    simulation,
    maxVal,
  } = useMonteCarloState({
    initialCapital,
    monthlyDCA,
    positions,
    fxRates,
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 880, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>🎲</span> Simulation Monte Carlo &amp; Indépendance (FIRE)
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              {numSimulations.toLocaleString('fr-FR')} trajectoires stochastiques à {horizonYears} ans • Calculé en <strong style={{ color: 'var(--accent-cyan)' }}>{simulation.executionTimeMs} ms</strong> (Marge d&apos;erreur $\approx$ {numSimulations >= 50000 ? '± 0.44%' : numSimulations >= 10000 ? '± 1.0%' : '± 2.0%'}).
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Input Parameters Panel */}
        <MonteCarloInputsBar
          capitalInput={capitalInput}
          setCapitalInput={setCapitalInput}
          dcaInput={dcaInput}
          setDcaInput={setDcaInput}
          horizonYears={horizonYears}
          setHorizonYears={setHorizonYears}
          taxEnvelope={taxEnvelope}
          setTaxEnvelope={setTaxEnvelope}
          expectedReturn={expectedReturn}
          setExpectedReturn={setExpectedReturn}
          volatility={volatility}
          setVolatility={setVolatility}
          setUseOwnAssumptions={setUseOwnAssumptions}
          numSimulations={numSimulations}
          setNumSimulations={setNumSimulations}
          onSync={syncWithPortfolio}
        />

        {hasRealPositions && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '8px 12px', background: 'rgba(6, 182, 212, 0.06)', borderRadius: 'var(--radius-sm)', marginBottom: 14, borderLeft: '3px solid var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span>
              📐 Rendement/volatilité {useOwnAssumptions ? 'personnalisés' : 'calculés'} à partir de vos <strong>{positions.filter(p => p.quantity > 0).length} positions réelles</strong> (couverture des hypothèses spécifiques : <strong>{riskProfile.coveragePercent}%</strong> du portefeuille, le reste utilise une hypothèse générique par type d&apos;actif).
              {useOwnAssumptions && (
                <> Valeurs par défaut du portefeuille : <strong>{riskProfile.expectedReturn}%</strong> / <strong>{riskProfile.annualVolatility}%</strong>.</>
              )}
            </span>
            {useOwnAssumptions && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={resetToPortfolioAssumptions} style={{ whiteSpace: 'nowrap' }}>
                🔄 Revenir aux valeurs du portefeuille
              </button>
            )}
          </div>
        )}

        {/* Tax Allocation Alert Banner */}
        {taxEnvelope === 'PEA' && simulation.totalInvestedFinal > 150000 ? (
          <div style={{ fontSize: 12, color: 'var(--accent-amber)', padding: '8px 12px', background: 'rgba(245, 158, 11, 0.12)', borderRadius: 'var(--radius-sm)', marginBottom: 14, borderLeft: '4px solid var(--accent-amber)', lineHeight: 1.5 }}>
            ⚠️ <strong>Plafond Légal du PEA Atteint (150 000 € max de versements) :</strong> Vos versements totaux projetés ({(simulation.totalInvestedFinal).toLocaleString('fr-FR')} €) dépassent le plafond légal français du PEA. Les <strong>{(simulation.totalInvestedFinal - 150000).toLocaleString('fr-FR')} € de versements supplémentaires</strong> sont automatiquement soumis à la Flat Tax de 31.4% du CTO, car la loi interdit de verser plus de 150 000 € sur un PEA.
          </div>
        ) : taxEnvelope === 'MIXED' && simulation.totalInvestedFinal > 225000 ? (
          <div style={{ fontSize: 12, color: 'var(--accent-amber)', padding: '8px 12px', background: 'rgba(245, 158, 11, 0.12)', borderRadius: 'var(--radius-sm)', marginBottom: 14, borderLeft: '4px solid var(--accent-amber)', lineHeight: 1.5 }}>
            ⚠️ <strong>Plafond PEA + PEA-PME Atteint (225 000 € max cumulés) :</strong> Les <strong>{(simulation.totalInvestedFinal - 225000).toLocaleString('fr-FR')} € au-dessus de 225 000 €</strong> sont automatiquement imposés au taux CTO de 31.4% (Flat Tax).
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '8px 12px', background: 'rgba(6, 182, 212, 0.06)', borderRadius: 'var(--radius-sm)', marginBottom: 14, borderLeft: '3px solid var(--accent-cyan)', lineHeight: 1.5 }}>
            {taxEnvelope === 'MIXED' ? (
              <span>
                💡 <strong>Règle d&apos;Affectation Fiscale (Mode Mixte) :</strong> Vos versements s&apos;affectent en priorité sur le <strong>PEA (0% IR)</strong> jusqu&apos;au plafond de <strong>150 000 €</strong>, puis le surplus bascule sur le <strong>CTO (Flat Tax 31.4%)</strong>.
              </span>
            ) : taxEnvelope === 'PEA' ? (
              <span>
                🏛️ <strong>Mode PEA Intégral :</strong> Versements jusqu&apos;à 150 000 € appliqués au PEA (exonérés à 0% IR, 18.6% PS).
              </span>
            ) : (
              <span>
                💼 <strong>Mode CTO Intégral :</strong> 100% des versements appliqués au CTO (Flat Tax 31.4%).
              </span>
            )}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingRight: 4 }}>
          <MonteCarloResultsSection
            simulation={simulation}
            horizonYears={horizonYears}
            maxVal={maxVal}
          />
        </div>

        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>Fermer le simulateur</button>
        </div>
      </div>
    </div>
  );
}
