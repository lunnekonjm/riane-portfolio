'use client';

import React, { useState, useEffect, useRef } from 'react';
import { backgroundRunner } from '@/services/agents/backgroundRunner';
import type { AnalysisResult, AnalysisStatus } from '@/types/analysis';
import type { InvestorProfile } from '@/types/portfolio';
import MarkdownRenderer from './MarkdownRenderer';

export interface ChatMessage {
  id: string;
  query: string;
  result: AnalysisResult | null;
  status: AnalysisStatus;
  statusMessage: string;
  createdAt: number;
  appliedAction?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}

export interface ActionableIntent {
  type: 'UPDATE_TARGET_WEIGHTS' | 'UPDATE_MONTHLY_DCA' | 'APPLY_REBALANCE';
  title: string;
  description: string;
  changes: Array<{
    ticker: string;
    label: string;
    field: 'targetWeight' | 'monthlyDCA' | 'annualBudget';
    frequency?: 'monthly' | 'quarterly' | 'semestrial' | 'annual';
    newValue: number;
    formattedValue: string;
  }>;
}

function detectLineFrequency(line: string): 'monthly' | 'quarterly' | 'semestrial' | 'annual' {
  const lineLower = line.toLowerCase();

  if (lineLower.includes('/an') || lineLower.includes('/ an') || lineLower.includes('annuel') || lineLower.includes('par an') || lineLower.includes('€/an')) {
    return 'annual';
  }
  if (lineLower.includes('/trimestre') || lineLower.includes('trimestriel') || lineLower.includes('par trimestre') || lineLower.includes('€/trimestre')) {
    return 'quarterly';
  }
  if (lineLower.includes('/semestre') || lineLower.includes('semestriel') || lineLower.includes('par semestre') || lineLower.includes('€/semestre')) {
    return 'semestrial';
  }
  return 'monthly';
}

export interface ExtractedIntents {
  dcaAction: ActionableIntent | null;
  weightAction: ActionableIntent | null;
}

/**
 * Détecte avec précision les montants DCA (€/mois, €/an, €/trimestre) et allocations cibles (%) préconisés par l'IA.
 */
function extractActionableIntents(query: string, synthesisText: string, positions: any[]): ExtractedIntents {
  if (!synthesisText || !query || positions.length === 0) {
    return { dcaAction: null, weightAction: null };
  }

  const queryLower = query.toLowerCase();

  const isAllocationOrDcaQuery =
    queryLower.includes('allocation') ||
    queryLower.includes('alloc') ||
    queryLower.includes('répartition') ||
    queryLower.includes('répartir') ||
    queryLower.includes('pourcentage') ||
    queryLower.includes('poids') ||
    queryLower.includes('target') ||
    queryLower.includes('cible') ||
    queryLower.includes('recommand') ||
    queryLower.includes('propose') ||
    queryLower.includes('mettre') ||
    queryLower.includes('verser') ||
    queryLower.includes('dca') ||
    queryLower.includes('budget') ||
    queryLower.includes('mensuel') ||
    queryLower.includes('annuel') ||
    queryLower.includes('trimestriel') ||
    queryLower.includes('semestriel') ||
    queryLower.includes('stratégie') ||
    queryLower.includes('rééquilibre') ||
    queryLower.includes('combien');

  if (!isAllocationOrDcaQuery) {
    return { dcaAction: null, weightAction: null };
  }

  const lines = synthesisText.split('\n');
  const dcaChanges: ActionableIntent['changes'] = [];
  const weightChanges: ActionableIntent['changes'] = [];

  const isEnvelopeHeader = (line: string) => {
    const l = line.toLowerCase().trim();
    return (
      (l.includes('le socle') || l.includes('le satellite') || l.includes('le vivier') || l.startsWith('1.') || l.startsWith('2.') || l.startsWith('3.')) &&
      !l.includes('gpea') && !l.includes('pust') && !l.includes('0p0001') && !l.includes('mems') && !l.includes('alrib') && !l.includes('ceg') && !l.includes('cohr') && !l.includes('sym')
    );
  };

  lines.forEach((line) => {
    if (isEnvelopeHeader(line)) return;

    // Compter combien de positions du portefeuille sont présentes sur cette ligne
    const matchingPositionsOnLine = positions.filter((pos) => {
      const tickerClean = pos.ticker.toLowerCase().replace('.pa', '').replace('.f', '');
      const tickerFull = pos.ticker.toLowerCase();
      const posName = pos.name.toLowerCase();
      const lineLower = line.toLowerCase();
      return (
        lineLower.includes(tickerClean) ||
        lineLower.includes(tickerFull) ||
        (posName.length > 3 && lineLower.includes(posName.split(' ')[0]))
      );
    });

    if (matchingPositionsOnLine.length > 0) {
      const freq = detectLineFrequency(line);

      // 1. Détection des montants DCA en Euros (€, €/mois, €/an) sur cette ligne
      let euroMatch = null;
      if (freq === 'annual') {
        euroMatch = line.match(/(?:[–\-—:]\s*|\()\s*(\d+(?:[\s.,]\d+)?)\s*(?:€|euros?)\s*(?:\/\s*an|annuels?|par an)?/i);
      } else {
        euroMatch = line.match(/(?:[–\-—:]\s*|\()\s*(\d+(?:[\s.,]\d+)?)\s*(?:€|euros?|€\/mois)?/i);
      }

      if (euroMatch && euroMatch[1]) {
        const rawVal = parseFloat(euroMatch[1].replace(/\s/g, '').replace(',', '.'));
        // Si plusieurs positions sont sur la même ligne (ex: CTO 6000 €/an : COHR, CEG, SYM), on divise le total par le nombre de positions
        const valPerPos = Math.round(rawVal / matchingPositionsOnLine.length);

        if (valPerPos > 0 && valPerPos <= 100000) {
          matchingPositionsOnLine.forEach((pos) => {
            if (!dcaChanges.some((c) => c.ticker === pos.ticker)) {
              const labelFreq = freq === 'annual' ? '€/an (Annuel)' : freq === 'quarterly' ? '€/trimestre' : '€/mois';
              dcaChanges.push({
                ticker: pos.ticker,
                label: pos.name,
                field: freq === 'annual' ? 'annualBudget' : 'monthlyDCA',
                frequency: freq,
                newValue: valPerPos,
                formattedValue: `${valPerPos.toLocaleString('fr-FR')} ${labelFreq}`,
              });
            }
          });
        }
      }

      // 2. Détection du pourcentage cible (%) sur cette ligne
      const pctMatch = line.match(/(?:[–\-—:]\s*|\()\s*(\d+(?:[.,]\d+)?)\s*%/i);
      if (pctMatch && pctMatch[1]) {
        const rawPct = parseFloat(pctMatch[1].replace(',', '.'));
        const pctPerPos = rawPct / matchingPositionsOnLine.length;
        if (pctPerPos > 0 && pctPerPos <= 100) {
          matchingPositionsOnLine.forEach((pos) => {
            if (!weightChanges.some((c) => c.ticker === pos.ticker)) {
              weightChanges.push({
                ticker: pos.ticker,
                label: pos.name,
                field: 'targetWeight',
                newValue: pctPerPos / 100,
                formattedValue: `${pctPerPos.toFixed(1)}%`,
              });
            }
          });
        }
      }
    }
  });

  // Fallback : si aucun actif individuel n'a été parsé mais que des montants par enveloppe sont présents (ex: CTO 6000€/an ou 500€/mois)
  if (dcaChanges.length === 0) {
    const envelopeDcaMap: Record<string, { amount: number; freq: 'monthly' | 'quarterly' | 'semestrial' | 'annual' }> = {};

    lines.forEach((line) => {
      const lineFreq = detectLineFrequency(line);

      // Match CTO, PEA, PEA-PME
      const ctoMatch = line.match(/cto[^\n]*?(\d+(?:[.,]\d+)?)\s*(?:€|euros?)/i);
      const peaPmeMatch = line.match(/pea-pme[^\n]*?(\d+(?:[.,]\d+)?)\s*(?:€|euros?)/i);
      const peaMatch = line.match(/(?:^|[^a-z0-9])pea(?:[^a-z0-9-][^\n]*?)(\d+(?:[.,]\d+)?)\s*(?:€|euros?)/i);

      if (ctoMatch && ctoMatch[1]) envelopeDcaMap['CTO'] = { amount: parseFloat(ctoMatch[1].replace(',', '.')), freq: lineFreq };
      if (peaPmeMatch && peaPmeMatch[1]) envelopeDcaMap['PEA-PME'] = { amount: parseFloat(peaPmeMatch[1].replace(',', '.')), freq: lineFreq };
      else if (peaMatch && peaMatch[1]) envelopeDcaMap['PEA'] = { amount: parseFloat(peaMatch[1].replace(',', '.')), freq: lineFreq };
    });

    Object.entries(envelopeDcaMap).forEach(([env, data]) => {
      const envPositions = positions.filter((p) => (p.envelope || '').toUpperCase() === env);
      if (envPositions.length > 0 && data.amount > 0) {
        const perPos = Math.round(data.amount / envPositions.length);
        envPositions.forEach((p) => {
          const labelFreq = data.freq === 'annual' ? '€/an (Annuel)' : data.freq === 'quarterly' ? '€/trimestre' : '€/mois';
          dcaChanges.push({
            ticker: p.ticker,
            label: p.name,
            field: data.freq === 'annual' ? 'annualBudget' : 'monthlyDCA',
            frequency: data.freq,
            newValue: perPos,
            formattedValue: `${perPos.toLocaleString('fr-FR')} ${labelFreq}`,
          });
        });
      }
    });
  }

  const primaryFreq = dcaChanges.length > 0 ? (dcaChanges[0].frequency || 'monthly') : 'monthly';
  const freqTitle = primaryFreq === 'annual' ? 'Annuels (€/an)' : primaryFreq === 'quarterly' ? 'Trimestriels (€/trimestre)' : 'Mensuels (€/mois)';

  const dcaAction: ActionableIntent | null =
    dcaChanges.length > 0
      ? {
          type: 'UPDATE_MONTHLY_DCA',
          title: `Mise à jour des Versements DCA ${freqTitle}`,
          description: `Sur la base des recommandations de l'IA, voici la répartition de vos versements ${primaryFreq === 'annual' ? 'annuels' : 'mensuels'} :`,
          changes: dcaChanges,
        }
      : null;

  const weightAction: ActionableIntent | null =
    weightChanges.length > 0
      ? {
          type: 'UPDATE_TARGET_WEIGHTS',
          title: 'Mise à jour de l\'Allocation Cible (% du Portefeuille)',
          description: `Sur la base des recommandations de l'IA, voici la répartition cible préconisée :`,
          changes: weightChanges,
        }
      : null;

  return { dcaAction, weightAction };
}

interface AnalysisChatViewProps {
  userUid: string;
  positions: any[];
  config: any;
  investorProfile?: InvestorProfile | null;
  updatePosition: (pos: any, customReason?: string) => Promise<any>;
  updateConfig: (cfg: any) => Promise<any>;
  onOpenGlossary: (term?: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}



export function AnalysisChatView({
  userUid,
  positions,
  config,
  investorProfile,
  updatePosition,
  updateConfig,
  onOpenGlossary,
  showToast,
}: AnalysisChatViewProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [applyingActionMsgId, setApplyingActionMsgId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Charger les sessions initiales & Auto-recovery
  useEffect(() => {
    let initialSessions = backgroundRunner.recoverStuckMessages(userUid, positions, config);
    if (initialSessions.length === 0) {
      const newSession: ChatSession = {
        id: `session_${Date.now()}`,
        title: 'Nouvelle Discussion',
        createdAt: Date.now(),
        messages: [],
      };
      initialSessions = [newSession];
      backgroundRunner.setSessions(initialSessions);
    }

    setSessions(initialSessions);
    if (!activeSessionId) {
      setActiveSessionId(initialSessions[0].id);
    }
  }, [userUid, positions, config]);

  // Synchronisation dynamique via CustomEvents émises par backgroundRunner
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUpdate = (e: any) => {
      const updated = e?.detail?.updatedSessions;
      if (updated && Array.isArray(updated)) {
        setSessions(updated);
      }
    };

    const handleComplete = (e: any) => {
      handleUpdate(e);
      setIsRunning(false);
      const detail = e.detail;
      if (detail && detail.query) {
        showToast(`🎉 Analyse terminée pour "${detail.query.slice(0, 25)}..."`);
      }
      scrollToBottom();
    };

    const handleError = (e: any) => {
      handleUpdate(e);
      setIsRunning(false);
      if (e.detail?.error) {
        showToast(e.detail.error, 'error');
      }
    };

    window.addEventListener('riane_analysis_update', handleUpdate);
    window.addEventListener('riane_analysis_complete', handleComplete);
    window.addEventListener('riane_analysis_error', handleError);

    return () => {
      window.removeEventListener('riane_analysis_update', handleUpdate);
      window.removeEventListener('riane_analysis_complete', handleComplete);
      window.removeEventListener('riane_analysis_error', handleError);
    };
  }, [showToast]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'Nouvelle Discussion',
      createdAt: Date.now(),
      messages: [],
    };
    const updated = [newSession, ...sessions];
    backgroundRunner.setSessions(updated);
    setSessions(updated);
    setActiveSessionId(newSession.id);
    setQueryInput('');
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Voulez-vous supprimer cette discussion de votre historique ?')) {
      const filtered = sessions.filter((s) => s.id !== sessionId);
      backgroundRunner.setSessions(filtered);
      setSessions(filtered);
      if (activeSessionId === sessionId) {
        if (filtered.length > 0) {
          setActiveSessionId(filtered[0].id);
        } else {
          createNewSession();
        }
      }
      showToast('Discussion supprimée');
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const handleApplyAction = async (msgId: string, action: ActionableIntent) => {
    setApplyingActionMsgId(msgId);
    try {
      const updatedLabels: string[] = [];

      for (const change of action.changes) {
        const pos = positions.find(
          (p) =>
            p.ticker.toUpperCase() === change.ticker.toUpperCase() ||
            p.name.toLowerCase().includes(change.label.toLowerCase()) ||
            change.label.toLowerCase().includes(p.name.toLowerCase())
        );
        if (pos) {
          if (change.field === 'targetWeight') {
            await updatePosition({
              ...pos,
              targetWeight: change.newValue,
              updatedAt: Date.now(),
            });
            updatedLabels.push(`${pos.name} (${change.formattedValue})`);
          } else if (change.field === 'monthlyDCA' || change.field === 'annualBudget') {
            const freq = change.frequency || 'monthly';
            if (freq === 'annual') {
              const annualVal = change.newValue;
              const monthlyVal = Math.round(annualVal / 12);
              await updatePosition({
                ...pos,
                dcaFrequency: 'annual',
                annualBudget: annualVal,
                monthlyDCA: monthlyVal,
                updatedAt: Date.now(),
              });
            } else {
              const monthlyVal = change.newValue;
              await updatePosition({
                ...pos,
                dcaFrequency: freq,
                monthlyDCA: monthlyVal,
                annualBudget: undefined,
                updatedAt: Date.now(),
              });
            }
            updatedLabels.push(`${pos.name} (${change.formattedValue})`);
          }
        }
      }

      const updatedSessions = sessions.map((session) => {
        if (session.id === activeSession?.id) {
          return {
            ...session,
            messages: session.messages.map((m) =>
              m.id === msgId ? { ...m, appliedAction: true } : m
            ),
          };
        }
        return session;
      });

      backgroundRunner.setSessions(updatedSessions);
      setSessions(updatedSessions);

      if (updatedLabels.length > 0) {
        showToast(`🎉 Portefeuille mis à jour : ${updatedLabels.join(' · ')}`);
      } else {
        showToast('Aucune position correspondante n\'a pu être identifiée dans votre portefeuille.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Erreur lors de l\'application automatique de l\'action', 'error');
    } finally {
      setApplyingActionMsgId(null);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || queryInput).trim();
    if (!textToSend || isRunning) return;

    if (positions.length === 0) {
      showToast('Ajoutez au moins une position avant de lancer une analyse', 'error');
      return;
    }

    if (!customPrompt) {
      setQueryInput('');
    }

    setIsRunning(true);

    const messageId = `msg_${Date.now()}`;
    const targetSessionId = activeSession?.id || activeSessionId || `session_${Date.now()}`;
    const sessionTitle = textToSend.length > 30 ? textToSend.slice(0, 30) + '...' : textToSend;

    const newMsg: ChatMessage = {
      id: messageId,
      query: textToSend,
      result: null,
      status: 'pending',
      statusMessage: 'Lancement du pipeline multi-agents...',
      createdAt: Date.now(),
    };

    // 1. Enregistrement canonique immédiat dans backgroundRunner
    const updatedSessions = backgroundRunner.registerMessage(
      targetSessionId,
      sessionTitle,
      newMsg
    );

    // 2. Mise à jour immédiate du React state
    setSessions(updatedSessions);
    setActiveSessionId(targetSessionId);
    scrollToBottom();

    // 3. Démarrage de la tâche en arrière-plan
    backgroundRunner.startTask(
      messageId,
      targetSessionId,
      textToSend,
      userUid,
      positions,
      config,
      investorProfile
    );
  };

  const suggestedPrompts = [
    'Analyse mon portefeuille et les répartitions par cible pourcentage',
    'Analyse Coherent (COHR) et son exposition IA',
    'Faut-il rééquilibrer Riber ou accumuler sur baisse ?',
    'Compare Constellation Energy à mon allocation ACWI',
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: 16,
        minHeight: 'calc(100vh - 160px)',
        alignItems: 'stretch',
      }}
    >
      {/* 📜 SIDEBAR HISTORIQUE DES DISCUSSIONS */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxHeight: 'calc(100vh - 180px)',
          overflowY: 'auto',
        }}
      >
        <button
          type="button"
          className="btn btn-primary"
          onClick={createNewSession}
          style={{
            width: '100%',
            justifyContent: 'center',
            gap: 8,
            fontWeight: 700,
            padding: '10px 14px',
            fontSize: 13,
          }}
          id="new-chat-btn"
        >
          <span>➕</span> Nouvelle Discussion
        </button>

        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: 8 }}>
          Historique des Analyses ({sessions.length})
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflowY: 'auto' }}>
          {sessions.map((s) => {
            const isActive = s.id === activeSession?.id;
            return (
              <div
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-tertiary)',
                  border: isActive ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--accent-cyan)' : 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    💬 {s.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {new Date(s.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {s.messages.length} message(s)
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => deleteSession(s.id, e)}
                  title="Supprimer la discussion"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: '2px 4px',
                  }}
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 💬 ZONE PRINCIPALE DE DISCUSSION MULTI-TOURS */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-tertiary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔬</span>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{activeSession?.title || 'Analyse IA'}</h3>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                Multi-Agents Gemini 3.5 Lite / 3.6 Flash · Background Task Active ⚡
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11, color: 'var(--accent-cyan)' }}
            onClick={() => onOpenGlossary()}
          >
            📚 Lexique & Explications
          </button>
        </div>

        <div
          style={{
            flex: 1,
            padding: 20,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            maxHeight: 'calc(100vh - 320px)',
          }}
        >
          {(!activeSession || activeSession.messages.length === 0) && (
            <div
              style={{
                textAlign: 'center',
                margin: 'auto',
                maxWidth: 480,
                padding: 30,
                background: 'var(--bg-tertiary)',
                borderRadius: 16,
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Analyste Financier IA RIANE</h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Posez une question sur n&apos;importe quelle valeur de votre portefeuille. L&apos;analyse s&apos;exécute en arrière-plan même si vous naviguez dans l&apos;application.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ justifyContent: 'flex-start', textAlign: 'left', fontSize: 12, padding: '8px 12px' }}
                    onClick={() => handleSendMessage(prompt)}
                  >
                    💡 {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSession?.messages.map((msg) => {
            const { dcaAction, weightAction } = msg.result?.synthesis
              ? extractActionableIntents(msg.query, msg.result.synthesis, positions)
              : { dcaAction: null, weightAction: null };

            const detectedActions = [dcaAction, weightAction].filter(Boolean) as ActionableIntent[];

            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                  style={{
                    alignSelf: 'flex-end',
                    maxWidth: '80%',
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(124, 58, 237, 0.2))',
                    border: '1px solid var(--accent-cyan)',
                    padding: '12px 16px',
                    borderRadius: '16px 16px 4px 16px',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                >
                  👤 {msg.query}
                </div>

                {msg.status !== 'synthesis' && msg.status !== 'error' && (
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      maxWidth: '85%',
                      background: 'var(--bg-tertiary)',
                      padding: '12px 16px',
                      borderRadius: '16px 16px 16px 4px',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 13,
                      color: 'var(--accent-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span className="loading-spinner" style={{ width: 16, height: 16 }} />
                    {msg.statusMessage || 'Analyse multi-agents en arrière-plan...'}
                  </div>
                )}

                {msg.result && (
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      maxWidth: '90%',
                      background: 'var(--bg-tertiary)',
                      padding: 20,
                      borderRadius: '16px 16px 16px 4px',
                      border: '1px solid var(--border-accent)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="badge badge-cyan">🎯 Synthèse Analyste IA</span>
                        {msg.result.research?.isGrounded && <span className="badge badge-emerald">✨ Ancrage Web Direct</span>}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {msg.result.synthesis ? (
                      <MarkdownRenderer content={msg.result.synthesis} />
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {msg.result.research?.fundamentals?.summary || 'Analyse terminée avec succès.'}
                      </p>
                    )}

                    {/* ⚡ BANNIÈRES D'ACTIONS INTERACTIVES 1-CLICK */}
                    {detectedActions.map((action, actIdx) => (
                      <div
                        key={`${action.type}_${actIdx}`}
                        style={{
                          marginTop: 18,
                          padding: 16,
                          background: action.type === 'UPDATE_MONTHLY_DCA'
                            ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(16, 185, 129, 0.12))'
                            : 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(6, 182, 212, 0.12))',
                          borderRadius: 12,
                          border: `1px solid ${action.type === 'UPDATE_MONTHLY_DCA' ? 'var(--accent-cyan)' : 'var(--accent-purple)'}`,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 20 }}>⚡</span>
                          <strong style={{ fontSize: 14, color: action.type === 'UPDATE_MONTHLY_DCA' ? 'var(--accent-cyan)' : 'var(--accent-purple)' }}>
                            {action.title}
                          </strong>
                        </div>

                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.4 }}>
                          {action.description}
                        </p>

                        <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)', marginBottom: 14 }}>
                          {action.changes.map((c, i) => (
                            <div key={i} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                              • <span style={{ color: 'var(--accent-cyan)' }}>{c.label} ({c.ticker})</span> ➔ Cible préconisée : <span style={{ color: 'var(--accent-emerald)' }}>{c.formattedValue}</span>
                            </div>
                          ))}
                        </div>

                        {msg.appliedAction ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--accent-emerald)' }}>
                            <span>✅</span> Paramètres mis à jour automatiquement sur votre portefeuille !
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handleApplyAction(msg.id, action)}
                            disabled={applyingActionMsgId === msg.id}
                            style={{
                              width: '100%',
                              justifyContent: 'center',
                              padding: '10px 16px',
                              fontWeight: 700,
                              fontSize: 13,
                              background: action.type === 'UPDATE_MONTHLY_DCA'
                                ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-emerald))'
                                : 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))',
                            }}
                          >
                            {applyingActionMsgId === msg.id ? (
                              <span className="loading-spinner" />
                            ) : (
                              `⚡ Appliquer les ${action.type === 'UPDATE_MONTHLY_DCA' ? 'versements DCA (€/mois)' : 'allocations cibles (%)'} au portefeuille`
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        <div
          style={{
            padding: 16,
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <input
            className="input"
            placeholder="Posez une question sur une valeur ou une stratégie (ex: Analyse Riber, Allègement Symbotic)..."
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isRunning}
            style={{ flex: 1, padding: '12px 16px', fontSize: 14 }}
            id="analysis-chat-input"
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSendMessage()}
            disabled={isRunning || !queryInput.trim()}
            style={{ padding: '12px 20px', fontWeight: 700, gap: 8 }}
            id="analysis-chat-send-btn"
          >
            {isRunning ? <span className="loading-spinner" /> : '🚀 Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
}
