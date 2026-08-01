'use client';

import React, { useState, useEffect, useRef } from 'react';
import { runAnalysisPipeline, type StatusCallback } from '@/services/agents/orchestrator';
import type { AnalysisResult, AnalysisStatus } from '@/types/analysis';
import MarkdownRenderer from './MarkdownRenderer';

export interface ChatMessage {
  id: string;
  query: string;
  result: AnalysisResult | null;
  status: AnalysisStatus;
  statusMessage: string;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}

interface AnalysisChatViewProps {
  userUid: string;
  positions: any[];
  config: any;
  onOpenGlossary: (term?: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const LOCAL_STORAGE_KEY = 'riane_chat_sessions_v1';

export function AnalysisChatView({
  userUid,
  positions,
  config,
  onOpenGlossary,
  showToast,
}: AnalysisChatViewProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Charger les sessions sauvegardées depuis localStorage au montage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed: ChatSession[] = JSON.parse(saved);
          if (parsed && parsed.length > 0) {
            setSessions(parsed);
            setActiveSessionId(parsed[0].id);
            return;
          }
        }
      } catch (err) {
        console.warn('[AnalysisChatView] Erreur de chargement du localStorage:', err);
      }
    }
    // Si aucune session n'existe, en créer une nouvelle par défaut
    createNewSession();
  }, []);

  // Sauvegarder dans localStorage dès que la liste des sessions change
  useEffect(() => {
    if (typeof window !== 'undefined' && sessions.length > 0) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
      } catch (err) {
        console.warn('[AnalysisChatView] Erreur de sauvegarde du localStorage:', err);
      }
    }
  }, [sessions]);

  // Fait défiler automatiquement vers le bas de la discussion
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
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setQueryInput('');
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Voulez-vous supprimer cette discussion de votre historique ?')) {
      const filtered = sessions.filter((s) => s.id !== sessionId);
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

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || queryInput).trim();
    if (!textToSend || isRunning) return;

    if (positions.length === 0) {
      showToast('Ajoutez au moins une position avant de lancer une analyse', 'error');
      return;
    }

    // 1. EFFACER IMMÉDIATEMENT LA BARRE DE SAISIE (Subtilité UI/UX demandée)
    if (!customPrompt) {
      setQueryInput('');
    }

    setIsRunning(true);

    const messageId = `msg_${Date.now()}`;
    const newMsg: ChatMessage = {
      id: messageId,
      query: textToSend,
      result: null,
      status: 'pending',
      statusMessage: 'Collecte des données & Ancrage IA...',
      createdAt: Date.now(),
    };

    // Mettre à jour le titre de la session si c'est le premier message
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === (activeSession?.id || activeSessionId)) {
          const isFirstMessage = s.messages.length === 0;
          const newTitle = isFirstMessage
            ? textToSend.length > 30
              ? textToSend.slice(0, 30) + '...'
              : textToSend
            : s.title;
          return {
            ...s,
            title: newTitle,
            messages: [...s.messages, newMsg],
          };
        }
        return s;
      })
    );

    scrollToBottom();

    const onStatus: StatusCallback = (s, msg) => {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id === (activeSession?.id || activeSessionId)) {
            return {
              ...session,
              messages: session.messages.map((m) =>
                m.id === messageId ? { ...m, status: s, statusMessage: msg } : m
              ),
            };
          }
          return session;
        })
      );
    };

    try {
      const defaultConfig = {
        monthlyBudget: 1000,
        annualCTOBudget: 8000,
        annualSpeculativeCap: 2000,
        riskProfile: 'dynamic' as const,
        noLeverage: true,
        rebalanceByFlows: true,
        baseCurrency: 'EUR' as const,
        horizonYears: 15,
      };

      const result = await runAnalysisPipeline(
        userUid,
        textToSend,
        positions,
        config || defaultConfig,
        onStatus
      );

      setSessions((prev) =>
        prev.map((session) => {
          if (session.id === (activeSession?.id || activeSessionId)) {
            return {
              ...session,
              messages: session.messages.map((m) =>
                m.id === messageId
                  ? { ...m, result, status: 'synthesis', statusMessage: 'Analyse terminée' }
                  : m
              ),
            };
          }
          return session;
        })
      );
    } catch (err: any) {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id === (activeSession?.id || activeSessionId)) {
            return {
              ...session,
              messages: session.messages.map((m) =>
                m.id === messageId
                  ? { ...m, status: 'error', statusMessage: err.message || 'Erreur lors de l\'analyse' }
                  : m
              ),
            };
          }
          return session;
        })
      );
    } finally {
      setIsRunning(false);
      scrollToBottom();
    }
  };

  const suggestedPrompts = [
    'Analyse Coherent (COHR) et son exposition IA',
    'Faut-il rééquilibrer Riber ou accumuler sur baisse ?',
    'Évalue le risque global de mon portefeuille PEA',
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
      {/* 📜 SIDEBAR HISTORIQUE DES DISCUSSIONS (Style Gemini / Claude / ChatGPT) */}
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
        {/* En-tête de la discussion active */}
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
                Multi-Agents Gemini 3.5 Lite / 3.6 Flash · Ancrage Web Deep Search
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

        {/* Fil des messages multi-tours */}
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
                Posez une question sur n&apos;importe quelle valeur de votre portefeuille. L&apos;IA croisera les cours du marché, vos performances et 15 articles de presse réels.
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

          {activeSession?.messages.map((msg, index) => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Message de l'utilisateur */}
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

              {/* Statut de chargement pendant l'analyse */}
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
                  {msg.statusMessage || 'Analyse multi-agents en cours...'}
                </div>
              )}

              {/* Réponse de l'Assistant IA (Synthèse Générée) */}
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

                  {/* Formatage Markdown propre */}
                  {msg.result.synthesis ? (
                    <MarkdownRenderer content={msg.result.synthesis} />
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {msg.result.research?.fundamentals?.summary || 'Analyse terminée avec succès.'}
                    </p>
                  )}

                  {msg.result.recommendation && (
                    <div style={{ marginTop: 14, padding: 12, background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-subtle)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Action</span>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-cyan)' }}>{msg.result.recommendation.action}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Poids Cible</span>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{(msg.result.recommendation.weight * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Confiance</span>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-emerald)' }}>{msg.result.recommendation.confidence.toUpperCase()}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* ✏️ BARRE D'ÉCRITURE & ENVOI DE QUESTION */}
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
