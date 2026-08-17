'use client';

import React from 'react';

interface DashboardQuickAnalysisBarProps {
  queryInput: string;
  setQueryInput: (q: string) => void;
  isRunning: boolean;
  onRunAnalysis: (flag?: boolean) => void;
}

export function DashboardQuickAnalysisBar({
  queryInput,
  setQueryInput,
  isRunning,
  onRunAnalysis,
}: DashboardQuickAnalysisBarProps) {
  return (
    <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 18px' }}>
      <span style={{ fontSize: 22 }}>🔍</span>
      <input
        className="input"
        style={{ fontSize: 14 }}
        placeholder="Analyse X-FAB dans mon portefeuille... | Compare cet ETF à mon ACWI..."
        value={queryInput}
        onChange={(e) => setQueryInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onRunAnalysis()}
        disabled={isRunning}
        id="quick-analysis-input"
      />
      <button
        className="btn btn-primary"
        style={{ fontSize: 14, padding: '10px 20px' }}
        onClick={() => onRunAnalysis(false)}
        disabled={isRunning || !queryInput.trim()}
        id="run-analysis-btn"
      >
        {isRunning ? <span className="loading-spinner" /> : 'Analyser'}
      </button>
    </div>
  );
}
