'use client';

import React from 'react';
import type { MonteCarloResult } from '@/engines/monteCarloEngine';

interface MonteCarloResultsSectionProps {
  simulation: MonteCarloResult;
  horizonYears: number;
  maxVal: number;
}

export function MonteCarloResultsSection({
  simulation,
  horizonYears,
  maxVal,
}: MonteCarloResultsSectionProps) {
  return (
    <>
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
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Investi</span>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
            {simulation.totalInvestedFinal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Versements cumulés</span>
        </div>
        <div className="card" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--accent-rose)', padding: 12 }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-rose)', textTransform: 'uppercase', fontWeight: 600 }}>Pessimiste (P10)</span>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: 'var(--accent-rose)' }}>
            {simulation.finalP10.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Marché baissier (10%)</span>
        </div>
        <div className="card" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--accent-cyan)', padding: 12 }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: 600 }}>Médiane Attendue (P50)</span>
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4, color: 'var(--accent-cyan)' }}>
            {simulation.finalP50.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} <span style={{ fontSize: 'var(--text-xs)', fontWeight: 400, color: 'var(--text-secondary)' }}>(Brut)</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginTop: 2 }}>
            Net en Poche : {simulation.finalP50Net.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-emerald)', fontWeight: 600, display: 'block', marginTop: 2 }}>
            Rente Net : {simulation.monthlyPassiveIncomeP50Net.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}/mois (4%)
          </span>
        </div>
        <div className="card" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--accent-emerald)', padding: 12 }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-emerald)', textTransform: 'uppercase', fontWeight: 600 }}>Optimiste (P90)</span>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: 'var(--accent-emerald)' }}>
            {simulation.finalP90.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Marché haussier (90%)</span>
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
                <span style={{ width: 45, fontWeight: 600, color: 'var(--text-secondary)' }}>An {sum.year}</span>
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
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 500 }}>
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
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Objectif {m.targetAmount.toLocaleString('fr-FR')} €
              </span>
              <div style={{ fontSize: 18, fontWeight: 800, color: m.successProbability > 50 ? 'var(--accent-emerald)' : 'var(--accent-amber)', marginTop: 2 }}>
                {m.successProbability.toFixed(1)}%
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>de chance de succès</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
