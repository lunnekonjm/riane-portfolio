'use client';

import React from 'react';
import type { PortfolioConfig } from '@/types/portfolio';
import type { StressTestResult } from '@/types/simulation';
import { ALL_SCENARIOS } from '@/data/stressScenarios';
import { RiskAbsorptionSimulatorCard } from './risk/RiskAbsorptionSimulatorCard';
import { RiskStressTestResultCard } from './risk/RiskStressTestResultCard';

interface RiskAnalysisViewProps {
  marketVal: number;
  savingsVal: number;
  config?: PortfolioConfig | null;
  simulatedMarketDrop: number;
  setSimulatedMarketDrop: (drop: number) => void;
  onOpenMonteCarlo: () => void;
  selectedStressResult: StressTestResult | null;
  onRunStressTest: (index: number) => void;
  hideProxyAssets: boolean;
  setHideProxyAssets: (hide: boolean) => void;
  setActiveProxyModalAsset: (asset: any) => void;
}

export default function RiskAnalysisView({
  marketVal,
  savingsVal,
  config,
  simulatedMarketDrop,
  setSimulatedMarketDrop,
  onOpenMonteCarlo,
  selectedStressResult,
  onRunStressTest,
  hideProxyAssets,
  setHideProxyAssets,
  setActiveProxyModalAsset,
}: RiskAnalysisViewProps) {
  return (
    <>
      {/* ═══ SIMULATEUR PRATIQUE D'ABSORPTION DCA & RÉSILIENCE 15-20 ANS ═══ */}
      <RiskAbsorptionSimulatorCard
        marketVal={marketVal}
        savingsVal={savingsVal}
        config={config}
        simulatedMarketDrop={simulatedMarketDrop}
        setSimulatedMarketDrop={setSimulatedMarketDrop}
        onOpenMonteCarlo={onOpenMonteCarlo}
      />

      {/* Scénarios de Stress Tests */}
      <div className="card">
        <div className="card-header">
          <div>
            <span className="card-title">Stress Tests &amp; Simulation de Crises Historiques</span>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Testez le comportement spécifique de vos lignes face aux grands chocs macroéconomiques passés.
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {ALL_SCENARIOS.map((scenario, idx) => (
            <button
              key={idx}
              className="card"
              onClick={() => onRunStressTest(idx)}
              style={{ cursor: 'pointer', textAlign: 'left' }}
              id={`stress-test-${idx}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className={`badge ${scenario.type === 'custom' ? 'badge-rose' : 'badge-amber'}`}>
                  {scenario.type === 'custom' ? '🎯 RIANE' : '📚 Historique'}
                </span>
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{scenario.name}</h4>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{scenario.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Résultat du Scénario Sélectionné */}
      {selectedStressResult && (
        <RiskStressTestResultCard
          selectedStressResult={selectedStressResult}
          config={config}
          hideProxyAssets={hideProxyAssets}
          setHideProxyAssets={setHideProxyAssets}
          setActiveProxyModalAsset={setActiveProxyModalAsset}
        />
      )}
    </>
  );
}
