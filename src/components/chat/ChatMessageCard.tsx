'use client';

import React from 'react';
import type { ChatMessage, ActionableIntent } from '@/components/AnalysisChatView';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface ChatMessageCardProps {
  msg: ChatMessage;
  detectedActions: ActionableIntent[];
  applyingActionMsgId: string | null;
  onApplyAction: (msgId: string, action: ActionableIntent) => Promise<void>;
}

export function ChatMessageCard({
  msg,
  detectedActions,
  applyingActionMsgId,
  onApplyAction,
}: ChatMessageCardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 👤 Question de l'utilisateur */}
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

      {/* ⏳ En cours d'analyse */}
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

      {/* 🎯 Résultat de l'analyse */}
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-cyan">🎯 Synthèse Analyste IA</span>
              {msg.result.research?.isGrounded && <span className="badge badge-emerald">✨ Ancrage Web Direct</span>}
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
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
                background:
                  action.type === 'UPDATE_MONTHLY_DCA'
                    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(16, 185, 129, 0.12))'
                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(6, 182, 212, 0.12))',
                borderRadius: 12,
                border: `1px solid ${action.type === 'UPDATE_MONTHLY_DCA' ? 'var(--accent-cyan)' : 'var(--accent-purple)'}`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <strong
                  style={{
                    fontSize: 14,
                    color: action.type === 'UPDATE_MONTHLY_DCA' ? 'var(--accent-cyan)' : 'var(--accent-purple)',
                  }}
                >
                  {action.title}
                </strong>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.4 }}>
                {action.description}
              </p>

              <div
                style={{
                  background: 'var(--bg-secondary)',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  marginBottom: 14,
                }}
              >
                {action.changes.map((c, i) => (
                  <div key={i} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    • <span style={{ color: 'var(--accent-cyan)' }}>{c.label} ({c.ticker})</span> ➔ Cible préconisée :{' '}
                    <span style={{ color: 'var(--accent-emerald)' }}>{c.formattedValue}</span>
                  </div>
                ))}
              </div>

              {msg.appliedAction ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--accent-emerald)',
                  }}
                >
                  <span>✅</span> Paramètres mis à jour automatiquement sur votre portefeuille !
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onApplyAction(msg.id, action)}
                  disabled={applyingActionMsgId === msg.id}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '10px 16px',
                    fontWeight: 700,
                    fontSize: 13,
                    background:
                      action.type === 'UPDATE_MONTHLY_DCA'
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
}
