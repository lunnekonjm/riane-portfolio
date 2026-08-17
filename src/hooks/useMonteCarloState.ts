'use client';

import { useState, useMemo } from 'react';
import { runMonteCarloSimulation, type MonteCarloResult, type TaxEnvelopeType } from '@/engines/monteCarloEngine';
import { calculatePortfolioRiskMetrics } from '@/engines/riskAnalytics';
import type { Position } from '@/types/portfolio';

export interface UseMonteCarloStateParams {
  initialCapital: number;
  monthlyDCA: number;
  positions?: Position[];
  fxRates?: Record<string, number>;
}

export function useMonteCarloState({
  initialCapital,
  monthlyDCA,
  positions = [],
  fxRates = { EUR: 1.0, USD: 0.92 },
}: UseMonteCarloStateParams) {
  const riskProfile = useMemo(() => calculatePortfolioRiskMetrics(positions, fxRates), [positions, fxRates]);
  const hasRealPositions = riskProfile.totalValueEUR > 0;

  const [capitalInput, setCapitalInput] = useState<number>(initialCapital > 0 ? Math.round(initialCapital) : 10000);
  const [dcaInput, setDcaInput] = useState<number>(monthlyDCA > 0 ? Math.round(monthlyDCA) : 500);
  const [horizonYears, setHorizonYears] = useState<number>(15);
  const [expectedReturn, setExpectedReturn] = useState<number>(hasRealPositions ? riskProfile.expectedReturn : 7.5);
  const [volatility, setVolatility] = useState<number>(hasRealPositions ? riskProfile.annualVolatility : 15.0);
  const [useOwnAssumptions, setUseOwnAssumptions] = useState<boolean>(false);
  const [taxEnvelope, setTaxEnvelope] = useState<TaxEnvelopeType>('MIXED');
  const [numSimulations, setNumSimulations] = useState<number>(10000);

  const resetToPortfolioAssumptions = () => {
    setExpectedReturn(riskProfile.expectedReturn);
    setVolatility(riskProfile.annualVolatility);
    setUseOwnAssumptions(false);
  };

  const simulation: MonteCarloResult = useMemo(() => {
    return runMonteCarloSimulation({
      initialCapital: capitalInput,
      monthlyDCA: dcaInput,
      horizonYears,
      annualReturnMean: expectedReturn / 100,
      annualVolatility: volatility / 100,
      numSimulations,
      taxEnvelope,
    });
  }, [capitalInput, dcaInput, horizonYears, expectedReturn, volatility, taxEnvelope, numSimulations]);

  const maxVal = Math.max(...simulation.yearlySummaries.map((s) => s.p90));

  const syncWithPortfolio = () => {
    setCapitalInput(initialCapital > 0 ? Math.round(initialCapital) : 10000);
    setDcaInput(monthlyDCA > 0 ? Math.round(monthlyDCA) : 500);
  };

  return {
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
  };
}
