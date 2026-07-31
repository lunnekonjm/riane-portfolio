'use client';

import { useState, useMemo } from 'react';
import { runMonteCarloSimulation, type MonteCarloResult, type TaxEnvelopeType } from '@/engines/monteCarloEngine';

interface MonteCarloModalProps {
  initialCapital: number;
  monthlyDCA: number;
  onClose: () => void;
}

export default function MonteCarloModal({ initialCapital, monthlyDCA, onClose }: MonteCarloModalProps) {
  const [capitalInput, setCapitalInput] = useState<number>(initialCapital > 0 ? Math.round(initialCapital) : 10000);
  const [dcaInput, setDcaInput] = useState<number>(monthlyDCA > 0 ? Math.round(monthlyDCA) : 500);
  const [horizonYears, setHorizonYears] = useState<number>(15);
  const [expectedReturn, setExpectedReturn] = useState<number>(7.5);
  const [volatility, setVolatility] = useState<number>(15.0);
  const [taxEnvelope, setTaxEnvelope] = useState<TaxEnvelopeType>('MIXED');

  const simulation: MonteCarloResult = useMemo(() => {
    return runMonteCarloSimulation({
      initialCapital: capitalInput,
      monthlyDCA: dcaInput,
      horizonYears,
      annualReturnMean: expectedReturn / 100,
      annualVolatility: volatility / 100,
      numSimulations: 10000,
      taxEnvelope,
    });
  }, [capitalInput, dcaInput, horizonYears, expectedReturn, volatility, taxEnvelope]);

  const maxVal = Math.max(...simulation.yearlySummaries.map((s) => s.p90));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>🎲</span> Simulation Monte Carlo & Indépendance (FIRE)
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              10 000 trajectoires stochastiques projetées à {horizonYears} ans avec règles fiscales d&apos;enveloppe.
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Input Parameters Panel — Optimized 1-Line Flex Layout */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', margin: '12px 0 6px 0', border: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 110px', minWidth: 100 }}>
            <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Capital Initial (€)</label>
            <input
              type="number"
              className="input mono"
              value={capitalInput}
              onChange={(e) => setCapitalInput(Number(e.target.value))}
              style={{ fontSize: 13, padding: '6px 8px', width: '100%' }}
            />
          </div>
          <div style={{ flex: '1 1 100px', minWidth: 90 }}>
            <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>DCA Mensuel (€)</label>
            <input
              type="number"
              className="input mono"
              value={dcaInput}
              onChange={(e) => setDcaInput(Number(e.target.value))}
              style={{ fontSize: 13, padding: '6px 8px', width: '100%' }}
            />
          </div>
          <div style={{ flex: '1 1 130px', minWidth: 120 }}>
            <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Horizon (Ans)</label>
            <div style={{ display: 'flex', gap: 2 }}>
              {[5, 10, 15, 20, 25].map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`btn btn-sm ${horizonYears === h ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setHorizonYears(h)}
                  style={{ fontSize: 11, padding: '4px 4px', flex: 1 }}
                >
                  {h}a
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: '1.2 1 150px', minWidth: 140 }}>
            <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Fiscalité Enveloppe</label>
            <select
              className="input"
              value={taxEnvelope}
              onChange={(e) => setTaxEnvelope(e.target.value as TaxEnvelopeType)}
              style={{ fontSize: 12, padding: '6px 6px', fontWeight: 700, width: '100%' }}
            >
              <option value="MIXED">📊 Mixte (PEA + CTO)</option>
              <option value="PEA">🏛️ PEA (18.6% PS)</option>
              <option value="CTO">💼 CTO (31.4% PFU)</option>
            </select>
          </div>
          <div style={{ flex: '0.8 1 80px', minWidth: 70 }}>
            <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Rendement (%)</label>
            <input
              type="number"
              step="0.5"
              className="input mono"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(Number(e.target.value))}
              style={{ fontSize: 13, padding: '6px 8px', width: '100%' }}
            />
          </div>
        </div>

        {/* 💡 Explicit Tax Allocation Explanation Banner */}
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '8px 12px', background: 'rgba(6, 182, 212, 0.06)', borderRadius: 'var(--radius-sm)', marginBottom: 14, borderLeft: '3px solid var(--accent-cyan)', lineHeight: 1.5 }}>
          {taxEnvelope === 'MIXED' ? (
            <span>
              💡 <strong>Règle d&apos;Affectation Fiscale (Mode Mixte) :</strong> Vos versements sont affectés en priorité sur le <strong>PEA (exonéré d&apos;impôt à 0% IR)</strong> jusqu&apos;au plafond légal de <strong>150 000 €</strong>, puis tout surplus bascule automatiquement sur le <strong>CTO (Flat Tax 31.4%)</strong>.
            </span>
          ) : taxEnvelope === 'PEA' ? (
            <span>
              🏛️ <strong>Mode PEA Intégral :</strong> 100% du capital et du DCA sont appliqués au PEA (soumis uniquement aux prélèvements sociaux de 18.6% après 5 ans d&apos;ancienneté).
            </span>
          ) : (
            <span>
              💼 <strong>Mode CTO Intégral :</strong> 100% du capital et du DCA sont appliqués au Compte-Titres Ordinaire (soumis à la Flat Tax / PFU de 31.4%).
            </span>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingRight: 4 }}>
          {/* 📘 Beginner Educational Explanation Box */}
          <div style={{ padding: 14, background: 'rgba(6, 182, 212, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(6, 182, 212, 0.25)', fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>💡</span> Comment lire ce simulateur sans être un expert ?
            </div>
            <p style={{ margin: '0 0 8px 0' }}>
              Plutôt que d&apos;utiliser une formule magique irréelle, ce simulateur rejoue <strong>10 000 scénarios de marché virtuels</strong> (crises financières, années de forte hausse, ralentissements) sur vos versements mensuels (DCA).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 10, fontSize: 12 }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: 10, borderRadius: 6 }}>
                <strong style={{ color: 'var(--accent-rose)' }}>🔴 Scénario Baissier (P10)</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>Dans 90% des cas, vous aurez PLUS que cette somme. C&apos;est le filet de sécurité en cas de décennie difficile.</p>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: 10, borderRadius: 6 }}>
                <strong style={{ color: 'var(--accent-cyan)' }}>🟦 Médiane Attendue (P50)</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>La valeur la plus probable de votre patrimoine. 50% de chance de faire mieux, 50% de faire moins.</p>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: 10, borderRadius: 6 }}>
                <strong style={{ color: 'var(--accent-emerald)' }}>💰 Rente Mensuelle (Règle des 4%)</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>L&apos;argent net que vous pouvez retirer chaque mois à la retraite SANS JAMAIS vider votre capital d&apos;origine.</p>
              </div>
            </div>

            {/* ❓ Clear explanation of Average Return vs 10k Simulations */}
            <div style={{ marginTop: 12, padding: 10, background: 'var(--bg-secondary)', borderRadius: 6, borderLeft: '3px solid var(--accent-amber)', fontSize: 12 }}>
              <strong style={{ color: 'var(--accent-amber)', display: 'block', marginBottom: 2 }}>
                ❓ Pourquoi indiquer un rendement moyen (ex: 7.5%) si la simulation sert aux rendements ?
              </strong>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Dans le monde réel, la bourse ne fait <strong>jamais +7.5% tous les ans de manière lisse</strong>. Une année elle fait +28%, l&apos;année suivante -18%, puis +12%...
                Le taux de 7.5% fixe la <em>moyenne long terme</em>, mais les 10 000 simulations testent <strong>10 000 ordres aléatoires de crises et de hausses</strong> pour mesurer l&apos;impact réel des krachs sur vos versements mensuels (DCA).
              </p>
            </div>
          </div>

          {/* Key Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div className="card" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--text-tertiary)', padding: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Investi</span>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                {simulation.totalInvestedFinal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Versements cumulés</span>
            </div>
            <div className="card" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--accent-rose)', padding: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--accent-rose)', textTransform: 'uppercase' }}>Pessimiste (P10)</span>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: 'var(--accent-rose)' }}>
                {simulation.finalP10.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Marché baissier (10%)</span>
            </div>
            <div className="card" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--accent-cyan)', padding: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>Médiane Attendue (P50)</span>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4, color: 'var(--accent-cyan)' }}>
                {simulation.finalP50.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-tertiary)' }}>(Brut)</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginTop: 2 }}>
                Net en Poche : {simulation.finalP50Net.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </div>
              <span style={{ fontSize: 11, color: 'var(--accent-emerald)', fontWeight: 600, display: 'block', marginTop: 2 }}>
                Rente Net : {simulation.monthlyPassiveIncomeP50Net.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}/mois (4%)
              </span>
            </div>
            <div className="card" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--accent-emerald)', padding: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>Optimiste (P90)</span>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: 'var(--accent-emerald)' }}>
                {simulation.finalP90.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Marché haussier (90%)</span>
            </div>
          </div>

          {/* Visual Trajectory Graph */}
          <div className="card" style={{ padding: 16 }}>
            <span className="card-title" style={{ fontSize: 14, marginBottom: 12, display: 'block' }}>
              📈 Trajectoires de Patrimoine Projetées à {horizonYears} Ans (10 000 Scénarios)
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {simulation.yearlySummaries.map((sum) => {
                const p10Pct = (sum.p10 / maxVal) * 100;
                const p50Pct = (sum.p50 / maxVal) * 100;
                const p90Pct = (sum.p90 / maxVal) * 100;
                const invPct = (sum.totalInvested / maxVal) * 100;

                return (
                  <div key={sum.year} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
                    <span style={{ width: 45, fontWeight: 600, color: 'var(--text-tertiary)' }}>An {sum.year}</span>
                    <div style={{ flex: 1, height: 18, background: 'var(--bg-tertiary)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                      {/* P90 bar background */}
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${p90Pct}%`, background: 'rgba(16, 185, 129, 0.2)' }} />
                      {/* P50 bar */}
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${p50Pct}%`, background: 'var(--accent-cyan)', opacity: 0.8 }} />
                      {/* P10 bar line */}
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${p10Pct}%`, background: 'var(--accent-rose)' }} />
                      {/* Total invested marker */}
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${invPct}%`, width: 2, background: 'white' }} title="Total Investi" />
                    </div>
                    <span style={{ minWidth: 80, textAlign: 'right', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {Math.round(sum.p50).toLocaleString('fr-FR')} €
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12, fontSize: 11, color: 'var(--text-tertiary)' }}>
              <span>🔴 Bear (P10)</span>
              <span>🟦 Médiane (P50)</span>
              <span>🟢 Bull (P90)</span>
              <span>⚪ Total Investi</span>
            </div>
          </div>

          {/* Target Milestones Success Probabilities */}
          <div className="card" style={{ padding: 16 }}>
            <span className="card-title" style={{ fontSize: 14, marginBottom: 12, display: 'block' }}>
              🎯 Probabilité d&apos;Atteinte des Jalons de Patrimoine à {horizonYears} Ans
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {simulation.targetMilestones.map((m) => (
                <div key={m.targetAmount} style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, textAlign: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    Objectif {m.targetAmount.toLocaleString('fr-FR')} €
                  </span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: m.successProbability > 50 ? 'var(--accent-emerald)' : 'var(--accent-amber)', marginTop: 2 }}>
                    {m.successProbability.toFixed(1)}%
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>de chance de succès</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>Fermer le simulateur</button>
        </div>
      </div>
    </div>
  );
}
