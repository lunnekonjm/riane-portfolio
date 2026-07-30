'use client';

import { useState, useEffect } from 'react';
import { onAuthChange, signInWithGoogle, signOut } from '@/services/firebase/auth';
import { isFirebaseConfigured } from '@/services/firebase/config';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAnalysis } from '@/hooks/useAnalysis';
import { THEMES } from '@/data/themes';
import { ENVELOPE_LABELS } from '@/data/portfolio';
import { ALL_SCENARIOS } from '@/data/stressScenarios';
import { runStressTest } from '@/engines/stressTest';
import type { User } from 'firebase/auth';
import type { AnalysisStatus } from '@/types/analysis';
import type { StressTestResult } from '@/types/simulation';

type PageView = 'dashboard' | 'analysis' | 'risk' | 'audit';

const PIPELINE_STEPS: Array<{ key: AnalysisStatus; label: string; icon: string }> = [
  { key: 'data-collection', label: 'Données', icon: '📊' },
  { key: 'research', label: 'Recherche', icon: '🔬' },
  { key: 'portfolio-eval', label: 'Portefeuille', icon: '⚖️' },
  { key: 'critique', label: 'Contradicteur', icon: '🛡️' },
  { key: 'synthesis', label: 'Synthèse', icon: '🎯' },
];

function AuthScreen() {
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="sidebar-logo-icon" style={{ margin: '0 auto 20px', width: 56, height: 56, fontSize: 28 }}>R</div>
        <h1 className="auth-title">RIANE Portfolio</h1>
        <p className="auth-subtitle">Analyse multi-agents de portefeuille<br />Veille · Allocation · Simulations · Risque</p>
        <button className="google-btn" onClick={handleSignIn} id="google-sign-in-btn">
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Connexion avec Google
        </button>
        {error && <p style={{ color: 'var(--accent-rose)', marginTop: 16, fontSize: 13 }}>{error}</p>}
      </div>
    </div>
  );
}

function ConfigNeeded() {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="sidebar-logo-icon" style={{ margin: '0 auto 20px', width: 56, height: 56, fontSize: 28 }}>R</div>
        <h1 className="auth-title">Configuration requise</h1>
        <p className="auth-subtitle">
          Créez un fichier <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>.env.local</code> à la racine du projet avec vos clés Firebase et API de données marché.
        </p>
        <pre style={{
          background: 'var(--bg-tertiary)',
          padding: 16,
          borderRadius: 'var(--radius-md)',
          textAlign: 'left',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
          overflow: 'auto',
          marginTop: 16,
        }}>
{`NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=...
NEXT_PUBLIC_FINNHUB_API_KEY=...`}
        </pre>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<PageView>('dashboard');
  const [queryInput, setQueryInput] = useState('');
  const [selectedStressResult, setSelectedStressResult] = useState<StressTestResult | null>(null);

  const { positions, config, totalValue, totalCost, gainLoss, gainLossPercent } = usePortfolio();
  const { result, status, statusMessage, isRunning, runAnalysis, history, clearResult } = useAnalysis();

  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  if (!isFirebaseConfigured()) return <ConfigNeeded />;
  if (authLoading) return <div className="auth-screen"><div className="loading-spinner" style={{ width: 40, height: 40 }} /></div>;
  if (!user) return <AuthScreen />;

  const handleRunAnalysis = () => {
    if (!queryInput.trim() || isRunning) return;
    runAnalysis(user.uid, queryInput.trim(), positions, config);
    setCurrentView('analysis');
  };

  const handleRunStressTest = (scenarioIdx: number) => {
    const scenario = ALL_SCENARIOS[scenarioIdx];
    if (scenario) {
      const stressResult = runStressTest(positions, scenario);
      setSelectedStressResult(stressResult);
    }
  };

  const envelopeGroups = positions.reduce((acc, p) => {
    if (!acc[p.envelope]) acc[p.envelope] = [];
    acc[p.envelope].push(p);
    return acc;
  }, {} as Record<string, typeof positions>);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <nav className="sidebar" id="main-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">R</div>
          <span className="sidebar-logo-text">RIANE</span>
        </div>

        <button className={`sidebar-nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')} id="nav-dashboard">
          <span className="nav-icon">📊</span> Dashboard
        </button>
        <button className={`sidebar-nav-item ${currentView === 'analysis' ? 'active' : ''}`} onClick={() => setCurrentView('analysis')} id="nav-analysis">
          <span className="nav-icon">🔬</span> Analyse
        </button>
        <button className={`sidebar-nav-item ${currentView === 'risk' ? 'active' : ''}`} onClick={() => setCurrentView('risk')} id="nav-risk">
          <span className="nav-icon">⚡</span> Risque
        </button>
        <button className={`sidebar-nav-item ${currentView === 'audit' ? 'active' : ''}`} onClick={() => setCurrentView('audit')} id="nav-audit">
          <span className="nav-icon">📋</span> Audit
        </button>

        <div style={{ flex: 1 }} />

        <div style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: 'white',
          }}>
            {user.displayName?.[0] || 'R'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.displayName || 'RIANE'}
            </div>
          </div>
          <button className="btn-ghost" onClick={signOut} style={{ padding: 6, fontSize: 16 }} id="sign-out-btn" title="Déconnexion">
            ↗
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">
            {currentView === 'dashboard' && '📊 Tableau de Bord'}
            {currentView === 'analysis' && '🔬 Analyse à la Demande'}
            {currentView === 'risk' && '⚡ Stress Tests & Risque'}
            {currentView === 'audit' && '📋 Journal d\'Audit'}
          </h1>
          {isRunning && (
            <div className="pipeline-steps">
              {PIPELINE_STEPS.map((step, i) => {
                const stepStatuses: AnalysisStatus[] = ['data-collection', 'research', 'portfolio-eval', 'critique', 'synthesis'];
                const currentIdx = stepStatuses.indexOf(status);
                const stepIdx = i;
                let cls = 'pipeline-step';
                if (stepIdx < currentIdx) cls += ' complete';
                else if (stepIdx === currentIdx) cls += ' active';
                return (
                  <span key={step.key}>
                    {i > 0 && <span className="pipeline-connector" />}
                    <span className={cls}>{step.icon} {step.label}</span>
                  </span>
                );
              })}
            </div>
          )}
        </header>

        <div className="page-body">
          {/* ═══ DASHBOARD ═══ */}
          {currentView === 'dashboard' && (
            <>
              {/* Summary Cards */}
              <div className="grid-4">
                <div className="card">
                  <div className="card-header"><span className="card-title">Valeur Totale</span></div>
                  <div className="card-value" style={{ color: 'var(--accent-cyan)' }}>
                    {totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><span className="card-title">Coût Total</span></div>
                  <div className="card-value">{totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
                </div>
                <div className="card">
                  <div className="card-header"><span className="card-title">Plus/Moins-Value</span></div>
                  <div className={`card-value ${gainLoss >= 0 ? 'stat-gain' : 'stat-loss'}`}>
                    {gainLoss >= 0 ? '+' : ''}{gainLoss.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </div>
                  <span className={`stat-change ${gainLoss >= 0 ? 'positive' : 'negative'}`}>
                    {gainLossPercent >= 0 ? '↑' : '↓'} {Math.abs(gainLossPercent).toFixed(2)}%
                  </span>
                </div>
                <div className="card">
                  <div className="card-header"><span className="card-title">DCA Mensuel</span></div>
                  <div className="card-value" style={{ color: 'var(--accent-emerald)' }}>
                    {(config?.monthlyBudget || 1000).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
              </div>

              {/* Quick Analysis Bar */}
              <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 20 }}>🔍</span>
                <input
                  className="input"
                  placeholder="Analyse X-FAB dans mon portefeuille... | Compare cet ETF à mon ACWI..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunAnalysis()}
                  disabled={isRunning}
                  id="quick-analysis-input"
                />
                <button className="btn btn-primary" onClick={handleRunAnalysis} disabled={isRunning || !queryInput.trim()} id="run-analysis-btn">
                  {isRunning ? <span className="loading-spinner" /> : 'Analyser'}
                </button>
              </div>

              {/* Portfolio by Envelope */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Positions par Enveloppe</span>
                </div>
                <table className="portfolio-table">
                  <thead>
                    <tr>
                      <th>Actif</th>
                      <th>Ticker</th>
                      <th>Enveloppe</th>
                      <th>Quantité</th>
                      <th>Prix Moyen</th>
                      <th>DCA/mois</th>
                      <th>Thèmes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos) => (
                      <tr key={pos.id}>
                        <td style={{ fontWeight: 600 }}>{pos.name}</td>
                        <td className="mono">{pos.ticker}</td>
                        <td>
                          <span className={`envelope-tag ${pos.envelope.toLowerCase().replace('-', '-')}`}>
                            {pos.envelope}
                          </span>
                        </td>
                        <td className="mono">{pos.quantity}</td>
                        <td className="mono">{pos.avgPrice > 0 ? `${pos.avgPrice.toFixed(2)} ${pos.currency === 'EUR' ? '€' : '$'}` : '—'}</td>
                        <td className="mono">{pos.monthlyDCA ? `${pos.monthlyDCA} €` : pos.annualBudget ? `${pos.annualBudget} €/an` : '—'}</td>
                        <td>
                          {pos.themes.slice(0, 2).map((t) => (
                            <span key={t} className="badge badge-violet" style={{ marginRight: 4 }}>
                              {THEMES.find((th) => th.id === t)?.label || t}
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Thematic Exposure */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Exposition Thématique Transversale</span>
                </div>
                <div className="theme-bar-container">
                  {THEMES.filter((t) => t.tickers.length > 0).map((theme) => {
                    const themePositions = positions.filter((p) => theme.tickers.includes(p.ticker));
                    const exposure = totalValue > 0
                      ? themePositions.reduce((s, p) => s + p.quantity * (p.currentPrice || p.avgPrice), 0) / totalValue * 100
                      : (themePositions.length / positions.length) * 100;
                    const maxPct = theme.maxExposure * 100;
                    return (
                      <div className="theme-bar-row" key={theme.id}>
                        <span className="theme-bar-label">{theme.label}</span>
                        <div className="theme-bar-track">
                          <div className="theme-bar-fill" style={{ width: `${Math.min(exposure, 100)}%` }} />
                          <div className="theme-bar-limit" style={{ left: `${maxPct}%` }} title={`Max ${maxPct}%`} />
                        </div>
                        <span className="theme-bar-value">{exposure.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ═══ ANALYSIS ═══ */}
          {currentView === 'analysis' && (
            <div className="chat-container">
              <div className="chat-messages" id="chat-messages">
                {/* User query */}
                {result?.request && (
                  <div className="chat-message user">
                    <strong>Votre requête :</strong><br />
                    {result.request.query}
                  </div>
                )}

                {/* Pipeline status */}
                {isRunning && (
                  <div className="chat-message system">
                    <span className="loading-spinner" style={{ display: 'inline-block', marginRight: 8, verticalAlign: 'middle' }} />
                    {statusMessage}
                  </div>
                )}

                {/* Market data */}
                {result?.marketData && (
                  <div className="chat-message agent">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span className="badge badge-cyan">📊 Data Agent</span>
                    </div>
                    <strong>{result.marketData.name}</strong> ({result.marketData.ticker})<br />
                    <span className="mono" style={{ fontSize: 24, fontWeight: 700 }}>
                      {result.marketData.price.toFixed(2)} {result.marketData.currency}
                    </span>
                    <span className={`stat-change ${result.marketData.change24hPercent >= 0 ? 'positive' : 'negative'}`} style={{ marginLeft: 12 }}>
                      {result.marketData.change24hPercent >= 0 ? '↑' : '↓'} {Math.abs(result.marketData.change24hPercent).toFixed(2)}%
                    </span>
                    {result.marketData.sector && (
                      <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                        {result.marketData.sector} · {result.marketData.exchange} · Cap: {(result.marketData.marketCap || 0).toLocaleString('fr-FR')} €
                      </div>
                    )}
                  </div>
                )}

                {/* Research */}
                {result?.research && (
                  <div className="chat-message agent">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span className="badge badge-emerald">🔬 Research Agent</span>
                      {result.research.isGrounded && <span className="badge badge-cyan">✓ Sourcé Google</span>}
                    </div>
                    <p style={{ marginBottom: 12 }}><strong>Thèse :</strong> {result.research.thesisStatement}</p>
                    <p style={{ marginBottom: 8 }}><strong>Fondamentaux :</strong> {result.research.fundamentals.summary}</p>
                    {result.research.fundamentals.strengths.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <strong style={{ color: 'var(--accent-emerald)' }}>Forces :</strong>
                        <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                          {result.research.fundamentals.strengths.map((s, i) => <li key={i} style={{ fontSize: 13 }}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {result.research.fundamentals.risks.length > 0 && (
                      <div>
                        <strong style={{ color: 'var(--accent-rose)' }}>Risques :</strong>
                        <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                          {result.research.fundamentals.risks.map((r, i) => <li key={i} style={{ fontSize: 13 }}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                    <p style={{ marginTop: 8 }}><strong>Valorisation :</strong> {result.research.valuation.assessment}</p>
                    {result.research.searchEntryPointHtml && (
                      <div className="source-attribution" dangerouslySetInnerHTML={{ __html: result.research.searchEntryPointHtml }} />
                    )}
                  </div>
                )}

                {/* Portfolio Eval */}
                {result?.portfolioEval && (
                  <div className="chat-message agent">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span className="badge badge-violet">⚖️ Portfolio Agent</span>
                    </div>
                    <p><strong>Utilité marginale :</strong> {(result.portfolioEval.marginalUtility.score * 100).toFixed(0)}% — {result.portfolioEval.marginalUtility.explanation}</p>
                    {result.portfolioEval.scenarios && (
                      <div className="scenario-grid" style={{ marginTop: 16 }}>
                        {result.portfolioEval.scenarios.map((sc, i) => (
                          <div key={i} className={`scenario-card ${i === 0 ? 'optimistic' : i === 1 ? 'neutral' : 'pessimistic'}`}>
                            <h4>{sc.name}</h4>
                            <p>{sc.description}</p>
                            <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>
                              {sc.probability} · Effet : {sc.portfolioEffect > 0 ? '+' : ''}{(sc.portfolioEffect * 100).toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Critique */}
                {result?.critique && (
                  <div className="chat-message agent">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span className="badge badge-rose">🛡️ Contradicteur</span>
                    </div>
                    {result.critique.counterArguments.map((arg, i) => (
                      <p key={i} style={{ fontSize: 13, marginBottom: 6 }}>⚠️ {arg}</p>
                    ))}
                    {result.critique.ruleViolations.length > 0 && (
                      <div style={{ marginTop: 8, padding: 12, background: 'var(--accent-rose-glow)', borderRadius: 'var(--radius-sm)' }}>
                        <strong style={{ color: 'var(--accent-rose)' }}>Violations de règles :</strong>
                        {result.critique.ruleViolations.map((v, i) => <p key={i} style={{ fontSize: 13, marginTop: 4 }}>❌ {v}</p>)}
                      </div>
                    )}
                    {result.critique.abstentionCheck?.shouldAbstain && (
                      <div style={{ marginTop: 12, padding: 16, background: 'var(--accent-amber-glow)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <strong style={{ color: 'var(--accent-amber)' }}>⛔ MODE ABSTENTION</strong>
                        <p style={{ fontSize: 13, marginTop: 8, color: 'var(--text-secondary)' }}>
                          {result.critique.abstentionCheck.requiredInfo.join(' · ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Synthesis & Recommendation */}
                {result?.synthesis && !isRunning && (
                  <div className="recommendation-card" style={{ animation: 'fadeInUp 0.5s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <span style={{ fontSize: 24 }}>🎯</span>
                      <h3 style={{ fontSize: 18, fontWeight: 700 }}>Synthèse Finale</h3>
                      {result.recommendation && (
                        <span className={`confidence-badge ${result.recommendation.confidence}`}>
                          Confiance : {result.recommendation.confidence}
                        </span>
                      )}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                      {result.synthesis}
                    </div>
                    {result.recommendation && (
                      <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        <div>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Action</span>
                          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent-cyan)' }}>{result.recommendation.action}</div>
                        </div>
                        <div>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Poids</span>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{(result.recommendation.weight * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Source</span>
                          <div style={{ fontSize: 14 }}>{result.recommendation.fundingSource || '—'}</div>
                        </div>
                        <div>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Expire</span>
                          <div style={{ fontSize: 14 }}>{new Date(result.recommendation.expiresAt).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </div>
                    )}
                    <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      ⚠️ Validation humaine obligatoire — Aucune opération ne sera exécutée automatiquement.
                    </p>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="chat-input-area">
                <input
                  className="input"
                  placeholder="Analyse X-FAB dans mon portefeuille... | Compare cet ETF à mon ACWI..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunAnalysis()}
                  disabled={isRunning}
                  id="analysis-input"
                />
                <button className="btn btn-primary" onClick={handleRunAnalysis} disabled={isRunning || !queryInput.trim()} id="submit-analysis-btn">
                  {isRunning ? <span className="loading-spinner" /> : '🔬 Analyser'}
                </button>
                {result && (
                  <button className="btn btn-secondary" onClick={clearResult} id="clear-analysis-btn">
                    Effacer
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ═══ RISK ═══ */}
          {currentView === 'risk' && (
            <>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Stress Tests Disponibles</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {ALL_SCENARIOS.map((scenario, idx) => (
                    <button
                      key={idx}
                      className="card"
                      onClick={() => handleRunStressTest(idx)}
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

              {selectedStressResult && (
                <div className="card" style={{ animation: 'fadeInUp 0.3s ease' }}>
                  <div className="card-header">
                    <span className="card-title">Résultat : {selectedStressResult.scenario.name}</span>
                    <span className={`badge ${Math.abs(selectedStressResult.portfolioLossPercent) > 20 ? 'badge-rose' : 'badge-amber'}`}>
                      {selectedStressResult.portfolioLossPercent.toFixed(1)}%
                    </span>
                  </div>

                  <div className="grid-3" style={{ marginBottom: 20 }}>
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Perte Portefeuille</span>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-rose)', fontFamily: 'var(--font-mono)' }}>
                        {selectedStressResult.portfolioLoss.toLocaleString('fr-FR')} €
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Coût de Rééquilibrage</span>
                      <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {Math.round(selectedStressResult.rebalanceCostEstimate).toLocaleString('fr-FR')} €
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Impact Objectifs</span>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                        {selectedStressResult.objectiveImpact}
                      </div>
                    </div>
                  </div>

                  {selectedStressResult.contributionByAsset.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 12, textTransform: 'uppercase' }}>Contribution par Actif</h4>
                      {selectedStressResult.contributionByAsset.map((asset, i) => (
                        <div key={i} className="theme-bar-row" style={{ marginBottom: 8 }}>
                          <span className="theme-bar-label">{asset.name}</span>
                          <div className="stress-bar" style={{ flex: 1 }}>
                            <div
                              className={`stress-bar-fill ${Math.abs(asset.contributionPercent) > 5 ? 'high' : Math.abs(asset.contributionPercent) > 2 ? 'medium' : 'low'}`}
                              style={{ width: `${Math.min(Math.abs(asset.contributionPercent) * 3, 100)}%` }}
                            />
                          </div>
                          <span style={{ width: 60, textAlign: 'right', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: asset.contribution < 0 ? 'var(--accent-rose)' : 'var(--text-secondary)' }}>
                            {asset.contributionPercent.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedStressResult.governanceActions.length > 0 && (
                    <div style={{ marginTop: 20, padding: 16, background: 'var(--accent-amber-glow)', borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-amber)', marginBottom: 8 }}>Actions de Gouvernance</h4>
                      {selectedStressResult.governanceActions.map((a, i) => (
                        <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>• {a}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ═══ AUDIT ═══ */}
          {currentView === 'audit' && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Journal d&apos;Audit des Décisions</span>
              </div>
              {history.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: 14, textAlign: 'center', padding: 40 }}>
                  Aucune analyse effectuée pour le moment.<br />
                  Lancez une analyse depuis le Dashboard ou la page Analyse.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {history.map((h) => (
                    <div key={h.id} style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>{h.request.query}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                          {h.completedAt ? new Date(h.completedAt).toLocaleString('fr-FR') : '—'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span className={`badge ${h.request.status === 'complete' ? 'badge-emerald' : h.request.status === 'abstention' ? 'badge-amber' : 'badge-rose'}`}>
                          {h.request.status}
                        </span>
                        {h.recommendation && (
                          <span className="badge badge-cyan">{h.recommendation.action}</span>
                        )}
                        {h.recommendation && (
                          <span className={`confidence-badge ${h.recommendation.confidence}`}>
                            {h.recommendation.confidence}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
